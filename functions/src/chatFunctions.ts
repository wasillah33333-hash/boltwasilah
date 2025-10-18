import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as natural from 'natural';
import * as stringSimilarity from 'string-similarity';

const db = admin.firestore();

// In-memory cache for KB data
let kbCache: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Profanity filter - simple wordlist
const PROFANITY_WORDS = [
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'fool', 'dumb',
  'hate', 'kill', 'die', 'death', 'blood', 'violence', 'attack'
];

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ChatMessage {
  sender: 'user' | 'bot' | 'admin';
  text: string;
  createdAt: admin.firestore.Timestamp;
  meta?: any;
}

interface KbEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
}

interface MatchResult {
  confidence: number;
  answer: string;
  faqId: string;
  question: string;
}

/**
 * Load KB data from Firestore with caching
 */
async function loadKbData(): Promise<KbEntry[]> {
  const now = Date.now();
  
  if (kbCache.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    return kbCache;
  }

  try {
    const snapshot = await db.collection('kb/faqs').get();
    kbCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as KbEntry[];
    cacheTimestamp = now;
    return kbCache;
  } catch (error) {
    console.error('Error loading KB data:', error);
    return [];
  }
}

/**
 * Clean and tokenize text for matching
 */
function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Check for profanity and redact
 */
function filterProfanity(text: string): string {
  let filteredText = text;
  PROFANITY_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
}

/**
 * Check rate limiting
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (userLimit.count >= 5) { // Max 5 messages per minute
    return false;
  }
  
  userLimit.count++;
  return true;
}

/**
 * Get recent chat context
 */
async function getChatContext(userId: string, chatId: string): Promise<{
  memorySummary: string;
  recentMessages: ChatMessage[];
}> {
  try {
    const chatDoc = await db.doc(`users/${userId}/chats/${chatId}`).get();
    const chatData = chatDoc.data();
    
    const messagesSnapshot = await db
      .collection(`users/${userId}/chats/${chatId}/messages`)
      .orderBy('createdAt', 'desc')
      .limit(6)
      .get();
    
    const recentMessages = messagesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
      .reverse();
    
    return {
      memorySummary: chatData?.memorySummary || '',
      recentMessages
    };
  } catch (error) {
    console.error('Error getting chat context:', error);
    return { memorySummary: '', recentMessages: [] };
  }
}

/**
 * Primary keyword matching
 */
function keywordMatch(userMessage: string, kbEntry: KbEntry): number {
  const userTokens = tokenizeText(userMessage);
  const entryKeywords = kbEntry.keywords.map(k => k.toLowerCase());
  const entryQuestionTokens = tokenizeText(kbEntry.question);
  
  const allKeywords = [...entryKeywords, ...entryQuestionTokens];
  const matches = userTokens.filter(token => 
    allKeywords.some(keyword => keyword.includes(token) || token.includes(keyword))
  );
  
  return matches.length / Math.max(userTokens.length, 1);
}

/**
 * Fuzzy matching using TF-IDF and string similarity
 */
function fuzzyMatch(userMessage: string, kbEntry: KbEntry): number {
  const userTokens = tokenizeText(userMessage);
  const entryTokens = tokenizeText(kbEntry.question);
  
  // TF-IDF similarity
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(userTokens);
  tfidf.addDocument(entryTokens);
  
  const tfidfScore = tfidf.tfidf(entryTokens, 1);
  
  // String similarity
  const similarity = stringSimilarity.compareTwoStrings(
    userMessage.toLowerCase(),
    kbEntry.question.toLowerCase()
  );
  
  // Combine scores
  return (tfidfScore + similarity) / 2;
}

/**
 * Find best KB match
 */
