const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'wasilah-new'
});

const db = admin.firestore();

async function seedKnowledgeBase() {
  try {
    console.log('🌱 Starting Knowledge Base seeding...');
    
    // Read seed data
    const seedPath = path.join(__dirname, '../kb/seed.json');
    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    
    console.log(`📚 Found ${seedData.length} KB entries to seed`);
    
    // Clear existing data
    console.log('🗑️  Clearing existing KB data...');
    const existingSnapshot = await db.collection('kb/faqs').get();
    const batch = db.batch();
    
    existingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Cleared ${existingSnapshot.docs.length} existing entries`);
    
    // Add new entries in batches
    const BATCH_SIZE = 450; // Firestore batch limit is 500
    let processed = 0;
    
    for (let i = 0; i < seedData.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const batchData = seedData.slice(i, i + BATCH_SIZE);
      
      for (const entry of batchData) {
        if (!entry.question || !entry.answer) {
          console.warn(`⚠️  Skipping invalid entry:`, entry);
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
        processed++;
      }
      
      await batch.commit();
      console.log(`📦 Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(seedData.length / BATCH_SIZE)}`);
    }
    
    console.log(`🎉 Successfully seeded ${processed} KB entries!`);
    
    // Verify seeding
    const verifySnapshot = await db.collection('kb/faqs').get();
    console.log(`✅ Verification: ${verifySnapshot.docs.length} entries in database`);
    
  } catch (error) {
    console.error('❌ Error seeding Knowledge Base:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedKnowledgeBase()
    .then(() => {
      console.log('🏁 Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedKnowledgeBase };