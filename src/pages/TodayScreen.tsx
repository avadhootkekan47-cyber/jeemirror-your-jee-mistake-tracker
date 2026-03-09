import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { CheckCircle2, BookOpen, Zap, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/EmptyState';
import FlipClock from '@/components/FlipClock';
import TypingGreeting from '@/components/TypingGreeting';

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

export default function TodayScreen() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reviewDue, setReviewDue] = useState<ReviewItem[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [allCleared, setAllCleared] = useState(false);
  const [hasMistakes, setHasMistakes] = useState<boolean | null>(null);

  const displayName = profile?.name || profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const istDate = getISTDate();
  const greeting = getGreeting(istDate.getHours());
  const dailyQuote = DAILY_QUOTES[istDate.getDate() % DAILY_QUOTES.length];

  const greetingParts = greeting.split(' ');
  const greetingEmoji = greetingParts.pop() || '';
  const greetingText = greetingParts.join(' ') + ', ' + displayName + ' ' + greetingEmoji;

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Check if user has any mistakes at all
    const { count: totalMistakes } = await supabase
      .from('mistakes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setHasMistakes((totalMistakes || 0) > 0);

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
    const item = reviewDue.find(r => r.id === id);
    await supabase
      .from('mistakes')
      .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    setReviewDue(prev => prev.filter(r => r.id !== id));

    toast({
      title: 'Marked as reviewed ✅',
      description: item ? `${item.chapter} — ${item.mistake_type}` : 'Review completed',
      action: (
        <button
          className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          onClick={async () => {
            await supabase.from('mistakes').update({ is_reviewed: false, reviewed_at: null }).eq('id', id);
            fetchData();
          }}
        >
          Undo
        </button>
      ),
    });
    checkAllDone();
  };

  const markTaskDone = async (id: string) => {
    await supabase.from('study_tasks').update({ is_done: true }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_done: true } : t));
    toast({ title: 'Task completed 🎯', description: 'Nice work!' });
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

  const isFirstTime = hasMistakes === false;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting + Inline Clock */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">
              <TypingGreeting text={greetingText} speed={50} />
            </h1>
            {!isFirstTime && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalItems > 0 ? `${totalItems} items remaining` : 'All caught up! 🎉'}
              </p>
            )}
            {allCleared && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground confetti-burst">
                <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" /> All Clear!
              </div>
            )}
          </div>
          <div className="shrink-0 scale-75 origin-right">
            <FlipClock />
          </div>
        </div>
      </div>

      {/* Getting started guide — ONLY for first-time users (0 mistakes) */}
      {isFirstTime && (
        <EmptyState
          icon="🚀"
          title="Here's how to get started"
          description="Your Today screen will show your daily priorities once you start using JEEMirror."
          steps={[
            'Log a mistake from your practice',
            'Set your weekly goal on the Dashboard',
            'Check your analytics after 3+ logs',
          ]}
          ctaLabel="Log Your First Mistake"
          ctaLink="/log"
        />
      )}

      {/* Progress Ring — only if has items */}
      {totalAll > 0 && (
        <div className="card-premium p-5 flex items-center gap-5">
          <div className="relative h-20 w-20 flex-shrink-0" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Today's progress">
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
              <span className="text-lg font-bold tabular-nums text-foreground">{progressPct}%</span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-foreground">Today's Progress</p>
            <p className="text-sm text-muted-foreground">{completedItems} of {totalAll} tasks completed</p>
          </div>
        </div>
      )}

      {/* Study Tasks */}
      {!isFirstTime && (
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="font-semibold text-foreground">Today's Priorities</h2>
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
                <div key={t.id} className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-all ${t.is_done ? 'opacity-60' : ''}`}>
                  <button onClick={() => !t.is_done && markTaskDone(t.id)}
                    aria-label={t.is_done ? `${t.topic} completed` : `Mark ${t.topic} as done`}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors touch-target ${t.is_done ? 'border-accent bg-accent' : 'border-muted-foreground hover:border-primary'}`}>
                    {t.is_done && <CheckCircle2 className="h-3.5 w-3.5 text-accent-foreground" />}
                  </button>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(t.subject)}`}>{t.subject}</span>
                  <span className={`text-sm flex-1 ${t.is_done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.topic}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SRS Review */}
      {!isFirstTime && (
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-foreground">Review Due</h2>
            <span className="text-xs rounded-full bg-primary/15 text-primary px-2.5 py-0.5 font-medium ml-auto tabular-nums">{reviewDue.length} pending</span>
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
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(r.subject)}`}>{r.subject}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">{r.chapter}</div>
                    <div className="text-xs text-muted-foreground">{r.mistake_type}</div>
                  </div>
                  <button onClick={() => markReviewed(r.id)}
                    aria-label={`Mark ${r.chapter} as reviewed`}
                    className="rounded-lg bg-accent/15 text-accent hover:bg-accent/25 px-3 py-1.5 text-xs font-medium transition-colors touch-target">
                    Got it ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/log" className="card-premium p-4 text-center" role="button" tabIndex={0}>
          <div className="text-lg mb-1">✏️</div>
          <div className="text-sm font-medium text-foreground">Log Mistake</div>
        </Link>
        <Link to="/revision" className="card-premium p-4 text-center" role="button" tabIndex={0}>
          <div className="text-lg mb-1">📖</div>
          <div className="text-sm font-medium text-foreground">Chapter Revision</div>
        </Link>
      </div>

      {/* Daily Quote */}
      <div className="card-premium p-4 text-center">
        <p className="text-sm text-muted-foreground italic">"{dailyQuote}"</p>
      </div>
    </div>
  );
}
