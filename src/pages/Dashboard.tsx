import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { PlusCircle, TrendingUp, TrendingDown, Flame, Repeat, Target, Save, Star, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/EmptyState';

interface Mistake {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  created_at: string;
}

interface WeeklyGoals {
  id?: string;
  chapters_target: number;
  chapters_current: number;
  topics_target: number;
  topics_current: number;
  backlog_target: number;
  backlog_current: number;
  questions_target: number;
  questions_current: number;
}

const DEFAULT_GOALS: WeeklyGoals = {
  chapters_target: 5, chapters_current: 0,
  topics_target: 10, topics_current: 0,
  backlog_target: 3, backlog_current: 0,
  questions_target: 50, questions_current: 0,
};

const GOAL_METRICS = [
  { key: 'chapters', label: 'Chapters Completed', emoji: '📖' },
  { key: 'topics', label: 'Topics Understood', emoji: '💡' },
  { key: 'backlog', label: 'Backlog Completed', emoji: '📋' },
  { key: 'questions', label: 'Questions Solved', emoji: '✏️' },
] as const;

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, lastWeek: 0, streak: 0, bestStreak: 0, topChapter: '—', topChapterCount: 0 });
  const [recent, setRecent] = useState<Mistake[]>([]);
  const [goals, setGoals] = useState<WeeklyGoals>(DEFAULT_GOALS);
  const [editingGoals, setEditingGoals] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const { toast } = useToast();

  const displayName = profile?.name || profile?.full_name || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { count: total } = await supabase
        .from('mistakes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // This week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: thisWeek } = await supabase
        .from('mistakes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      // Last week
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const { count: lastWeekCount } = await supabase
        .from('mistakes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', weekAgo.toISOString());

      // Streak calc
      const { data: allDates } = await supabase
        .from('mistakes')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let streak = 0;
      let bestStreak = 0;
      if (allDates && allDates.length > 0) {
        const uniqueDays = [...new Set(allDates.map((d) => new Date(d.created_at).toDateString()))];
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const curr = new Date(uniqueDays[i - 1]);
            const prev = new Date(uniqueDays[i]);
            const diff = (curr.getTime() - prev.getTime()) / 86400000;
            if (Math.abs(diff - 1) < 0.5) streak++;
            else break;
          }
        }
        // Best streak
        let tempStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const curr = new Date(uniqueDays[i - 1]);
          const prev = new Date(uniqueDays[i]);
          const diff = (curr.getTime() - prev.getTime()) / 86400000;
          if (Math.abs(diff - 1) < 0.5) {
            tempStreak++;
          } else {
            bestStreak = Math.max(bestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, tempStreak, streak);
      }

      // Most repeated CHAPTER (not type)
      const { data: chapterData } = await supabase
        .from('mistakes')
        .select('chapter')
        .eq('user_id', user.id);

      let topChapter = '—';
      let topChapterCount = 0;
      if (chapterData && chapterData.length > 0) {
        const counts: Record<string, number> = {};
        chapterData.forEach((t) => { counts[t.chapter] = (counts[t.chapter] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        topChapter = sorted[0][0];
        topChapterCount = sorted[0][1];
      }

      setStats({
        total: total || 0,
        thisWeek: thisWeek || 0,
        lastWeek: lastWeekCount || 0,
        streak,
        bestStreak,
        topChapter,
        topChapterCount,
      });
      setIsFirstTime((total || 0) === 0);

      const { data: recentData } = await supabase
        .from('mistakes')
        .select('id, subject, chapter, mistake_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecent(recentData || []);

      // Fetch weekly goals
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: goalData } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', weekStart.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalData) {
        setGoals(goalData);
      }
    };

    fetchData();
  }, [user]);

  const saveGoals = async () => {
    if (!user) return;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const payload = {
      user_id: user.id,
      week_start: weekStart.toISOString().split('T')[0],
      ...goals,
    };

    const { error } = goals.id
      ? await supabase.from('weekly_goals').update(payload).eq('id', goals.id)
      : await supabase.from('weekly_goals').upsert(payload, { onConflict: 'user_id,week_start' });

    if (error) {
      toast({ title: 'Error', description: 'Could not save goals', variant: 'destructive' });
    } else {
      toast({ title: 'Goal saved 💾', description: 'Weekly goals updated successfully' });
      setEditingGoals(false);
    }
  };

  const weekDiff = stats.thisWeek - stats.lastWeek;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner for first-time users */}
      {isFirstTime && (
        <div className="card-premium p-6 text-center space-y-3 glow-primary">
          <h2 className="text-xl font-bold text-foreground">Welcome to JEEMirror! 🎉</h2>
          <p className="text-sm text-muted-foreground">Start by logging your first mistake 👇</p>
          <Link
            to="/log"
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-primary transition-all hover:opacity-90"
          >
            <PlusCircle className="h-5 w-5" /> Log Your First Mistake
          </Link>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm text-accent">
        🔒 Your data is securely saved to the cloud — accessible from any device
      </div>

      <h1 className="text-2xl font-bold">
        Welcome back, <span className="text-gradient">{displayName}</span>
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Mistakes */}
        <div className="card-premium p-4 chart-animate chart-animate-delay-1">
          <TrendingUp className="h-4 w-4 text-primary mb-2" aria-hidden="true" />
          <div className="text-2xl font-bold tabular-nums count-up text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Mistakes</div>
        </div>

        {/* This Week with trend */}
        <div className="card-premium p-4 chart-animate chart-animate-delay-2">
          <TrendingUp className="h-4 w-4 text-accent mb-2" aria-hidden="true" />
          <div className="text-2xl font-bold tabular-nums count-up text-foreground">{stats.thisWeek}</div>
          <div className="text-xs text-muted-foreground mt-1">
            This Week{' '}
            {weekDiff !== 0 && (
              <span className={weekDiff > 0 ? 'text-destructive' : 'text-accent'}>
                {weekDiff > 0 ? `↑${weekDiff}` : `↓${Math.abs(weekDiff)}`} from last
              </span>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="card-premium p-4 chart-animate chart-animate-delay-3">
          <Flame className="h-4 w-4 text-warning mb-2" aria-hidden="true" />
          <div className="text-2xl font-bold tabular-nums count-up text-foreground">{stats.streak}d 🔥</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            Current Streak
            <span className="text-muted-foreground/70">| Best: {stats.bestStreak}d ⭐</span>
          </div>
        </div>

        {/* Most Repeated Chapter */}
        <div className="card-premium p-4 chart-animate chart-animate-delay-4">
          <Repeat className="h-4 w-4 text-destructive mb-2" aria-hidden="true" />
          <div className="text-lg font-bold text-foreground truncate" title={stats.topChapter}>{stats.topChapter}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
            <span>Most Repeated ({stats.topChapterCount})</span>
            {stats.topChapter !== '—' && (
              <button
                onClick={() => navigate(`/history?chapter=${encodeURIComponent(stats.topChapter)}`)}
                className="text-primary hover:underline text-xs flex items-center gap-0.5"
              >
                View <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log button — secondary, not full-width */}
      <Link
        to="/log"
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted"
      >
        <PlusCircle className="h-4 w-4" />
        Log New Mistake
      </Link>

      {/* Weekly Goals */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
            Weekly Goals
          </h2>
          <button
            onClick={() => editingGoals ? saveGoals() : setEditingGoals(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline touch-target"
            aria-label={editingGoals ? 'Save goals' : 'Edit goals'}
          >
            {editingGoals ? <><Save className="h-3.5 w-3.5" /> Save</> : 'Edit Targets'}
          </button>
        </div>

        <div className="space-y-4">
          {GOAL_METRICS.map(({ key, label, emoji }) => {
            const done = goals[`${key}_done` as keyof WeeklyGoals] as number;
            const target = goals[`${key}_target` as keyof WeeklyGoals] as number;
            const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{emoji} {label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {editingGoals ? (
                      <span className="flex items-center gap-1">
                        <input
                          type="number" min={0} value={done}
                          onChange={(e) => setGoals(prev => ({ ...prev, [`${key}_done`]: parseInt(e.target.value) || 0 }))}
                          className="w-14 rounded border border-border bg-background px-2 py-0.5 text-sm text-center text-foreground"
                        />
                        /
                        <input
                          type="number" min={1} value={target}
                          onChange={(e) => setGoals(prev => ({ ...prev, [`${key}_target`]: parseInt(e.target.value) || 1 }))}
                          className="w-14 rounded border border-border bg-background px-2 py-0.5 text-sm text-center text-foreground"
                        />
                      </span>
                    ) : (
                      `${done}/${target} ${pct >= 100 ? '🎉' : ''}`
                    )}
                  </span>
                </div>
                <Progress value={pct} className="h-1" aria-label={`${label}: ${pct}% complete`} />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Mistakes</h2>
          <Link to="/history" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No mistakes logged yet"
            description="Start by logging your first mistake to track your JEE preparation progress!"
            ctaLabel="Log First Mistake"
            ctaLink="/log"
          />
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.id} className="flex items-center gap-3 card-premium p-4" role="listitem">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(m.subject)}`}>
                  {m.subject}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-foreground">{m.chapter}</div>
                  <div className="text-xs text-muted-foreground">{m.mistake_type}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                  {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
