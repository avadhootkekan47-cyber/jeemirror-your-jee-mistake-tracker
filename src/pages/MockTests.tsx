import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function MockTests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [showForm, setShowForm] = useState(false);
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

  // Detect weak subject
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Mock Tests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Log Test
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
      {trendData.length > 0 && (
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
              <Line type="monotone" dataKey="total" stroke="hsl(224, 76%, 48%)" strokeWidth={2.5} dot={{ r: 3 }} name="Total" />
              <Line type="monotone" dataKey="physics" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} name="Physics" />
              <Line type="monotone" dataKey="chemistry" stroke="hsl(160, 84%, 39%)" strokeWidth={1.5} dot={false} name="Chemistry" />
              <Line type="monotone" dataKey="maths" stroke="hsl(25, 95%, 53%)" strokeWidth={1.5} dot={false} name="Maths" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Test history */}
      <div>
        <h3 className="font-semibold mb-3">Test History</h3>
        {tests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            No mock tests logged yet. Start by logging your first one!
          </div>
        ) : (
          <div className="space-y-2">
            {[...tests].reverse().map(t => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-4 card-glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{t.test_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(t.test_date).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-physics">P: {t.physics_score}</span>
                  <span className="text-chemistry">C: {t.chemistry_score}</span>
                  <span className="text-mathematics">M: {t.maths_score}</span>
                  <span className="font-bold ml-auto">Total: {t.total_score}/{t.max_score}</span>
                  {t.percentile && <span className="text-success">({t.percentile}%ile)</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
