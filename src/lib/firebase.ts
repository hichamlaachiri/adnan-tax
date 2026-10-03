import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  Firestore,
  query,
  orderBy
} from 'firebase/firestore';
import { Transaction } from '@/types';

// Environment-based config with fallback placeholders
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== "" && 
  firebaseConfig.projectId !== ""
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firebase initialization error (using local Zustand store):", err);
  }
}

export { app, db };

// Firebase Firestore Helpers
const TRANSACTIONS_COLLECTION = 'transactions';

export async function fetchTransactionsFromFirebase(): Promise<Transaction[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
  } catch (error) {
    console.error("Error fetching transactions from Firestore:", error);
    return [];
  }
}

export async function saveTransactionToFirebase(tx: Omit<Transaction, 'id'> & { id?: string }): Promise<string | null> {
  if (!db) return null;
  try {
    const { id, ...data } = tx;
    if (id) {
      await updateDoc(doc(db, TRANSACTIONS_COLLECTION, id), {
        ...data,
        updatedAt: Date.now()
      });
      return id;
    } else {
      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error("Error saving transaction to Firestore:", error);
    return null;
  }
}

export async function deleteTransactionFromFirebase(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting transaction from Firestore:", error);
    return false;
  }
}

export function subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void): (() => void) | null {
  if (!db) return null;
  try {
    const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      onUpdate(txs);
    }, (error) => {
      console.error("Firestore subscription error:", error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up Firestore subscription:", error);
    return null;
  }
}
