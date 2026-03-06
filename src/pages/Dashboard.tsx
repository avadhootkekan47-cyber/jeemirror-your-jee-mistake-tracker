import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { PlusCircle, TrendingUp, Flame, Repeat, Target, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0, topType: '—' });
  const [recent, setRecent] = useState<Mistake[]>([]);
  const [goals, setGoals] = useState<WeeklyGoals>(DEFAULT_GOALS);
  const [editingGoals, setEditingGoals] = useState(false);
  const { toast } = useToast();

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
      toast({ title: 'Saved!', description: 'Weekly goals updated' });
      setEditingGoals(false);
    }
  };

  const statCards = [
    { label: 'Total Mistakes', value: stats.total, icon: TrendingUp },
    { label: 'This Week', value: stats.thisWeek, icon: TrendingUp },
    { label: 'Current Streak', value: `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`, icon: Flame },
    { label: 'Most Repeated', value: stats.topType, icon: Repeat },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400">
        🔒 Your data is securely saved to the cloud — accessible from any device
      </div>

      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 card-hover">
            <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Link
        to="/log"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90"
      >
        <PlusCircle className="h-5 w-5" />
        Log New Mistake
      </Link>

      {/* Weekly Goals — 4 metrics */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Goals
          </h2>
          <button
            onClick={() => editingGoals ? saveGoals() : setEditingGoals(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
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
                  <span className="font-medium">{emoji} {label}</span>
                  <span className="text-muted-foreground">
                    {editingGoals ? (
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={done}
                          onChange={(e) => setGoals(prev => ({ ...prev, [`${key}_done`]: parseInt(e.target.value) || 0 }))}
                          className="w-14 rounded border border-border bg-background px-2 py-0.5 text-sm text-center"
                        />
                        /
                        <input
                          type="number"
                          min={1}
                          value={target}
                          onChange={(e) => setGoals(prev => ({ ...prev, [`${key}_target`]: parseInt(e.target.value) || 1 }))}
                          className="w-14 rounded border border-border bg-background px-2 py-0.5 text-sm text-center"
                        />
                      </span>
                    ) : (
                      `${done} / ${target} ${pct >= 100 ? '🎉' : ''}`
                    )}
                  </span>
                </div>
                <Progress value={pct} className="h-2.5" />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Mistakes</h2>
          <Link to="/history" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No mistakes logged yet. Start by logging your first one!
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-hover">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(m.subject)}`}>
                  {m.subject}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.chapter}</div>
                  <div className="text-xs text-muted-foreground">{m.mistake_type}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
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
