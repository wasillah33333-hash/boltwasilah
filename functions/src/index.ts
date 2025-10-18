import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { matchKbAnswer } from './chatFunctions';
import { seedKb } from './seedFunctions';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions
export { matchKbAnswer, seedKb };