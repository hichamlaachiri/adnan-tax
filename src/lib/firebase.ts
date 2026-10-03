import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  Firestore 
} from 'firebase/firestore';
import { Transaction } from '@/types';

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

if (typeof window !== 'undefined' || isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firebase initialization error:", err);
  }
}

export { app, db };

const TRANSACTIONS_COLLECTION = 'transactions';

// Real-time synchronization for all devices (Mobile, PC, etc.)
export function subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void): (() => void) | null {
  if (!db) return null;
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const txs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          account: data.account || 'hicham',
          date: data.date || new Date().toISOString().split('T')[0],
          source: data.source || 'Global Blue Refund',
          reference: data.reference || '',
          kastAmount: Number(data.kastAmount || 0),
          binanceAmount: data.binanceAmount !== null && data.binanceAmount !== undefined ? Number(data.binanceAmount) : null,
          binanceFee: data.binanceFee !== null && data.binanceFee !== undefined ? Number(data.binanceFee) : null,
          binanceTxId: data.binanceTxId || '',
          cihAmount: data.cihAmount !== null && data.cihAmount !== undefined ? Number(data.cihAmount) : null,
          exchangeRate: data.exchangeRate !== null && data.exchangeRate !== undefined ? Number(data.exchangeRate) : null,
          cihTxId: data.cihTxId || '',
          recipient: data.recipient || '',
          payoutAmount: data.payoutAmount !== null && data.payoutAmount !== undefined ? Number(data.payoutAmount) : null,
          payoutDate: data.payoutDate || '',
          payoutMethod: data.payoutMethod || '',
          transferredToHicham: Boolean(data.transferredToHicham),
          status: data.status || 'in_kast',
          notes: data.notes || '',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        } as Transaction;
      });

      // Sort newest first by date & timestamp
      txs.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      onUpdate(txs);
    }, (error) => {
      console.error("Firestore real-time subscription error:", error);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up Firestore subscription:", error);
    return null;
  }
}

export async function saveTransactionToFirebase(tx: Transaction): Promise<string | null> {
  if (!db) return null;
  try {
    const docId = tx.id;
    const docRef = doc(db, TRANSACTIONS_COLLECTION, docId);
    await setDoc(docRef, {
      ...tx,
      updatedAt: Date.now(),
      createdAt: tx.createdAt || Date.now()
    }, { merge: true });
    return docId;
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
