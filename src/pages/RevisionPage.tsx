import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS, CHEMISTRY_GROUPS, REVISION_STATUSES, type RevisionStatus } from '@/lib/constants';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ChapterStatus {
  chapter: string;
  subject: string;
  status: RevisionStatus;
}

const STATUS_COLORS: Record<RevisionStatus, string> = {
  'Not Started': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-accent/20 text-accent border border-accent/30',
  'Revised Once': 'bg-primary/20 text-primary border border-primary/30',
  'Fully Revised': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

export default function RevisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, RevisionStatus>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Physics: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('chapter_revision')
        .select('chapter, subject, status')
        .eq('user_id', user.id);
      const map: Record<string, RevisionStatus> = {};
      data?.forEach((d: ChapterStatus) => { map[`${d.subject}::${d.chapter}`] = d.status as RevisionStatus; });
      setStatuses(map);
      setLoading(false);
    })();
  }, [user]);

  const updateStatus = async (subject: string, chapter: string, status: RevisionStatus) => {
    if (!user) return;
    const key = `${subject}::${chapter}`;
    setStatuses(prev => ({ ...prev, [key]: status }));

    const { error } = await supabase
      .from('chapter_revision')
      .upsert({
        user_id: user.id,
        subject,
        chapter,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject,chapter' });

    if (error) {
      toast({ title: 'Error', description: 'Could not save status', variant: 'destructive' });
    }
  };

  const getSubjectProgress = (subject: string) => {
    const chapters = CHAPTERS[subject] || [];
    const fullyRevised = chapters.filter(c => statuses[`${subject}::${c}`] === 'Fully Revised').length;
    return chapters.length > 0 ? Math.round((fullyRevised / chapters.length) * 100) : 0;
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderChapterList = (subject: string, chapters: string[], groupLabel?: string) => (
    <div key={groupLabel || subject} className="space-y-1">
      {groupLabel && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-2">{groupLabel}</p>
      )}
      {chapters.map(chapter => {
        const key = `${subject}::${chapter}`;
        const current = statuses[key] || 'Not Started';
        return (
          <div key={chapter} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2.5 gap-2">
            <span className="text-sm font-medium truncate flex-1">{chapter}</span>
            <select
              value={current}
              onChange={(e) => updateStatus(subject, chapter, e.target.value as RevisionStatus)}
              className={`rounded-md px-2 py-1 text-xs font-semibold cursor-pointer appearance-none ${STATUS_COLORS[current]}`}
              style={{ minWidth: 120 }}
            >
              {REVISION_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );

  if (loading) return <div className="text-center text-muted-foreground py-12">Loading…</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Chapter Revision</h1>
      </div>

      {SUBJECTS.map(subject => {
        const progress = getSubjectProgress(subject);
        const isOpen = expanded[subject];
        return (
          <div key={subject} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => toggleExpand(subject)}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="font-semibold text-lg">{subject}</span>
                <span className="text-xs text-muted-foreground">({CHAPTERS[subject].length} chapters)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary">{progress}%</span>
                <Progress value={progress} className="h-2 w-24" />
              </div>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-1">
                {subject === 'Chemistry' ? (
                  Object.entries(CHEMISTRY_GROUPS).map(([group, chapters]) =>
                    renderChapterList(subject, chapters, group)
                  )
                ) : (
                  renderChapterList(subject, CHAPTERS[subject])
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
