import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Persist auth across sessions — stays logged in until explicit logout
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

export { auth, db, storage };
export default firebase;
