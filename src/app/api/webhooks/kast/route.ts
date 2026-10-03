import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// GET Handler - Health check mli katfta7 l-lien f l-navigateur
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'KAST Webhook endpoint is active and listening.',
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'my_custom_secret_key_123'
      },
      bodyExample: {
        amount: 1450.00,
        accountName: 'Hicham',
        date: '2026-04-02',
        rawSubject: 'Global Blue Refund Approved'
      }
    }
  });
}

// POST Handler - Hadhi li katsstaqbel les données dyal l-webhook
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, accountName, date, rawSubject } = body;

    // Secret key bax t-securisi l'webhook
    const authHeader = req.headers.get('x-webhook-secret');
    if (process.env.KAST_WEBHOOK_SECRET && authHeader !== process.env.KAST_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized: invalid or missing secret key' }, { status: 401 });
    }

    if (!amount || !accountName) {
      return NextResponse.json({ error: 'Missing data: amount and accountName are required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Firestore is not initialized. Please configure Firebase environment variables.' },
        { status: 500 }
      );
    }

    // Normaliser smya dyal l-compte ('hicham' | 'zouhir' | 'adnan')
    const rawAcc = accountName.toString().toLowerCase();
    const normalizedAccount = rawAcc.includes('zouhir')
      ? 'zouhir'
      : rawAcc.includes('adnan')
      ? 'adnan'
      : 'hicham';

    // Ajout d la transaction f Firestore
    const docRef = await addDoc(collection(db, 'transactions'), {
      account: normalizedAccount,
      date: date || new Date().toISOString().split('T')[0],
      kastAmount: parseFloat(amount),
      binanceAmount: null,
      cihAmount: null,
      status: 'in_kast',
      source: 'Global Blue Refund',
      notes: rawSubject || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
