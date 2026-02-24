import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { PlusCircle, TrendingUp, Flame, Repeat, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface Mistake {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, streak: 0, topType: '—' });
  const [recent, setRecent] = useState<Mistake[]>([]);
  const [goal, setGoal] = useState<{ id: string; goal_text: string; target_count: number; current_count: number } | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [targetInput, setTargetInput] = useState('10');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Total
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

      // All dates for streak
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

      // Most repeated type
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

      // Recent
      const { data: recentData } = await supabase
        .from('mistakes')
        .select('id, subject, chapter, mistake_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecent(recentData || []);

      // Fetch weekly goal
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start_date', weekStart.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalData) {
        // Count reviews this week
        const { count: reviewedThisWeek } = await supabase
          .from('mistakes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_reviewed', true)
          .gte('reviewed_at', weekStart.toISOString());

        setGoal({ ...goalData, current_count: reviewedThisWeek || 0 });
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Total Mistakes', value: stats.total, icon: TrendingUp },
    { label: 'This Week', value: stats.thisWeek, icon: TrendingUp },
    { label: 'Current Streak', value: `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`, icon: Flame },
    { label: 'Most Repeated', value: stats.topType, icon: Repeat },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Weekly Goal */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Weekly Goal
          </h2>
          {!showGoalForm && (
            <button
              onClick={() => setShowGoalForm(true)}
              className="text-sm text-primary hover:underline"
            >
              {goal ? 'Change Goal' : 'Set Goal'}
            </button>
          )}
        </div>

        {showGoalForm && (
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="e.g. Review 10 mistakes this week"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Target reviews:</label>
              <input
                type="number"
                min="1"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={async () => {
                  if (!user || !goalInput.trim()) return;
                  const weekStart = new Date();
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                  weekStart.setHours(0, 0, 0, 0);

                  const { data, error } = await supabase.from('goals').insert({
                    user_id: user.id,
                    goal_text: goalInput.trim(),
                    target_count: parseInt(targetInput) || 10,
                    current_count: 0,
                    week_start_date: weekStart.toISOString().split('T')[0],
                  }).select().single();

                  if (error) {
                    toast({ title: 'Error', description: 'Could not save goal', variant: 'destructive' });
                  } else {
                    setGoal(data);
                    setShowGoalForm(false);
                    setGoalInput('');
                    toast({ title: 'Goal set!', description: goalInput });
                  }
                }}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              >
                Save
              </button>
              <button onClick={() => setShowGoalForm(false)} className="text-sm text-muted-foreground hover:underline">Cancel</button>
            </div>
          </div>
        )}

        {goal ? (
          <div>
            <p className="text-sm text-muted-foreground mb-2">{goal.goal_text}</p>
            <Progress value={Math.min(100, (goal.current_count / goal.target_count) * 100)} className="h-3 mb-1" />
            <p className="text-xs text-muted-foreground">
              {goal.current_count} / {goal.target_count} reviews completed
              {goal.current_count >= goal.target_count && ' 🎉'}
            </p>
          </div>
        ) : !showGoalForm ? (
          <p className="text-sm text-muted-foreground">No goal set for this week. Set one to stay on track!</p>
        ) : null}
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
