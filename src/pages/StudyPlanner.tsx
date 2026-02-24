import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS } from '@/lib/constants';
import { getSubjectClass } from '@/lib/constants';
import { Plus, Trash2, CheckCircle2, AlertCircle, BookOpen, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

export default function StudyPlanner() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [backlog, setBacklog] = useState<StudyTask[]>([]);
  const [suggested, setSuggested] = useState<{ chapter: string; subject: string; count: number }[]>([]);

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

  const addTask = async () => {
    if (!user || !topic.trim()) return;
    setAdding(true);
    await supabase.from('study_tasks').insert({
      user_id: user.id,
      subject,
      topic: topic.trim(),
      estimated_minutes: minutes,
      is_done: false,
      date: today,
    });
    setTopic('');
    setMinutes(30);
    await fetchTasks();
    setAdding(false);
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

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold">Study Planner</h1>

      {/* Add Task Form */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Add Today's Task
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as typeof subject)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Topic / Chapter"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={5}
              max={300}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm w-20"
              placeholder="min"
            />
            <button
              onClick={addTask}
              disabled={adding || !topic.trim()}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
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
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-hover ${task.is_done ? 'opacity-60' : ''}`}
              >
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
            Backlog — {backlog.length} pending task{backlog.length !== 1 ? 's' : ''}
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

      {/* Suggested Today */}
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
                <span className="font-medium">{s.chapter}</span>
                <span className="text-xs text-muted-foreground ml-auto">{s.count} mistakes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Independent Chapters Guide */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Start Here — Chapters Independent of Others
        </h3>
        <p className="text-xs text-muted-foreground mb-4">These chapters can be studied without prerequisites.</p>
        <div className="space-y-3">
          {Object.entries(independentChapters).map(([subj, chapters]) => (
            <div key={subj}>
              <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold mb-1.5 ${getSubjectClass(subj)}`}>
                {subj}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {chapters.map((ch) => (
                  <span key={ch} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium">
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
