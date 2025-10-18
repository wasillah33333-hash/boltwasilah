# Wasilah Support Chat System

A complete in-app chat feature built with Firebase services, featuring a knowledge base-powered bot, admin takeover functionality, and real-time messaging.

## 🚀 Features

- **Real-time Chat**: Firebase Firestore-powered messaging with live updates
- **Knowledge Base Bot**: Intelligent responses using keyword and fuzzy matching
- **Admin Panel**: Complete chat management with takeover functionality
- **Multi-chat Support**: Users can have multiple ongoing conversations
- **Rate Limiting**: Client and server-side protection against spam
- **Profanity Filtering**: Automatic content moderation
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend (React + Firebase SDK v9+)
- `ChatWidget.tsx` - Floating chat interface for authenticated users
- `ChatList.tsx` - Chat history and management page
- `Admin/ChatsPanel.tsx` - Admin interface for chat management
- `useChat.ts` - Custom hook for chat state management

### Backend (Firebase Cloud Functions)
- `matchKbAnswer` - Processes user messages and returns bot responses
- `seedKb` - Admin-only function to populate knowledge base

### Data Model (Firestore)
- `users/{uid}/chats/{chatId}` - Chat metadata and settings
- `users/{uid}/chats/{chatId}/messages/{messageId}` - Individual messages
- `kb/faqs/{faqId}` - Knowledge base entries
- `chats_audit/{auditId}` - Admin action logs

## 📋 Prerequisites

- Node.js 18+
- Firebase project with Firestore, Authentication, and Cloud Functions enabled
- Firebase CLI installed (`npm install -g firebase-tools`)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 2. Firebase Configuration

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore, Authentication, and Cloud Functions
3. Download your service account key and save as `functions/serviceAccountKey.json`

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase configuration
# Update src/config/firebase.ts with your Firebase config
```

### 4. Deploy Cloud Functions

```bash
# Build and deploy functions
cd functions
npm run build
firebase deploy --only functions
cd ..
```

### 5. Deploy Firestore Rules and Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 6. Seed Knowledge Base

```bash
# Set service account path
export FIREBASE_SERVICE_ACCOUNT=./functions/serviceAccountKey.json

# Run seeding script
node scripts/seedKb.js
```

## 🎯 Usage

### For Users

1. **Start a Chat**: Click the floating chat button (visible to authenticated users)
2. **Send Messages**: Type your question and press Enter or click Send
3. **View History**: Access your chat history through the chat list page
4. **Multiple Chats**: Create new chats for different topics

### For Admins

1. **Access Admin Panel**: Navigate to the admin section (requires admin privileges)
2. **View All Chats**: See all user chats in the three-pane interface
3. **Take Over Chats**: Toggle takeover mode to handle chats personally
4. **Send Admin Messages**: Reply as admin when in takeover mode
5. **Monitor Activity**: View audit logs for all admin actions

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MATCH_THRESHOLD` | KB matching confidence threshold | 0.6 |
| `MAX_MEMORY_MSGS` | Messages to include in context | 6 |
| `RATE_LIMIT_WINDOW` | Rate limit window in milliseconds | 60000 |
| `MAX_MESSAGES_PER_WINDOW` | Max messages per window | 5 |

### Knowledge Base Management

Add new FAQ entries by editing `kb/seed.json`:

```json
{
  "question": "How can I volunteer?",
  "answer": "You can apply through our Join Us page...",
  "keywords": ["volunteer", "join", "help", "participate"],
  "tags": ["volunteering", "getting-started"]
}
```

Then run: `node scripts/seedKb.js`

## 🧪 Testing

### Unit Tests

```bash
# Run matching algorithm tests
npm test tests/matching.test.js

# Run E2E tests
npm test tests/e2e.chat.test.js
```

### Manual Testing

1. **User Flow**:
   - Sign in and open chat widget
   - Send a message about volunteering
   - Verify bot response with KB match
   - Send unrelated message to test fallback

2. **Admin Flow**:
   - Access admin panel as admin user
   - Select a user and their chat
   - Toggle takeover mode
   - Send admin message
   - Verify user sees admin response

## 🔒 Security

### Firestore Rules

The system enforces strict security rules:

- Users can only access their own chats
- Admins can access all chats and manage KB
- All operations require authentication
- Admin actions are logged for audit

### Rate Limiting

- Client-side: 5 messages per minute
- Server-side: Additional validation in Cloud Functions
- Automatic blocking of excessive requests

## 📊 Monitoring

### Audit Logs

All admin actions are logged to `chats_audit` collection:

```javascript
{
  actorUid: "admin-user-id",
  action: "admin_message_sent",
  payload: { chatId: "...", message: "..." },
  createdAt: "timestamp"
}
```

### Performance

- KB data cached in Cloud Functions (5-minute TTL)
- Batched writes for efficient data operations
- Optimized Firestore queries with proper indexes

## 🚨 Troubleshooting

### Common Issues

1. **Chat not loading**: Check Firebase authentication and Firestore rules
2. **Bot not responding**: Verify Cloud Functions are deployed and KB is seeded
3. **Admin panel access denied**: Ensure user has `isAdmin: true` in Firestore
4. **Rate limit errors**: Wait 1 minute before sending more messages

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📈 Scaling

### Firebase Spark Plan Limits

- Firestore: 50K reads, 20K writes, 20K deletes per day
- Cloud Functions: 125K invocations per month
- Storage: 1GB total

### Optimization Tips

- Use Firestore listeners instead of polling
- Implement efficient caching strategies
- Monitor usage in Firebase Console
- Consider upgrading plan for high traffic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:

1. Check the troubleshooting section above
2. Review Firebase documentation
3. Open an issue in the repository
4. Contact the development team

---

**Built with ❤️ for the Wasilah community**