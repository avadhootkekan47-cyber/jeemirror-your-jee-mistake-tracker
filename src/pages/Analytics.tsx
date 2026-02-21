import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [bySubject, setBySubject] = useState<{ name: string; count: number }[]>([]);
  const [byType, setByType] = useState<{ name: string; count: number }[]>([]);
  const [daily, setDaily] = useState<{ date: string; count: number }[]>([]);
  const [weakAreas, setWeakAreas] = useState<{ chapter: string; subject: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      const { data: all } = await supabase
        .from('mistakes')
        .select('subject, mistake_type, chapter, is_reviewed, created_at')
        .eq('user_id', user.id);

      if (!all) return;

      // By subject
      const subjectCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      const dayCounts: Record<string, number> = {};
      const chapterCounts: Record<string, { subject: string; count: number }> = {};

      all.forEach((m) => {
        subjectCounts[m.subject] = (subjectCounts[m.subject] || 0) + 1;
        typeCounts[m.mistake_type] = (typeCounts[m.mistake_type] || 0) + 1;

        const day = new Date(m.created_at).toISOString().split('T')[0];
        dayCounts[day] = (dayCounts[day] || 0) + 1;

        if (!m.is_reviewed) {
          if (!chapterCounts[m.chapter]) chapterCounts[m.chapter] = { subject: m.subject, count: 0 };
          chapterCounts[m.chapter].count++;
        }
      });

      setBySubject(Object.entries(subjectCounts).map(([name, count]) => ({ name, count })));
      setByType(Object.entries(typeCounts).map(([name, count]) => ({ name, count })));

      // Last 30 days
      const days: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days.push({ date: key.slice(5), count: dayCounts[key] || 0 });
      }
      setDaily(days);

      setWeakAreas(
        Object.entries(chapterCounts)
          .map(([chapter, { subject, count }]) => ({ chapter, subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );
    };

    fetchAnalytics();
  }, [user]);

  const chartColors = {
    bar: 'hsl(263, 84%, 58%)',
    line: 'hsl(263, 84%, 58%)',
    grid: 'hsl(0, 0%, 15%)',
    text: 'hsl(0, 0%, 64%)',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Mistakes by Subject</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySubject}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 12 }} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} />
              <Bar dataKey="count" fill={chartColors.bar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Mistakes by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis dataKey="name" tick={{ fill: chartColors.text, fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} />
              <Bar dataKey="count" fill={chartColors.bar} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-4">Mistakes per Day (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 10 }} />
            <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'hsl(0,0%,7%)', border: '1px solid hsl(0,0%,15%)', borderRadius: 8 }} />
            <Line type="monotone" dataKey="count" stroke={chartColors.line} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {weakAreas.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Weak Areas (Unreviewed)</h3>
          <div className="space-y-2">
            {weakAreas.map((w, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-hover">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(w.subject)}`}>
                  {w.subject}
                </span>
                <span className="font-medium flex-1">{w.chapter}</span>
                <span className="text-sm text-muted-foreground">{w.count} unreviewed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
