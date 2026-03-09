import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS } from '@/lib/constants';
import { getSubjectClass } from '@/lib/constants';
import { Plus, Trash2, CheckCircle2, AlertCircle, BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface StudyTask {
  id: string;
  subject: string;
  topic: string;
  estimated_minutes: number;
  is_done: boolean;
  date: string;
}

const independentChapters: Record<string, string[]> = {
  Physics: ['Modern Physics', 'Ray Optics', 'Units & Dimensions', 'Semiconductors'],
  Chemistry: ['Biomolecules', 'Chemistry in Everyday Life', 'Environmental Chemistry', 'Polymers', 's-block elements', 'p-block elements'],
  Mathematics: ['Statistics', 'Mathematical Reasoning', 'Sets & Relations', 'Probability', 'Matrices & Determinants'],
};

const ALL_CHAPTERS = Object.entries(CHAPTERS).flatMap(([subject, chapters]) =>
  chapters.map(ch => ({ subject, chapter: ch }))
);

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

function ChapterSearchInput({
  value, onChange, onSelectChapter,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectChapter: (chapter: string, subject: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? ALL_CHAPTERS.filter(c => c.chapter.toLowerCase().includes(value.toLowerCase()))
    : ALL_CHAPTERS;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative sm:col-span-2">
      <input
        type="text" placeholder="Search chapter..." value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No chapters found</div>
          ) : (
            filtered.map((c, i) => (
              <button key={i} type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                onClick={() => { onSelectChapter(c.chapter, c.subject); setOpen(false); }}>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getSubjectClass(c.subject)}`}>
                  {c.subject.slice(0, 3).toUpperCase()}
                </span>
                <span className="text-foreground">{c.chapter}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function StudyPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [backlog, setBacklog] = useState<StudyTask[]>([]);
  const [suggested, setSuggested] = useState<{ chapter: string; subject: string; count: number }[]>([]);
  const [independentOpen, setIndependentOpen] = useState(false);

  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [adding, setAdding] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (data) {
      setTasks(data.filter((t) => t.date === today));
      setBacklog(data.filter((t) => t.date < today && !t.is_done));
    }
  };

  const fetchSuggested = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('mistakes')
      .select('subject, chapter')
      .eq('user_id', user.id);

    if (data) {
      const counts: Record<string, { subject: string; count: number }> = {};
      data.forEach((m) => {
        if (!counts[m.chapter]) counts[m.chapter] = { subject: m.subject, count: 0 };
        counts[m.chapter].count++;
      });
      setSuggested(
        Object.entries(counts)
          .map(([chapter, { subject, count }]) => ({ chapter, subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
      );
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchSuggested();
  }, [user]);

  const addTask = async (topicName?: string, subjectName?: string) => {
    if (!user) return;
    const t = topicName || topic.trim();
    const s = subjectName || subject;
    if (!t) return;
    setAdding(true);
    await supabase.from('study_tasks').insert({
      user_id: user.id,
      subject: s,
      topic: t,
      estimated_minutes: minutes,
      is_done: false,
      date: today,
    });
    if (!topicName) setTopic('');
    setMinutes(30);
    await fetchTasks();
    setAdding(false);
    if (topicName) toast({ title: 'Added to today\'s plan ✅', description: t });
  };

  const toggleDone = async (id: string, done: boolean) => {
    await supabase.from('study_tasks').update({ is_done: !done }).eq('id', id);
    await fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('study_tasks').delete().eq('id', id);
    await fetchTasks();
  };

  const doneCount = tasks.filter((t) => t.is_done).length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // Daily time summary
  const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);
  const totalHrs = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;
  const timeColor = totalMinutes > 480 ? 'text-destructive' : totalMinutes > 360 ? 'text-warning' : 'text-accent';
  const barColor = totalMinutes > 480 ? 'bg-destructive' : totalMinutes > 360 ? 'bg-warning' : 'bg-accent';

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold">Study Planner</h1>

      {/* Daily Time Summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Today: <span className={`font-bold ${timeColor}`}>{totalHrs}h {totalMins}m</span> planned</span>
          <span className="text-xs text-muted-foreground">{totalMinutes > 480 ? 'Too much!' : totalMinutes > 360 ? 'Heavy day' : 'Looking good'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, (totalMinutes / 480) * 100)}%` }} />
        </div>
      </div>

      {/* Add Task Form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Add Today's Task
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
          <select value={subject} onChange={(e) => setSubject(e.target.value as typeof subject)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChapterSearchInput value={topic} onChange={setTopic}
            onSelectChapter={(ch, subj) => { setTopic(ch); setSubject(subj as typeof subject); }} />
          <div className="flex items-center gap-3">
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button onClick={() => addTask()} disabled={adding || !topic.trim()}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 touch-target">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Today's Progress</h3>
          <span className="text-sm text-muted-foreground">{doneCount}/{tasks.length} tasks done</span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Today's Tasks */}
      {tasks.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Today's Tasks</h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id}
                className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-hover ${task.is_done ? 'opacity-60' : ''}`}>
                <button onClick={() => toggleDone(task.id, task.is_done)}>
                  <CheckCircle2 className={`h-5 w-5 ${task.is_done ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`} />
                </button>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(task.subject)}`}>
                  {task.subject}
                </span>
                <span className={`font-medium flex-1 ${task.is_done ? 'line-through' : ''}`}>{task.topic}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {task.estimated_minutes}m
                </span>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backlog */}
      {backlog.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Backlog — {backlog.length} pending
          </h3>
          <div className="space-y-2">
            {backlog.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-card p-4">
                <button onClick={() => toggleDone(task.id, task.is_done)}>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </button>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(task.subject)}`}>
                  {task.subject}
                </span>
                <span className="font-medium flex-1">{task.topic}</span>
                <span className="text-xs text-muted-foreground">{task.date}</span>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested */}
      {suggested.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Suggested Today — Top Weak Chapters</h3>
          <div className="space-y-2">
            {suggested.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(s.subject)}`}>
                  {s.subject}
                </span>
                <span className="font-medium flex-1">{s.chapter}</span>
                <span className="text-xs text-muted-foreground">{s.count} mistakes</span>
                <button
                  onClick={() => addTask(s.chapter, s.subject)}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-primary hover:bg-secondary transition-colors">
                  + Add to Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Independent Chapters Guide — Collapsible */}
      <Collapsible open={independentOpen} onOpenChange={setIndependentOpen}>
        <div className="rounded-xl border border-border bg-card p-5">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Start Here — Chapters Independent of Others
            </h3>
            {independentOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </CollapsibleTrigger>
          <p className="text-xs text-muted-foreground mt-1">These chapters can be studied without prerequisites.</p>
          <CollapsibleContent>
            <div className="space-y-3 mt-4">
              {Object.entries(independentChapters).map(([subj, chapters]) => (
                <div key={subj}>
                  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold mb-1.5 ${getSubjectClass(subj)}`}>
                    {subj}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {chapters.map((ch) => (
                      <span key={ch} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">{ch}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
