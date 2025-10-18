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

async function migrateChatVisibility() {
  try {
    console.log('🔄 Starting chat visibility migration...');
    
    // This script can be used to migrate any existing chat data
    // or add new fields to existing chat documents
    
    const usersSnapshot = await db.collection('users').get();
    let migratedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Ensure user has isAdmin field
      if (userData.isAdmin === undefined) {
        await userDoc.ref.update({
          isAdmin: false,
          lastActive: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Updated user ${userId} with admin field`);
        migratedCount++;
      }
      
      // Migrate existing chats if any
      const chatsSnapshot = await db.collection(`users/${userId}/chats`).get();
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        const updates = {};
        
        // Add missing fields
        if (!chatData.memorySummary) {
          updates.memorySummary = '';
        }
        
        if (!chatData.takeoverBy) {
          updates.takeoverBy = null;
        }
        
        if (!chatData.isActive) {
          updates.isActive = true;
        }
        
        if (Object.keys(updates).length > 0) {
          await chatDoc.ref.update(updates);
          console.log(`✅ Updated chat ${chatDoc.id} for user ${userId}`);
          migratedCount++;
        }
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${migratedCount} documents`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateChatVisibility()
    .then(() => {
      console.log('🏁 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateChatVisibility };