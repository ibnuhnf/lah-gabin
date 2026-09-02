import { redirect } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default async function AdminIndex() {
  const supabase = getSupabase();
  const { data: { session } } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  redirect(session ? '/admin/dashboard' : '/admin/login');
}