async function findBestMatch(
  userMessage: string,
  context: { memorySummary: string; recentMessages: ChatMessage[] }
): Promise<MatchResult | null> {
  const kbData = await loadKbData();
  if (kbData.length === 0) return null;
  
  const matches: Array<MatchResult & { score: number }> = [];
  
  for (const entry of kbData) {
    // Primary keyword matching
    const keywordScore = keywordMatch(userMessage, entry);
    
    // Secondary fuzzy matching
    const fuzzyScore = fuzzyMatch(userMessage, entry);
    
    // Context matching (check against memory summary and recent messages)
    const contextText = context.memorySummary + ' ' + 
      context.recentMessages.map(m => m.text).join(' ');
    const contextScore = keywordMatch(contextText, entry);
    
    // Weighted final score
    const finalScore = (keywordScore * 0.5) + (fuzzyScore * 0.3) + (contextScore * 0.2);
    
    if (finalScore > 0.1) { // Minimum threshold
      matches.push({
        confidence: finalScore,
        answer: entry.answer,
        faqId: entry.id,
        question: entry.question,
        score: finalScore
      });
    }
  }
  
  // Sort by confidence and return best match
  matches.sort((a, b) => b.score - a.score);
  
  const bestMatch = matches[0];
  const MATCH_THRESHOLD = 0.6; // Configurable threshold
  
  if (bestMatch && bestMatch.confidence >= MATCH_THRESHOLD) {
    return {
      confidence: bestMatch.confidence,
      answer: bestMatch.answer,
      faqId: bestMatch.faqId,
      question: bestMatch.question
    };
  }
  
  return null;
}

/**
 * Generate fallback response
 */
function generateFallbackResponse(): string {
  return "I'm sorry — we don't have that information right now. We'll review your question and an admin will reach out to you soon.";
}

/**
 * Update chat memory summary
 */
async function updateMemorySummary(
  userId: string, 
  chatId: string, 
  newMessage: string, 
  botResponse: string
): Promise<void> {
  try {
    const chatRef = db.doc(`users/${userId}/chats/${chatId}`);
    const chatDoc = await chatRef.get();
    const currentSummary = chatDoc.data()?.memorySummary || '';
    
    // Simple memory update - keep last 3 interactions
    const summaryParts = currentSummary.split(' | ').slice(-2);
    summaryParts.push(`${newMessage} -> ${botResponse}`);
    
    const newSummary = summaryParts.join(' | ');
    
    await chatRef.update({
      memorySummary: newSummary,
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating memory summary:', error);
  }
}

/**
 * Main chat function - matchKbAnswer
 */
export const matchKbAnswer = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { userId, chatId, message, meta } = data;
  
  // Validate input
  if (!userId || !chatId || !message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }
  
  // Verify user owns the chat
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'User can only access their own chats');
  }
  
  // Check rate limiting
  if (!checkRateLimit(userId)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please wait before sending another message.');
  }
  
  try {
    // Check if chat is taken over by admin
    const chatDoc = await db.doc(`users/${userId}/chats/${chatId}`).get();
    const chatData = chatDoc.data();
    
    if (chatData?.takeoverBy) {
      // Chat is taken over by admin, don't send bot response
      return {
        success: false,
        message: 'Chat is being handled by an admin',
        botResponse: null
      };
    }
    
    // Filter profanity from user message
    const filteredMessage = filterProfanity(message);
    
    // Save user message
    const userMessageRef = await db
      .collection(`users/${userId}/chats/${chatId}/messages`)
      .add({
        sender: 'user',
        text: filteredMessage,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        meta: meta || {}
      });
    
    // Get chat context
    const context = await getChatContext(userId, chatId);
    
    // Find best KB match
    const match = await findBestMatch(filteredMessage, context);
    
    let botResponse: string;
    let isKbMatch = false;
    
    if (match) {
      // Truncate answer if too long
      botResponse = match.answer.length > 500 
        ? match.answer.substring(0, 500) + '... [Read more in our Knowledge Base]'
        : match.answer;
      isKbMatch = true;
    } else {
      botResponse = generateFallbackResponse();
    }
    
    // Save bot response
    const botMessageRef = await db
      .collection(`users/${userId}/chats/${chatId}/messages`)
      .add({
        sender: 'bot',
        text: botResponse,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        meta: {
          isKbMatch,
          confidence: match?.confidence || 0,
          faqId: match?.faqId || null
        }
      });
    
    // Update memory summary
    await updateMemorySummary(userId, chatId, filteredMessage, botResponse);
    
    // Log audit
    await db.collection('chats_audit').add({
      actorUid: userId,
      action: 'bot_response',
      payload: {
        chatId,
        userMessage: filteredMessage,
        botResponse,
        isKbMatch,
        confidence: match?.confidence || 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Bot response generated',
      botResponse,
      isKbMatch,
      confidence: match?.confidence || 0
    };
    
  } catch (error) {
    console.error('Error in matchKbAnswer:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while processing your message');
  }
});