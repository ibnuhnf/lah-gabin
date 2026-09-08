import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Expense } from '@/types';

const EXPENSES_KEY = 'lah_gabin_admin_expenses';

export async function fetchAllExpenses(): Promise<Expense[]> {
  // 1. Ambil dari Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted: Expense[] = data.map((d: any) => {
          let cat = 'OPERASIONAL';
          let desc = d.description || '';
          const match = desc.match(/^\[(.*?)\]\s*(.*)$/);
          if (match) {
            cat = match[1];
            desc = match[2];
          }
          return {
            id: d.id,
            amount: Number(d.amount),
            description: desc,
            category: cat,
            date: d.expense_date || d.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            created_at: d.created_at,
          };
        });
        try {
          localStorage.setItem(EXPENSES_KEY, JSON.stringify(formatted));
        } catch {}
        return formatted;
      }
    } catch (err) {
      console.warn('Error fetching expenses from Supabase, fallback to cache:', err);
    }
  }

  // 2. Fallback cache
  try {
    const cached = localStorage.getItem(EXPENSES_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
}

export async function createExpense(expensePayload: Omit<Expense, 'id'>): Promise<Expense> {
  const newId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const descWithCategory = expensePayload.category && !expensePayload.description.startsWith(`[${expensePayload.category}]`)
    ? `[${expensePayload.category}] ${expensePayload.description}`
    : expensePayload.description;

  const newExpense: Expense = {
    id: newId,
    amount: expensePayload.amount,
    description: expensePayload.description,
    category: expensePayload.category,
    date: expensePayload.date || createdAt.split('T')[0],
    created_at: createdAt,
  };

  // 1. Simpan ke Supabase
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('expenses').insert([{
        id: newId,
        amount: newExpense.amount,
        description: descWithCategory,
        expense_date: newExpense.date,
        created_at: createdAt,
      }]);
    } catch (err) {
      console.warn('Error saving expense to Supabase:', err);
    }
  }

  // 2. Update local cache
  try {
    const current = await fetchAllExpenses();
    const updated = [newExpense, ...current.filter((e) => e.id !== newId)];
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(updated));
  } catch {}

  return newExpense;
}

export async function deleteExpensePermanently(expenseId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('expenses').delete().eq('id', expenseId);
    } catch (err) {
      console.warn('Failed to delete expense from Supabase:', err);
    }
  }

  try {
    const cached: Expense[] = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
    const filtered = cached.filter((e) => e.id !== expenseId);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(filtered));
  } catch {}

  return true;
}
