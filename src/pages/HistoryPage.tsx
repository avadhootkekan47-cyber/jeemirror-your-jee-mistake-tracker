import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass, SUBJECTS, MISTAKE_TYPES } from '@/lib/constants';
import { Check, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface Mistake {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  difficulty: string | null;
  notes: string | null;
  is_reviewed: boolean;
  reviewed_at: string | null;
  created_at: string;
}

const DATE_RANGES = [
  { label: 'All Time', value: '' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'This Month', value: 'month' },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [search, setSearch] = useState(searchParams.get('chapter') || '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const perPage = 20;

  const fetchMistakes = async (append = false) => {
    if (!user) return;
    const offset = append ? mistakes.length : 0;
    let query = supabase
      .from('mistakes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (filterSubject) query = query.eq('subject', filterSubject);
    if (filterType) query = query.eq('mistake_type', filterType);
    if (filterStatus === 'reviewed') query = query.eq('is_reviewed', true);
    if (filterStatus === 'unreviewed') query = query.eq('is_reviewed', false);
    if (search) query = query.or(`chapter.ilike.%${search}%,notes.ilike.%${search}%`);

    // Date range filter
    if (filterDateRange === '7' || filterDateRange === '30') {
      const d = new Date();
      d.setDate(d.getDate() - parseInt(filterDateRange));
      query = query.gte('created_at', d.toISOString());
    } else if (filterDateRange === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      query = query.gte('created_at', start.toISOString());
    }

    const { data, count } = await query;
    if (append) {
      setMistakes(prev => [...prev, ...(data || [])]);
    } else {
      setMistakes(data || []);
    }
    setTotal(count || 0);
    setHasMore((offset + perPage) < (count || 0));
  };

  useEffect(() => {
    setMistakes([]);
    fetchMistakes(false);
  }, [user, filterSubject, filterType, filterStatus, filterDateRange, search]);

  const markReviewed = async (id: string) => {
    await supabase.from('mistakes').update({ is_reviewed: true, reviewed_at: new Date().toISOString() }).eq('id', id);
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, is_reviewed: true, reviewed_at: new Date().toISOString() } : m));
  };

  const markAllReviewed = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    await supabase.from('mistakes').update({ is_reviewed: true, reviewed_at: new Date().toISOString() }).in('id', ids);
    setMistakes(prev => prev.map(m => selectedIds.has(m.id) ? { ...m, is_reviewed: true, reviewed_at: new Date().toISOString() } : m));
    setSelectedIds(new Set());
    setBulkLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    const unreviewedIds = mistakes.filter(m => !m.is_reviewed).map(m => m.id);
    if (unreviewedIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unreviewedIds));
    }
  };

  const unreviewedVisible = mistakes.filter(m => !m.is_reviewed);
  const allSelected = unreviewedVisible.length > 0 && unreviewedVisible.every(m => selectedIds.has(m.id));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <span className="text-sm text-muted-foreground">{total} mistakes</span>
      </div>

      {/* Bulk actions */}
      {unreviewedVisible.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
              className="rounded border-border accent-primary h-4 w-4" />
            Select all unreviewed
          </label>
          {selectedIds.size > 0 && (
            <button onClick={markAllReviewed} disabled={bulkLoading}
              className="ml-auto rounded-lg gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {bulkLoading ? '...' : `Mark ${selectedIds.size} Reviewed`}
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chapters or notes..."
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm">
          <option value="">All Subjects</option>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm">
          <option value="">All Types</option>
          {MISTAKE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm">
          <option value="">All Status</option>
          <option value="reviewed">Reviewed</option>
          <option value="unreviewed">Unreviewed</option>
        </select>
        <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)}
          className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm">
          {DATE_RANGES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Mistakes */}
      {mistakes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No mistakes found.
        </div>
      ) : (
        <div className="space-y-2">
          {mistakes.map((m) => {
            const isExpanded = expandedId === m.id;
            return (
              <div key={m.id} className={`rounded-xl border border-border bg-card p-4 card-hover transition-opacity ${m.is_reviewed ? 'opacity-40' : ''}`}>
                <div className="flex items-start gap-3">
                  {!m.is_reviewed && (
                    <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggleSelect(m.id)}
                      className="mt-1 rounded border-border accent-primary h-4 w-4 shrink-0" />
                  )}
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold shrink-0 ${getSubjectClass(m.subject)}`}>
                    {m.subject}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {m.is_reviewed && <Check className="inline h-3.5 w-3.5 text-success" />}
                      {m.chapter}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                      <span className="text-xs text-muted-foreground">{m.mistake_type}</span>
                      {m.difficulty && m.difficulty !== 'Medium' && (
                        <span className={`text-xs rounded-md px-1.5 py-0.5 font-medium ${
                          m.difficulty === 'Hard' ? 'bg-destructive/15 text-destructive' :
                          m.difficulty === 'Easy' ? 'bg-accent/15 text-accent' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {m.difficulty}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">• {new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
                      aria-label="Toggle details">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {!m.is_reviewed && (
                      <button onClick={() => markReviewed(m.id)}
                        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary">
                        Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-sm">
                    <div><span className="text-muted-foreground">Subject:</span> <span className="text-foreground">{m.subject}</span></div>
                    <div><span className="text-muted-foreground">Chapter:</span> <span className="text-foreground">{m.chapter}</span></div>
                    <div><span className="text-muted-foreground">Error Type:</span> <span className="text-foreground">{m.mistake_type}</span></div>
                    {m.difficulty && <div><span className="text-muted-foreground">Difficulty:</span> <span className="text-foreground">{m.difficulty}</span></div>}
                    <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{new Date(m.created_at).toLocaleString()}</span></div>
                    {m.reviewed_at && <div><span className="text-muted-foreground">Reviewed:</span> <span className="text-foreground">{new Date(m.reviewed_at).toLocaleString()}</span></div>}
                    {m.notes && <div><span className="text-muted-foreground">Notes:</span> <span className="text-foreground">{m.notes}</span></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <button onClick={() => fetchMistakes(true)}
            className="rounded-lg border border-border bg-secondary px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
