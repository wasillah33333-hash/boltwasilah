import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface KbEntry {
  question: string;
  answer: string;
  keywords: string[];
  tags: string[];
}

/**
 * Seed Knowledge Base from JSON data
 */
export const seedKb = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is admin
  const userDoc = await db.doc(`users/${context.auth.uid}`).get();
  const userData = userDoc.data();
  
  if (!userData?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can seed the knowledge base');
  }
  
  const { kbData, clearExisting = false } = data;
  
  if (!kbData || !Array.isArray(kbData)) {
    throw new functions.https.HttpsError('invalid-argument', 'kbData must be an array');
  }
  
  try {
    const batch = db.batch();
    let operationCount = 0;
    
    // Clear existing data if requested
    if (clearExisting) {
      const existingSnapshot = await db.collection('kb/faqs').get();
      existingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        operationCount++;
      });
    }
    
    // Add new entries
    for (const entry of kbData) {
      if (!entry.question || !entry.answer) {
        console.warn('Skipping invalid entry:', entry);
        continue;
      }
      
      const docRef = db.collection('kb/faqs').doc();
      batch.set(docRef, {
        question: entry.question,
        answer: entry.answer,
        keywords: entry.keywords || [],
        tags: entry.tags || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      operationCount++;
      
      // Firestore batch limit is 500 operations
      if (operationCount >= 450) {
        await batch.commit();
        operationCount = 0;
      }
    }
    
    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
    }
    
    // Log audit
    await db.collection('chats_audit').add({
      actorUid: context.auth.uid,
      action: 'kb_seeded',
      payload: {
        entriesCount: kbData.length,
        clearExisting
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: `Successfully seeded ${kbData.length} KB entries`,
      entriesCount: kbData.length
    };
    
  } catch (error) {
    console.error('Error seeding KB:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while seeding the knowledge base');
  }
});