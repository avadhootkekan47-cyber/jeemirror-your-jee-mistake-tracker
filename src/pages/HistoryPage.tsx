import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass, SUBJECTS, MISTAKE_TYPES } from '@/lib/constants';
import { Check, Search } from 'lucide-react';

interface Mistake {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  difficulty: string;
  notes: string | null;
  is_reviewed: boolean;
  reviewed_at: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const perPage = 20;

  const fetchMistakes = async () => {
    if (!user) return;
    let query = supabase
      .from('mistakes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (filterSubject) query = query.eq('subject', filterSubject);
    if (filterType) query = query.eq('mistake_type', filterType);
    if (filterStatus === 'reviewed') query = query.eq('is_reviewed', true);
    if (filterStatus === 'unreviewed') query = query.eq('is_reviewed', false);
    if (search) query = query.or(`chapter.ilike.%${search}%,notes.ilike.%${search}%`);

    const { data, count } = await query;
    setMistakes(data || []);
    setTotal(count || 0);
  };

  useEffect(() => { fetchMistakes(); }, [user, page, filterSubject, filterType, filterStatus, search]);

  const markReviewed = async (id: string) => {
    await supabase.from('mistakes').update({ is_reviewed: true, reviewed_at: new Date().toISOString() }).eq('id', id);
    fetchMistakes();
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <span className="text-sm text-muted-foreground">{total} mistakes</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search chapters or notes..."
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={filterSubject} onChange={(e) => { setFilterSubject(e.target.value); setPage(0); }}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Types</option>
          {MISTAKE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All Status</option>
          <option value="reviewed">Reviewed</option>
          <option value="unreviewed">Unreviewed</option>
        </select>
      </div>

      {/* Mistakes */}
      {mistakes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No mistakes found.
        </div>
      ) : (
        <div className="space-y-2">
          {mistakes.map((m) => (
            <div key={m.id} className={`rounded-xl border border-border bg-card p-4 card-hover ${m.is_reviewed ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold shrink-0 ${getSubjectClass(m.subject)}`}>
                  {m.subject}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${m.is_reviewed ? 'line-through' : ''}`}>
                    {m.is_reviewed && <Check className="inline h-3.5 w-3.5 text-success mr-1" />}
                    {m.chapter}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{m.mistake_type}</span>
                    <span className="text-xs text-muted-foreground">• {m.difficulty}</span>
                    <span className="text-xs text-muted-foreground">• {new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  {m.notes && (
                    <p className="text-xs text-muted-foreground mt-1.5 truncate">{m.notes.slice(0, 100)}</p>
                  )}
                </div>
                {!m.is_reviewed && (
                  <button onClick={() => markReviewed(m.id)}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary">
                    Mark Reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                page === i ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-muted'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
