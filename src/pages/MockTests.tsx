import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Plus, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface MockTest {
  id: string;
  test_name: string;
  test_date: string;
  physics_score: number;
  chemistry_score: number;
  maths_score: number;
  total_score: number;
  max_score: number;
  percentile: number | null;
  created_at: string;
}

const CHART_THEME = {
  grid: 'hsl(222, 30%, 14%)',
  text: 'hsl(215, 20%, 55%)',
  tooltip: { background: 'hsl(222, 47%, 7%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: 12 },
};

function getPercentileEstimate(total: number): string {
  if (total >= 300) return '~99th';
  if (total >= 250) return '~95th';
  if (total >= 200) return '~85th';
  if (total >= 150) return '~70th';
  if (total >= 100) return '~50th';
  return '<50th';
}

export default function MockTests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [form, setForm] = useState({
    test_name: '', test_date: new Date().toISOString().split('T')[0],
    physics_score: '', chemistry_score: '', maths_score: '',
    max_score: '300', percentile: '',
  });

  useEffect(() => {
    if (!user) return;
    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: true });
    setTests(data || []);
  };

  const handleSubmit = async () => {
    if (!user || !form.test_name) return;
    const p = Number(form.physics_score) || 0;
    const c = Number(form.chemistry_score) || 0;
    const m = Number(form.maths_score) || 0;

    const { error } = await supabase.from('mock_tests').insert({
      user_id: user.id,
      test_name: form.test_name,
      test_date: form.test_date,
      physics_score: p,
      chemistry_score: c,
      maths_score: m,
      total_score: p + c + m,
      max_score: Number(form.max_score) || 300,
      percentile: form.percentile ? Number(form.percentile) : null,
    });

    if (error) {
      toast({ title: 'Error', description: 'Could not save test', variant: 'destructive' });
    } else {
      toast({ title: 'Test logged!' });
      setShowForm(false);
      setForm({ test_name: '', test_date: new Date().toISOString().split('T')[0], physics_score: '', chemistry_score: '', maths_score: '', max_score: '300', percentile: '' });
      fetchTests();
    }
  };

  const trendData = tests.map(t => ({
    name: t.test_name.slice(0, 10),
    total: t.total_score,
    physics: t.physics_score,
    chemistry: t.chemistry_score,
    maths: t.maths_score,
  }));

  const avgScores = tests.length > 0
    ? {
        Physics: tests.reduce((a, t) => a + t.physics_score, 0) / tests.length,
        Chemistry: tests.reduce((a, t) => a + t.chemistry_score, 0) / tests.length,
        Maths: tests.reduce((a, t) => a + t.maths_score, 0) / tests.length,
      }
    : null;

  const weakSubject = avgScores
    ? Object.entries(avgScores).sort((a, b) => a[1] - b[1])[0][0]
    : null;

  const reversedTests = [...tests].reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Mock Tests</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90">
          <Plus className="h-4 w-4" /> Log Test
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 card-glow animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Test Name</label>
              <input value={form.test_name} onChange={e => setForm({ ...form, test_name: e.target.value })} placeholder="e.g. JEE Main Mock #5" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={form.test_date} onChange={e => setForm({ ...form, test_date: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Physics</label>
              <input type="number" value={form.physics_score} onChange={e => setForm({ ...form, physics_score: e.target.value })} placeholder="0" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Chemistry</label>
              <input type="number" value={form.chemistry_score} onChange={e => setForm({ ...form, chemistry_score: e.target.value })} placeholder="0" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Maths</label>
              <input type="number" value={form.maths_score} onChange={e => setForm({ ...form, maths_score: e.target.value })} placeholder="0" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Score</label>
              <input type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Percentile (optional)</label>
              <input type="number" value={form.percentile} onChange={e => setForm({ ...form, percentile: e.target.value })} placeholder="e.g. 95.4" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="rounded-lg gradient-primary px-5 py-2 text-sm font-semibold">Save Test</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Weak subject alert */}
      {weakSubject && tests.length >= 2 && (
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm text-accent">
          <AlertTriangle className="h-4 w-4" />
          Consistently weak: <span className="font-semibold">{weakSubject}</span> — focus here!
        </div>
      )}

      {/* Score trend */}
      {tests.length >= 2 ? (
        <div className="rounded-xl border border-border bg-card p-5 card-glow chart-animate">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Score Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
              <XAxis dataKey="name" tick={{ fill: CHART_THEME.text, fontSize: 10 }} />
              <YAxis tick={{ fill: CHART_THEME.text, fontSize: 12 }} />
              <Tooltip contentStyle={CHART_THEME.tooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="hsl(224, 76%, 48%)" strokeWidth={2.5} dot={{ r: 3 }} name="Total" />
              <Line type="monotone" dataKey="physics" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} name="Physics" />
              <Line type="monotone" dataKey="chemistry" stroke="hsl(160, 84%, 39%)" strokeWidth={1.5} dot={false} name="Chemistry" />
              <Line type="monotone" dataKey="maths" stroke="hsl(25, 95%, 53%)" strokeWidth={1.5} dot={false} name="Maths" />
            </LineChart>
          </ResponsiveContainer>
          {/* Color legend */}
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(217, 91%, 60%)' }} /> Physics</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(160, 84%, 39%)' }} /> Chemistry</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: 'hsl(25, 95%, 53%)' }} /> Maths</span>
          </div>
        </div>
      ) : tests.length === 1 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium">Log 2+ tests to see your score trend</p>
          <p className="text-xs mt-1">Keep going!</p>
        </div>
      ) : null}

      {/* Test history */}
      <div>
        <h3 className="font-semibold mb-3">Test History</h3>
        {tests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No mock tests logged yet. Start by logging your first one!
          </div>
        ) : (
          <div className="space-y-2">
            {reversedTests.map((t, idx) => {
              const testNum = tests.length - idx;
              const isExpanded = expandedTestId === t.id;
              const maxSubject = Math.max(t.physics_score, t.chemistry_score, t.maths_score) || 1;
              const estimatedPercentile = getPercentileEstimate(t.total_score);

              return (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4 card-glow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      <span className="text-xs text-muted-foreground mr-2">Test #{testNum}</span>
                      {t.test_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(t.test_date).toLocaleDateString()}</span>
                      <button onClick={() => setExpandedTestId(isExpanded ? null : t.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span style={{ color: 'hsl(217, 91%, 60%)' }}>P: {t.physics_score}</span>
                    <span style={{ color: 'hsl(160, 84%, 39%)' }}>C: {t.chemistry_score}</span>
                    <span style={{ color: 'hsl(25, 95%, 53%)' }}>M: {t.maths_score}</span>
                    <span className="font-bold ml-auto">Total: {t.total_score}/{t.max_score}</span>
                    {t.percentile && <span className="text-accent">({t.percentile}%ile)</span>}
                  </div>
                  {/* Percentile estimate */}
                  <div className="text-xs text-muted-foreground mt-1">
                    Estimated JEE Percentile: <span className="font-semibold text-primary">{estimatedPercentile}</span>
                  </div>

                  {/* Expandable subject breakdown */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-20" style={{ color: 'hsl(217, 91%, 60%)' }}>Physics: {t.physics_score}</span>
                          <div className="flex-1"><Progress value={(t.physics_score / (t.max_score / 3)) * 100} className="h-2" /></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-20" style={{ color: 'hsl(160, 84%, 39%)' }}>Chemistry: {t.chemistry_score}</span>
                          <div className="flex-1"><Progress value={(t.chemistry_score / (t.max_score / 3)) * 100} className="h-2" /></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-20" style={{ color: 'hsl(25, 95%, 53%)' }}>Maths: {t.maths_score}</span>
                          <div className="flex-1"><Progress value={(t.maths_score / (t.max_score / 3)) * 100} className="h-2" /></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
