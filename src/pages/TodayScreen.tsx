import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { CheckCircle2, BookOpen, Zap, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReviewItem {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  notes: string;
  created_at: string;
}

interface StudyTask {
  id: string;
  subject: string;
  topic: string;
  is_done: boolean;
}

export default function TodayScreen() {
  const { user } = useAuth();
  const [reviewDue, setReviewDue] = useState<ReviewItem[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [allCleared, setAllCleared] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch unreviewed mistakes due for SRS review (oldest first, limit 5)
    const { data: srs } = await supabase
      .from('mistakes')
      .select('id, subject, chapter, mistake_type, notes, created_at')
      .eq('user_id', user.id)
      .eq('is_reviewed', false)
      .order('created_at', { ascending: true })
      .limit(5);
    setReviewDue(srs || []);

    // Fetch today's tasks
    const today = new Date().toISOString().split('T')[0];
    const { data: taskData } = await supabase
      .from('study_tasks')
      .select('id, subject, topic, is_done')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })
      .limit(3);
    setTasks(taskData || []);
  };

  const markReviewed = async (id: string) => {
    await supabase
      .from('mistakes')
      .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    setReviewDue(prev => prev.filter(r => r.id !== id));
    checkAllDone();
  };

  const markTaskDone = async (id: string) => {
    await supabase.from('study_tasks').update({ is_done: true }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_done: true } : t));
    checkAllDone();
  };

  const checkAllDone = () => {
    setTimeout(() => {
      const allReviewed = reviewDue.length <= 1;
      const allTasksDone = tasks.every(t => t.is_done);
      if (allReviewed && allTasksDone && (reviewDue.length > 0 || tasks.length > 0)) {
        setAllCleared(true);
      }
    }, 300);
  };

  const totalItems = reviewDue.length + tasks.filter(t => !t.is_done).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Today</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalItems > 0 ? `${totalItems} items remaining` : 'All caught up! 🎉'}
          </p>
        </div>
        {allCleared && (
          <div className="confetti-burst flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-sm font-semibold">
            <PartyPopper className="h-4 w-4" />
            All Clear!
          </div>
        )}
      </div>

      {/* Study Tasks */}
      <div className="rounded-xl border border-border bg-card p-5 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-accent" />
          <h2 className="font-semibold">Today's Priorities</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No tasks for today.{' '}
            <Link to="/planner" className="text-primary hover:underline">Set up your planner →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-all ${t.is_done ? 'opacity-50' : ''}`}>
                <button
                  onClick={() => !t.is_done && markTaskDone(t.id)}
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    t.is_done ? 'border-success bg-success' : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {t.is_done && <CheckCircle2 className="h-3 w-3 text-background" />}
                </button>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getSubjectClass(t.subject)}`}>
                  {t.subject}
                </span>
                <span className={`text-sm flex-1 ${t.is_done ? 'line-through text-muted-foreground' : ''}`}>{t.topic}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SRS Review */}
      <div className="rounded-xl border border-border bg-card p-5 card-glow">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Review Due</h2>
          <span className="text-xs rounded-full bg-primary/20 text-primary px-2 py-0.5 font-medium ml-auto">
            {reviewDue.length} pending
          </span>
        </div>
        {reviewDue.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No reviews due! You're all caught up. 🔥
          </div>
        ) : (
          <div className="space-y-2">
            {reviewDue.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getSubjectClass(r.subject)}`}>
                  {r.subject}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.chapter}</div>
                  <div className="text-xs text-muted-foreground">{r.mistake_type}</div>
                </div>
                <button
                  onClick={() => markReviewed(r.id)}
                  className="rounded-lg bg-success/20 text-success hover:bg-success/30 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Got it ✓
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/log" className="rounded-xl border border-border bg-card p-4 card-glow text-center">
          <div className="text-lg mb-1">✏️</div>
          <div className="text-sm font-medium">Log Mistake</div>
        </Link>
        <Link to="/review" className="rounded-xl border border-border bg-card p-4 card-glow text-center">
          <div className="text-lg mb-1">🃏</div>
          <div className="text-sm font-medium">Review Deck</div>
        </Link>
      </div>
    </div>
  );
}
