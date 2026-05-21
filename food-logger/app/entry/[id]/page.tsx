import { serverClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import EntryEditor from './EntryEditor';

export const dynamic = 'force-dynamic';

export default async function EntryEditPage({ params }: { params: { id: string } }) {
  const sb = serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/auth');

  const { data: entry } = await sb.from('food_entries').select('*').eq('id', params.id).single();
  if (!entry) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit entry</h1>
      <p className="text-neutral-500 text-sm">{new Date(entry.taken_at).toLocaleString()}</p>
      <EntryEditor entry={entry as any} />
    </div>
  );
}
