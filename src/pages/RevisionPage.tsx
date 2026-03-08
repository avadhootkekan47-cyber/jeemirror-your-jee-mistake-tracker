import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS, REVISION_STATUSES, type RevisionStatus } from '@/lib/constants';
import { BookOpen, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/EmptyState';

const STATUS_META: Record<RevisionStatus, { label: string; classes: string; glow: string }> = {
  'Not Started': { label: 'Not Started', classes: 'bg-muted text-muted-foreground', glow: '' },
  'In Progress': { label: 'In Progress', classes: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
  'Revised Once': { label: 'Revised Once', classes: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  'Fully Revised': { label: 'Fully Revised', classes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]' },
};

const SUBJECT_ICONS: Record<string, string> = { Physics: '⚛️', Chemistry: '🧪', Mathematics: '📐' };
const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'data-[state=active]:border-blue-500 data-[state=active]:text-blue-400',
  Chemistry: 'data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-400',
  Mathematics: 'data-[state=active]:border-orange-500 data-[state=active]:text-orange-400',
};
const RING_COLORS: Record<string, string> = { Physics: '#3B82F6', Chemistry: '#10B981', Mathematics: '#F97316' };

export default function RevisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, RevisionStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('chapter_revision')
        .select('chapter, subject, status')
        .eq('user_id', user.id);
      const map: Record<string, RevisionStatus> = {};
      data?.forEach((d: any) => { map[`${d.subject}::${d.chapter}`] = d.status as RevisionStatus; });
      setStatuses(map);
      setLoading(false);
    })();
  }, [user]);

  const hasAnyStatus = Object.values(statuses).some(s => s !== 'Not Started');

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
        user_id: user.id,
        subject,
        chapter,
        status: next,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject,chapter' });

    if (error) {
      setStatuses(prev => ({ ...prev, [key]: current }));
      toast({ title: 'Error', description: 'Could not save status', variant: 'destructive' });
    } else {
      const statusEmoji = next === 'Fully Revised' ? '✅' : next === 'Revised Once' ? '🔁' : next === 'In Progress' ? '📖' : '⏸️';
      toast({
        title: `Chapter marked as ${next} ${statusEmoji}`,
        description: `${chapter}`,
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

  const ProgressRing = ({ subject }: { subject: string }) => {
    const pct = getProgress(subject);
    const r = 38;
    const circ = 2 * Math.PI * r;
    const color = RING_COLORS[subject];
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-20 w-20" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${subject} revision progress`}>
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
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Chapter Revision</h1>
      </div>

      {/* Empty state hint */}
      {!hasAnyStatus && (
        <EmptyState
          icon="📖"
          title="Track your chapter revision"
          description="Tap any chapter card below to update its status as you study. Cycle through: Not Started → In Progress → Revised Once → Fully Revised."
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
              {CHAPTERS[subject].map(chapter => {
                const key = `${subject}::${chapter}`;
                const status = statuses[key] || 'Not Started';
                const meta = STATUS_META[status];
                const isFullyRevised = status === 'Fully Revised';
                return (
                  <button key={chapter} onClick={() => cycleStatus(subject, chapter)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${chapter}: ${status}. Click to change status.`}
                    className={`relative rounded-xl border border-border bg-card p-4 text-left transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 active:scale-[0.98] touch-target ${meta.glow} ${isFullyRevised ? 'shimmer-border' : ''}`}>
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
