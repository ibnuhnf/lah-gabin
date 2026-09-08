import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchAllOrders } from '@/lib/orderStore';
import { fetchAllExpenses } from '@/lib/expenseStore';

export interface CashTransaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  category: string;
  description: string;
  time: string;
  created_at?: string;
}

const CASH_KEY = 'lah_gabin_cash_transactions';

export async function fetchAllCashTransactions(): Promise<CashTransaction[]> {
  // 1. Ambil dari Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: CashTransaction[] = data.map((d: any) => ({
          id: d.id,
          type: d.type as 'IN' | 'OUT',
          amount: Number(d.amount),
          category: d.category,
          description: d.description || '',
          time: d.created_at ? new Date(d.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('id-ID'),
          created_at: d.created_at,
        }));
        try {
          localStorage.setItem(CASH_KEY, JSON.stringify(formatted));
        } catch {}
        return formatted;
      }
    } catch (err) {
      console.warn('Error fetching cash transactions from Supabase, fallback to cache:', err);
    }
  }

  // 2. Fallback cache
  try {
    const cached = localStorage.getItem(CASH_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
}

export async function createCashTransaction(tx: Omit<CashTransaction, 'id' | 'time'>): Promise<CashTransaction> {
  const newId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const newTx: CashTransaction = {
    id: newId,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    description: tx.description,
    time: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    created_at: createdAt,
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('cash_transactions').insert([{
        id: newId,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        description: tx.description,
        created_at: createdAt,
      }]);
    } catch (err) {
      console.warn('Error creating cash transaction in Supabase:', err);
    }
  }

  try {
    const current = await fetchAllCashTransactions();
    const updated = [newTx, ...current.filter((c) => c.id !== newId)];
    localStorage.setItem(CASH_KEY, JSON.stringify(updated));
  } catch {}

  return newTx;
}

export async function deleteCashTransactionPermanently(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('cash_transactions').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete cash transaction in Supabase:', err);
    }
  }

  try {
    const cached: CashTransaction[] = JSON.parse(localStorage.getItem(CASH_KEY) || '[]');
    const filtered = cached.filter((c) => c.id !== id);
    localStorage.setItem(CASH_KEY, JSON.stringify(filtered));
  } catch {}

  return true;
}

/**
 * Reconciles cash transactions with real Orders and Expenses from Cloud DB
 */
export async function autoReconcileAllCash(): Promise<{ inCount: number; outCount: number; totalIn: number; totalOut: number; balance: number }> {
  const [orders, expenses] = await Promise.all([
    fetchAllOrders(),
    fetchAllExpenses(),
  ]);

  const completedOrders = orders.filter((o) => o.status === 'SELESAI');

  const inTxList: CashTransaction[] = completedOrders.map((o) => ({
    id: `ord_${o.id}`,
    type: 'IN' as const,
    amount: o.final_amount,
    category: o.order_source === 'POS' ? 'PENJUALAN_POS' : 'PENJUALAN_ONLINE',
    description: `Penjualan ${o.order_source || 'ONLINE'} - ${o.invoice_code} (${o.customer_name})`,
    time: new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    created_at: o.created_at,
  }));

  const outTxList: CashTransaction[] = expenses.map((e) => ({
    id: `exp_${e.id}`,
    type: 'OUT' as const,
    amount: e.amount,
    category: e.category || 'OPERASIONAL',
    description: `Beban ${e.category || 'OPERASIONAL'} - ${e.description}`,
    time: new Date(e.date || e.created_at || new Date()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    created_at: e.created_at || new Date().toISOString(),
  }));

  const allReconciled = [...inTxList, ...outTxList].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );

  try {
    localStorage.setItem(CASH_KEY, JSON.stringify(allReconciled));
  } catch {}

  const totalIn = inTxList.reduce((acc, c) => acc + c.amount, 0);
  const totalOut = outTxList.reduce((acc, c) => acc + c.amount, 0);

  return {
    inCount: inTxList.length,
    outCount: outTxList.length,
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
  };
}
