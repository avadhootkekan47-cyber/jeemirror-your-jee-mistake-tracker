import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { CHAPTERS } from '@/lib/constants';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LabelList,
} from 'recharts';
import { TrendingUp, AlertTriangle, BookOpen, Flame, Info, Download } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import EmptyState from '@/components/EmptyState';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: 'hsl(217, 91%, 60%)',
  Chemistry: 'hsl(160, 84%, 39%)',
  Mathematics: 'hsl(25, 95%, 53%)',
};

const CHART_THEME = {
  grid: 'hsl(222, 30%, 14%)',
  text: 'hsl(230, 15%, 70%)',
  tooltip: { background: 'hsl(222, 47%, 7%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: 12, color: 'hsl(210, 40%, 90%)' },
};

interface MistakeRow {
  subject: string;
  mistake_type: string;
  chapter: string;
  is_reviewed: boolean;
  created_at: string;
}

function InfoTip({ text }: { text: string }) {
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center" aria-label="More info">
          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">
        {text}
      </TooltipContent>
    </UITooltip>
  );
}

function DataTable({ data, columns }: { data: Record<string, any>[]; columns: { key: string; label: string }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs" role="table">
        <thead>
          <tr className="border-b border-border">
            {columns.map(c => (
              <th key={c.key} className="text-left py-2 px-2 text-muted-foreground font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border/50">
              {columns.map(c => (
                <td key={c.key} className="py-1.5 px-2 text-foreground">{row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [allData, setAllData] = useState<MistakeRow[]>([]);
  const [bySubject, setBySubject] = useState<{ name: string; count: number }[]>([]);
  const [byType, setByType] = useState<{ name: string; count: number }[]>([]);
  const [daily, setDaily] = useState<{ date: string; count: number }[]>([]);
  const [weakAreas, setWeakAreas] = useState<{ chapter: string; subject: string; count: number }[]>([]);
  const [chapterHeatmap, setChapterHeatmap] = useState<Record<string, Record<string, number>>>({});
  const [summary, setSummary] = useState({ total: 0, weakSubject: '—', worstChapter: '—', streak: 0 });
  const [healthExpanded, setHealthExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      const { data: all } = await supabase
        .from('mistakes')
        .select('subject, mistake_type, chapter, is_reviewed, created_at')
        .eq('user_id', user.id);

      if (!all) return;
      setAllData(all);

      const subjectCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      const dayCounts: Record<string, number> = {};
      const chapterCounts: Record<string, { subject: string; count: number }> = {};
      const heatmapData: Record<string, Record<string, number>> = {};

      all.forEach((m) => {
        subjectCounts[m.subject] = (subjectCounts[m.subject] || 0) + 1;
        typeCounts[m.mistake_type] = (typeCounts[m.mistake_type] || 0) + 1;
        const day = new Date(m.created_at).toISOString().split('T')[0];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
        if (!heatmapData[m.subject]) heatmapData[m.subject] = {};
        heatmapData[m.subject][m.chapter] = (heatmapData[m.subject][m.chapter] || 0) + 1;
        if (!m.is_reviewed) {
          if (!chapterCounts[m.chapter]) chapterCounts[m.chapter] = { subject: m.subject, count: 0 };
          chapterCounts[m.chapter].count++;
        }
      });

      setChapterHeatmap(heatmapData);
      setBySubject(Object.entries(subjectCounts).map(([name, count]) => ({ name, count })));
      setByType(Object.entries(typeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      // Weekly trend (last 8 weeks)
      const weeks: { date: string; count: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const startKey = weekStart.toISOString().split('T')[0];
        const endKey = weekEnd.toISOString().split('T')[0];
        let count = 0;
        Object.entries(dayCounts).forEach(([d, c]) => {
          if (d >= startKey && d <= endKey) count += c;
        });
        weeks.push({ date: `W${8 - i}`, count });
      }
      setDaily(weeks);

      const weakSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
      const worstChapter = Object.entries(chapterCounts).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || '—';

      // Streak
      const uniqueDays = [...new Set(all.map(m => new Date(m.created_at).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      let streak = 0;
      if (uniqueDays.length > 0) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const diff = (new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000;
            if (Math.abs(diff - 1) < 0.5) streak++;
            else break;
          }
        }
      }

      setSummary({ total: all.length, weakSubject, worstChapter, streak });
      setWeakAreas(
        Object.entries(chapterCounts)
          .map(([chapter, { subject, count }]) => ({ chapter, subject, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );
    };

    fetchAnalytics();
  }, [user]);

  const exportCSV = () => {
    if (allData.length === 0) return;
    const headers = ['Subject', 'Chapter', 'Mistake Type', 'Reviewed', 'Date'];
    const rows = allData.map(m => [
      m.subject, m.chapter, m.mistake_type,
      m.is_reviewed ? 'Yes' : 'No',
      new Date(m.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jeemirror-mistakes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { label: 'Total Mistakes', value: summary.total, icon: TrendingUp, color: 'text-primary', tip: 'Total number of mistakes you have logged across all subjects' },
    { label: 'Needs Most Attention', value: summary.weakSubject, icon: AlertTriangle, color: 'text-accent', tip: 'Based on total mistakes logged in this subject over all time' },
    { label: 'Most Mistakes In', value: summary.worstChapter, icon: BookOpen, color: 'text-destructive', tip: 'Chapter with the highest number of unreviewed mistakes' },
    { label: 'Current Streak', value: `${summary.streak}d`, icon: Flame, color: 'text-success', tip: 'Number of consecutive days you have logged at least one mistake' },
  ];

  const pieColors = Object.values(SUBJECT_COLORS);
  const isEmpty = summary.total < 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Analytics</h1>
        {allData.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors touch-target"
            aria-label="Export mistakes as CSV"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <EmptyState
          icon="📊"
          title="Your analytics will appear here"
          description="Log 3+ mistakes to see detailed charts and insights about your preparation. Start tracking now!"
          ctaLabel="Log a Mistake"
          ctaLink="/log"
        />
      )}

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((s, i) => (
          <div key={s.label} className={`rounded-xl border border-border bg-card p-4 card-glow chart-animate chart-animate-delay-${i + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} aria-hidden="true" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <InfoTip text={s.tip} />
            </div>
            <div className="text-xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Preparation Health Score */}
      {summary.total > 0 && (
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">Preparation Health Score</h3>
            <button
              onClick={() => setHealthExpanded(!healthExpanded)}
              className="text-xs text-primary hover:underline"
            >
              How is this calculated?
            </button>
          </div>
          {healthExpanded && (
            <p className="text-xs text-muted-foreground mb-3 bg-secondary/50 rounded-lg p-3">
              The health score is calculated based on: review completion rate (40%), consistency streak (30%),
              and subject balance (30%). A higher score means you're reviewing regularly, maintaining streaks,
              and covering all subjects evenly.
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-foreground tabular-nums">
              {Math.min(100, Math.round(
                (summary.total > 0 ? 40 : 0) +
                (summary.streak > 3 ? 30 : summary.streak * 10) +
                (bySubject.length >= 3 ? 30 : bySubject.length * 10)
              ))}%
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full gradient-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.round((summary.total > 0 ? 40 : 0) + (summary.streak > 3 ? 30 : summary.streak * 10) + (bySubject.length >= 3 ? 30 : bySubject.length * 10)))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Charts grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Pie chart - by subject */}
            <div className="rounded-xl border border-border bg-card p-5 card-glow chart-animate chart-animate-delay-1" aria-label="Mistakes by subject pie chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">By Subject</h3>
                <span className="text-xs rounded-full gradient-primary px-2.5 py-1 text-foreground font-medium">
                  {bySubject.reduce((a, b) => a + b.count, 0)} total
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={bySubject}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="count"
                    nameKey="name"
                    stroke="none"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {bySubject.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_THEME.tooltip} />
                  <Legend wrapperStyle={{ fontSize: 12, color: CHART_THEME.text }} />
                </PieChart>
              </ResponsiveContainer>
              <DataTable
                data={bySubject}
                columns={[{ key: 'name', label: 'Subject' }, { key: 'count', label: 'Mistakes' }]}
              />
            </div>

            {/* Bar chart - by type */}
            <div className="rounded-xl border border-border bg-card p-5 card-glow chart-animate chart-animate-delay-2" aria-label="Mistakes by error type bar chart">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">By Error Type</h3>
                <span className="text-xs rounded-full bg-accent/20 text-accent px-2.5 py-1 font-medium">
                  {byType.length} types
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis dataKey="name" tick={{ fill: CHART_THEME.text, fontSize: 10 }} angle={-20} textAnchor="end" height={50} label={{ value: 'Error Type', position: 'insideBottom', offset: -5, fill: CHART_THEME.text, fontSize: 11 }} />
                  <YAxis tick={{ fill: CHART_THEME.text, fontSize: 12 }} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: CHART_THEME.text, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="url(#barGradient)">
                    <LabelList dataKey="count" position="top" fill={CHART_THEME.text} fontSize={11} />
                  </Bar>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(224, 76%, 48%)" />
                      <stop offset="100%" stopColor="hsl(263, 70%, 50%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              <DataTable
                data={byType}
                columns={[{ key: 'name', label: 'Error Type' }, { key: 'count', label: 'Count' }]}
              />
            </div>
          </div>

          {/* Line chart - weekly trend */}
          <div className="rounded-xl border border-border bg-card p-5 card-glow chart-animate chart-animate-delay-3" aria-label="Weekly mistakes trend line chart">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Weekly Trend</h3>
              <span className="text-xs rounded-full bg-success/20 text-success px-2.5 py-1 font-medium">
                Last 8 weeks
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="date" tick={{ fill: CHART_THEME.text, fontSize: 11 }} label={{ value: 'Week', position: 'insideBottom', offset: -5, fill: CHART_THEME.text, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_THEME.text, fontSize: 12 }} label={{ value: 'Mistakes', angle: -90, position: 'insideLeft', fill: CHART_THEME.text, fontSize: 11 }} />
                <Tooltip contentStyle={CHART_THEME.tooltip} />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" />
                    <stop offset="100%" stopColor="hsl(224, 76%, 48%)" />
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="count" stroke="url(#lineGradient)" strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(160, 84%, 39%)' }}
                  label={{ position: 'top', fill: CHART_THEME.text, fontSize: 10 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <DataTable
              data={daily}
              columns={[{ key: 'date', label: 'Week' }, { key: 'count', label: 'Mistakes' }]}
            />
          </div>

          {/* Chapter Heatmap */}
          <div className="chart-animate chart-animate-delay-4">
            <h3 className="font-semibold mb-4 text-foreground">Chapter Heatmap</h3>
            <div className="grid md:grid-cols-3 gap-5">
              {Object.entries(CHAPTERS).map(([subject, chapters]) => {
                const subjectData = chapterHeatmap[subject] || {};
                const maxCount = Math.max(1, ...Object.values(subjectData));
                return (
                  <div key={subject} className="rounded-xl border border-border bg-card p-4 card-glow" aria-label={`${subject} chapter heatmap`}>
                    <h4 className={`text-sm font-semibold mb-3 ${getSubjectClass(subject)} inline-block rounded-md px-2 py-0.5`}>
                      {subject}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {chapters.map((ch) => {
                        const count = subjectData[ch] || 0;
                        const intensity = count / maxCount;
                        const bg = count === 0
                          ? 'bg-muted'
                          : intensity < 0.33
                            ? 'bg-red-400/30'
                            : intensity < 0.66
                              ? 'bg-red-500/50'
                              : 'bg-red-600/80';
                        return (
                          <div
                            key={ch}
                            title={`${ch}: ${count} mistake${count !== 1 ? 's' : ''}`}
                            className={`rounded-md px-2 py-1 text-xs font-medium ${bg} cursor-default transition-colors text-foreground`}
                          >
                            {ch} {count > 0 && <span className="text-muted-foreground">({count})</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <div className="chart-animate chart-animate-delay-4">
              <h3 className="font-semibold mb-3 text-foreground">Weak Areas (Unreviewed)</h3>
              <div className="space-y-2">
                {weakAreas.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-glow">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(w.subject)}`}>
                      {w.subject}
                    </span>
                    <span className="font-medium flex-1 text-foreground">{w.chapter}</span>
                    <span className="text-sm text-muted-foreground">{w.count} unreviewed</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
