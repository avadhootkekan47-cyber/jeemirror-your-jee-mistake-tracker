import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { PlusCircle, TrendingUp, Flame, Repeat, Target, Save } from 'lucide-react';
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
  chapters_done: number;
  topics_target: number;
  topics_done: number;
  backlog_target: number;
  backlog_done: number;
  questions_target: number;
  questions_done: number;
}

const DEFAULT_GOALS: WeeklyGoals = {
  chapters_target: 5, chapters_done: 0,
  topics_target: 10, topics_done: 0,
  backlog_target: 3, backlog_done: 0,
  questions_target: 50, questions_done: 0,
};

const GOAL_METRICS = [
  { key: 'chapters', label: 'Chapters Completed', emoji: '📖' },
  { key: 'topics', label: 'Topics Understood', emoji: '💡' },
  { key: 'backlog', label: 'Backlog Completed', emoji: '📋' },
  { key: 'questions', label: 'Questions Solved', emoji: '✏️' },
] as const;

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0, topType: '—' });
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

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: thisWeek } = await supabase
        .from('mistakes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      const { data: allDates } = await supabase
        .from('mistakes')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let streak = 0;
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
      }

      const { data: types } = await supabase
        .from('mistakes')
        .select('mistake_type')
        .eq('user_id', user.id);

      let topType = '—';
      if (types && types.length > 0) {
        const counts: Record<string, number> = {};
        types.forEach((t) => { counts[t.mistake_type] = (counts[t.mistake_type] || 0) + 1; });
        topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }

      setStats({ total: total || 0, thisWeek: thisWeek || 0, streak, topType });
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

  const statCards = [
    { label: 'Total Mistakes', value: stats.total, icon: TrendingUp, color: 'text-primary' },
    { label: 'This Week', value: stats.thisWeek, icon: TrendingUp, color: 'text-accent' },
    { label: 'Current Streak', value: `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`, icon: Flame, color: 'text-warning' },
    { label: 'Most Repeated', value: stats.topType, icon: Repeat, color: 'text-destructive' },
  ];

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={s.label} className={`card-premium p-4 chart-animate chart-animate-delay-${i + 1}`}>
            <s.icon className={`h-4 w-4 ${s.color} mb-2`} aria-hidden="true" />
            <div className="text-2xl font-bold tabular-nums count-up text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Link
        to="/log"
        className="flex items-center justify-center gap-2 w-full rounded-xl gradient-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/20"
      >
        <PlusCircle className="h-5 w-5" />
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
                        <label htmlFor={`${key}-done`} className="sr-only">{label} completed</label>
                        <input
                          id={`${key}-done`}
                          type="number"
                          min={0}
                          value={done}
                          onChange={(e) => setGoals(prev => ({ ...prev, [`${key}_done`]: parseInt(e.target.value) || 0 }))}
                          className="w-14 rounded border border-border bg-background px-2 py-0.5 text-sm text-center text-foreground"
                        />
                        /
                        <label htmlFor={`${key}-target`} className="sr-only">{label} target</label>
                        <input
                          id={`${key}-target`}
                          type="number"
                          min={1}
                          value={target}
                          onChange={(e) => setGoals(prev => ({ ...prev, [`${key}_target`]: parseInt(e.target.value) || 1 }))}
                          className="w-14 rounded border border-border bg-background px-2 py-0.5 text-sm text-center text-foreground"
                        />
                      </span>
                    ) : (
                      `${done} / ${target} ${pct >= 100 ? '🎉' : ''}`
                    )}
                  </span>
                </div>
                <Progress value={pct} className="h-2.5" aria-label={`${label}: ${pct}% complete`} />
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
