import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS, REVISION_STATUSES, type RevisionStatus } from '@/lib/constants';
import { BookOpen, Check, ArrowUpDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/EmptyState';

const STATUS_META: Record<RevisionStatus, { label: string; classes: string; glow: string }> = {
  'Not Started': { label: 'Not Started', classes: 'bg-muted text-muted-foreground', glow: '' },
  'In Progress': { label: 'In Progress', classes: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)] border-amber-500/40' },
  'Revised Once': { label: 'Revised Once', classes: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
  'Fully Revised': { label: 'Fully Revised', classes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]' },
};

const SUBJECT_ICONS: Record<string, string> = { Physics: '⚛️', Chemistry: '🧪', Mathematics: '📐' };
const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'data-[state=active]:border-blue-500 data-[state=active]:text-blue-400',
  Chemistry: 'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400',
  Mathematics: 'data-[state=active]:border-orange-500 data-[state=active]:text-orange-400',
};
const RING_COLORS: Record<string, string> = { Physics: '#3B82F6', Chemistry: '#10B981', Mathematics: '#F97316' };

type SortMode = 'default' | 'mistakes' | 'status';

export default function RevisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, RevisionStatus>>({});
  const [mistakeCounts, setMistakeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('default');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: revData }, { data: mistakeData }] = await Promise.all([
        supabase.from('chapter_revision').select('chapter, subject, status').eq('user_id', user.id),
        supabase.from('mistakes').select('chapter').eq('user_id', user.id),
      ]);

      const map: Record<string, RevisionStatus> = {};
      revData?.forEach((d: any) => { map[`${d.subject}::${d.chapter}`] = d.status as RevisionStatus; });
      setStatuses(map);

      const counts: Record<string, number> = {};
      mistakeData?.forEach((m: any) => { counts[m.chapter] = (counts[m.chapter] || 0) + 1; });
      setMistakeCounts(counts);

      setLoading(false);
    })();
  }, [user]);

  const hasAnyStatus = Object.values(statuses).some(s => s !== 'Not Started');

  // Overall progress: chapters not 'Not Started'
  const totalChapters = SUBJECTS.reduce((acc, s) => acc + (CHAPTERS[s]?.length || 0), 0);
  const startedChapters = Object.values(statuses).filter(s => s !== 'Not Started').length;

  const cycleStatus = useCallback(async (subject: string, chapter: string) => {
    if (!user) return;
    const key = `${subject}::${chapter}`;
    const current = statuses[key] || 'Not Started';
    const idx = REVISION_STATUSES.indexOf(current);
    const next = REVISION_STATUSES[(idx + 1) % REVISION_STATUSES.length];

    setStatuses(prev => ({ ...prev, [key]: next }));

    const { error } = await supabase
      .from('chapter_revision')
      .upsert({
        user_id: user.id, subject, chapter, status: next,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject,chapter' });

    if (error) {
      setStatuses(prev => ({ ...prev, [key]: current }));
      toast({ title: 'Error', description: 'Could not save status', variant: 'destructive' });
    } else {
      const statusEmoji = next === 'Fully Revised' ? '✅' : next === 'Revised Once' ? '🔁' : next === 'In Progress' ? '📖' : '⏸️';
      toast({
        title: `${next} ${statusEmoji}`,
        description: chapter,
        action: (
          <button
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              setStatuses(prev => ({ ...prev, [key]: current }));
              await supabase.from('chapter_revision').upsert({
                user_id: user.id, subject, chapter, status: current,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'user_id,subject,chapter' });
            }}
          >
            Undo
          </button>
        ),
      });
    }
  }, [user, statuses, toast]);

  const getProgress = (subject: string) => {
    const chapters = CHAPTERS[subject] || [];
    const done = chapters.filter(c => statuses[`${subject}::${c}`] === 'Fully Revised').length;
    return chapters.length > 0 ? Math.round((done / chapters.length) * 100) : 0;
  };

  const sortChapters = (subject: string) => {
    const chapters = [...(CHAPTERS[subject] || [])];
    if (sortMode === 'mistakes') {
      chapters.sort((a, b) => (mistakeCounts[b] || 0) - (mistakeCounts[a] || 0));
    } else if (sortMode === 'status') {
      const order = { 'Not Started': 0, 'In Progress': 1, 'Revised Once': 2, 'Fully Revised': 3 };
      chapters.sort((a, b) => order[statuses[`${subject}::${b}`] || 'Not Started'] - order[statuses[`${subject}::${a}`] || 'Not Started']);
    }
    return chapters;
  };

  const ProgressRing = ({ subject }: { subject: string }) => {
    const pct = getProgress(subject);
    const r = 38;
    const circ = 2 * Math.PI * r;
    const color = RING_COLORS[subject];
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-20 w-20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
            <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="5"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-foreground">{pct}%</span>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{SUBJECT_ICONS[subject]} {subject}</span>
      </div>
    );
  };

  if (loading) return (
    <div className="space-y-4 p-6">
      {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Chapter Revision</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{startedChapters}/{totalChapters} chapters revised</span>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium">
            <option value="default">Default</option>
            <option value="mistakes">Most Mistakes</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      {!hasAnyStatus && (
        <EmptyState
          icon="📖"
          title="Track your chapter revision"
          description="Tap any chapter card below to update its status. Cycle: Not Started → In Progress → Revised Once → Fully Revised."
        />
      )}

      {/* Progress Rings */}
      <div className="card-premium p-5 flex justify-around">
        {SUBJECTS.map(s => <ProgressRing key={s} subject={s} />)}
      </div>

      {/* Subject Tabs */}
      <Tabs defaultValue="Physics" className="w-full">
        <TabsList className="w-full bg-secondary/50 border border-border h-12">
          {SUBJECTS.map(s => (
            <TabsTrigger key={s} value={s}
              className={`flex-1 text-sm font-semibold border-b-2 border-transparent transition-all ${SUBJECT_COLORS[s]}`}>
              {SUBJECT_ICONS[s]} {s}
            </TabsTrigger>
          ))}
        </TabsList>

        {SUBJECTS.map(subject => (
          <TabsContent key={subject} value={subject}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {sortChapters(subject).map(chapter => {
                const key = `${subject}::${chapter}`;
                const status = statuses[key] || 'Not Started';
                const meta = STATUS_META[status];
                const isFullyRevised = status === 'Fully Revised';
                const mCount = mistakeCounts[chapter] || 0;
                return (
                  <button key={chapter} onClick={() => cycleStatus(subject, chapter)}
                    aria-label={`${chapter}: ${status}. Click to change status.`}
                    className={`relative rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 active:scale-[0.98] touch-target ${meta.glow} ${isFullyRevised ? 'shimmer-border' : ''}`}>
                    {/* Mistake count badge */}
                    {mCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                        {mCount}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-sm font-medium leading-tight text-foreground">{chapter}</span>
                      {isFullyRevised && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />}
                    </div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
