#!/bin/bash

# Wasilah Chat System Deployment Script
echo "🚀 Starting Wasilah Chat System deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

echo "📦 Building Cloud Functions..."
cd functions
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build Cloud Functions"
    exit 1
fi
cd ..

echo "🔧 Deploying Firestore rules..."
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo "⚡ Deploying Cloud Functions..."
firebase deploy --only functions
if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Cloud Functions"
    exit 1
fi

echo "🌱 Seeding Knowledge Base..."
if [ -f "functions/serviceAccountKey.json" ]; then
    export FIREBASE_SERVICE_ACCOUNT=./functions/serviceAccountKey.json
    node scripts/seedKb.js
    if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Failed to seed Knowledge Base. You may need to run it manually."
    fi
else
    echo "⚠️  Warning: serviceAccountKey.json not found. Please seed the Knowledge Base manually:"
    echo "export FIREBASE_SERVICE_ACCOUNT=./functions/serviceAccountKey.json"
    echo "node scripts/seedKb.js"
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your Firebase config in src/config/firebase.ts"
echo "2. Test the chat functionality"
echo "3. Set up admin users in Firestore (set isAdmin: true)"
echo "4. Monitor usage in Firebase Console"
echo ""
echo "🎉 Wasilah Support Chat System is ready!"