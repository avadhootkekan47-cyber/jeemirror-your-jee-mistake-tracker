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

const DAILY_QUOTES = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Don't watch the clock; do what it does. Keep going.",
  "It always seems impossible until it's done.",
  "Your limitation—it's only your imagination.",
  "Hard work beats talent when talent doesn't work hard.",
];

function getISTDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good Morning ☀️';
  if (hour >= 12 && hour < 17) return 'Good Afternoon 🌤️';
  if (hour >= 17 && hour < 21) return 'Good Evening 🌆';
  return 'Good Night 🌙';
}

function ISTClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing ring */}
      <div className="absolute h-28 w-28 rounded-full border-2 border-primary/30 animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute h-32 w-32 rounded-full border border-primary/15 animate-[pulse_3s_ease-in-out_infinite_0.5s]" />
      {/* Clock face */}
      <div className="relative z-10 flex items-center justify-center h-24 w-24 rounded-full bg-card border border-primary/20"
        style={{ boxShadow: '0 0 40px rgba(124,58,237,0.25), inset 0 0 20px rgba(124,58,237,0.08)' }}>
        <span className="text-xl font-bold tabular-nums text-foreground tracking-wide">{time}</span>
      </div>
    </div>
  );
}

export default function TodayScreen() {
  const { user, profile } = useAuth();
  const [reviewDue, setReviewDue] = useState<ReviewItem[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [allCleared, setAllCleared] = useState(false);

  const displayName = profile?.name || profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const istDate = getISTDate();
  const greeting = getGreeting(istDate.getHours());
  const dailyQuote = DAILY_QUOTES[istDate.getDate() % DAILY_QUOTES.length];

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const { data: srs } = await supabase
      .from('mistakes')
      .select('id, subject, chapter, mistake_type, notes, created_at')
      .eq('user_id', user.id)
      .eq('is_reviewed', false)
      .order('created_at', { ascending: true })
      .limit(5);
    setReviewDue(srs || []);

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
  const totalAll = reviewDue.length + tasks.length;
  const completedItems = totalAll - totalItems;
  const progressPct = totalAll > 0 ? Math.round((completedItems / totalAll) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting + Clock */}
      <div className="card-premium p-5 flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {greeting.split(' ').slice(0, 2).join(' ')},{' '}
            <span className="text-gradient">{displayName}</span>{' '}
            {greeting.split(' ').pop()}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalItems > 0 ? `${totalItems} items remaining` : 'All caught up! 🎉'}
          </p>
          {allCleared && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground confetti-burst">
              <PartyPopper className="h-3.5 w-3.5" /> All Clear!
            </div>
          )}
        </div>
        <ISTClock />
      </div>

      {/* Progress Ring */}
      {totalAll > 0 && (
        <div className="card-premium p-5 flex items-center gap-5">
          <div className="relative h-20 w-20 flex-shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="url(#progressGrad)" strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPct / 100)}`}
                className="transition-all duration-700" />
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(253, 63%, 55%)" />
                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold tabular-nums">{progressPct}%</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">Today's Progress</p>
            <p className="text-sm text-muted-foreground">{completedItems} of {totalAll} tasks completed</p>
          </div>
        </div>
      )}

      {/* Study Tasks */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-accent" />
          <h2 className="font-semibold">Today's Priorities</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm text-muted-foreground mb-3">No tasks for today.</p>
            <Link to="/planner" className="text-sm text-primary hover:underline">Set up your planner →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(t => (
              <div key={t.id} className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-all ${t.is_done ? 'opacity-50' : ''}`}>
                <button onClick={() => !t.is_done && markTaskDone(t.id)}
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${t.is_done ? 'border-accent bg-accent' : 'border-muted-foreground hover:border-primary'}`}>
                  {t.is_done && <CheckCircle2 className="h-3 w-3 text-accent-foreground" />}
                </button>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getSubjectClass(t.subject)}`}>{t.subject}</span>
                <span className={`text-sm flex-1 ${t.is_done ? 'line-through text-muted-foreground' : ''}`}>{t.topic}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SRS Review */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Review Due</h2>
          <span className="text-xs rounded-full bg-primary/15 text-primary px-2 py-0.5 font-medium ml-auto tabular-nums">{reviewDue.length} pending</span>
        </div>
        {reviewDue.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🔥</div>
            <p className="text-sm text-muted-foreground">No reviews due! You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviewDue.map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getSubjectClass(r.subject)}`}>{r.subject}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.chapter}</div>
                  <div className="text-xs text-muted-foreground">{r.mistake_type}</div>
                </div>
                <button onClick={() => markReviewed(r.id)}
                  className="rounded-lg bg-accent/15 text-accent hover:bg-accent/25 px-3 py-1.5 text-xs font-medium transition-colors">
                  Got it ✓
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/log" className="card-premium p-4 text-center">
          <div className="text-lg mb-1">✏️</div>
          <div className="text-sm font-medium">Log Mistake</div>
        </Link>
        <Link to="/revision" className="card-premium p-4 text-center">
          <div className="text-lg mb-1">📖</div>
          <div className="text-sm font-medium">Chapter Revision</div>
        </Link>
      </div>

      {/* Daily Quote */}
      <div className="card-premium p-4 text-center">
        <p className="text-sm text-muted-foreground italic">"{dailyQuote}"</p>
      </div>
    </div>
  );
}
