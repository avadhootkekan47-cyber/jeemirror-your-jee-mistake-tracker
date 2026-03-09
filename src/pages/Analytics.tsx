import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { CHAPTERS } from '@/lib/constants';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LabelList,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, BookOpen, Flame, Info, Download, Star } from 'lucide-react';
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

type TimeRange = '7' | '30' | 'all';

function InfoTip({ text }: { text: string }) {
  return (
    <UITooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center" aria-label="More info">
          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </UITooltip>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [allData, setAllData] = useState<MistakeRow[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [healthExpanded, setHealthExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('mistakes')
        .select('subject, mistake_type, chapter, is_reviewed, created_at')
        .eq('user_id', user.id);
      setAllData(data || []);
    })();
  }, [user]);

  const filteredData = useMemo(() => {
    if (timeRange === 'all') return allData;
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allData.filter(m => new Date(m.created_at) >= cutoff);
  }, [allData, timeRange]);

  const { bySubject, byType, weekly, summary, weakAreas, chapterHeatmap, thisWeekCount, lastWeekCount } = useMemo(() => {
    const subjectCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};
    const chapterCounts: Record<string, { subject: string; count: number }> = {};
    const heatmapData: Record<string, Record<string, number>> = {};

    filteredData.forEach((m) => {
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

    const bySubject = Object.entries(subjectCounts).map(([name, count]) => ({ name, count }));
    const byType = Object.entries(typeCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Weekly trend (last 8 weeks from all data)
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

    // This week vs last week from ALL data
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    let thisWeekCount = 0, lastWeekCount = 0;
    allData.forEach(m => {
      const d = new Date(m.created_at);
      if (d >= weekAgo) thisWeekCount++;
      else if (d >= twoWeeksAgo) lastWeekCount++;
    });

    const weakSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    const worstChapter = Object.entries(chapterCounts).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || '—';

    // Streak
    const uniqueDays = [...new Set(filteredData.map(m => new Date(m.created_at).toDateString()))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0, bestStreak = 0;
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
      let ts = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const diff = (new Date(uniqueDays[i - 1]).getTime() - new Date(uniqueDays[i]).getTime()) / 86400000;
        if (Math.abs(diff - 1) < 0.5) ts++;
        else { bestStreak = Math.max(bestStreak, ts); ts = 1; }
      }
      bestStreak = Math.max(bestStreak, ts, streak);
    }

    return {
      bySubject,
      byType,
      weekly: weeks,
      summary: { total: filteredData.length, weakSubject, worstChapter, streak, bestStreak },
      weakAreas: Object.entries(chapterCounts).map(([chapter, { subject, count }]) => ({ chapter, subject, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      chapterHeatmap: heatmapData,
      thisWeekCount,
      lastWeekCount,
    };
  }, [filteredData, allData]);

  const exportCSV = () => {
    if (allData.length === 0) return;
    const headers = ['Subject', 'Chapter', 'Mistake Type', 'Reviewed', 'Date'];
    const rows = allData.map(m => [m.subject, m.chapter, m.mistake_type, m.is_reviewed ? 'Yes' : 'No', new Date(m.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'jeemirror-mistakes.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const pieColors = Object.values(SUBJECT_COLORS);
  const isEmpty = summary.total < 3;
  const weekDiff = thisWeekCount - lastWeekCount;
  const healthScore = Math.min(100, Math.round(
    (summary.total > 0 ? 40 : 0) +
    (summary.streak > 3 ? 30 : summary.streak * 10) +
    (bySubject.length >= 3 ? 30 : bySubject.length * 10)
  ));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Analytics</h1>
        {allData.length > 0 && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors touch-target">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Time filter tabs */}
      <div className="flex gap-1 rounded-lg bg-secondary/50 border border-border p-1">
        {([['7', 'Last 7 Days'], ['30', 'Last 30 Days'], ['all', 'All Time']] as [TimeRange, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setTimeRange(val)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${timeRange === val ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {isEmpty && (
        <EmptyState icon="📊" title="Your analytics will appear here"
          description="Log 3+ mistakes to see detailed charts and insights about your preparation. Start tracking now!"
          ctaLabel="Log a Mistake" ctaLink="/log" />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Mistakes</span>
          </div>
          <div className="text-xl font-bold text-foreground">{summary.total}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Needs Most Attention</span>
          </div>
          <div className="text-xl font-bold text-foreground">{summary.weakSubject}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Most Mistakes In</span>
          </div>
          <div className="text-xl font-bold text-foreground truncate">{summary.worstChapter}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 card-glow">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <div className="text-xl font-bold text-foreground">{summary.streak}d 🔥 <span className="text-sm text-muted-foreground">| Best: {summary.bestStreak}d ⭐</span></div>
        </div>
      </div>

      {/* Weekly Trend Comparison */}
      <div className={`rounded-xl border p-4 ${weekDiff <= 0 ? 'border-accent/30 bg-accent/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <div className="flex items-center gap-2">
          {weekDiff <= 0 ? <TrendingDown className="h-5 w-5 text-accent" /> : <TrendingUp className="h-5 w-5 text-destructive" />}
          <span className="font-semibold text-foreground">
            This week: {thisWeekCount} mistakes{' '}
            <span className={weekDiff <= 0 ? 'text-accent' : 'text-destructive'}>
              {weekDiff === 0 ? '— same as last week' : weekDiff > 0 ? `↑${weekDiff} from last week` : `↓${Math.abs(weekDiff)} from last week`}
            </span>
          </span>
        </div>
      </div>

      {/* Health Score */}
      {summary.total > 0 && (
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">Preparation Health Score</h3>
            <button onClick={() => setHealthExpanded(!healthExpanded)} className="text-xs text-primary hover:underline">
              How is this calculated?
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Based on revision coverage, mistake frequency, and mock test trend</p>
          {healthExpanded && (
            <p className="text-xs text-muted-foreground mb-3 bg-secondary/50 rounded-lg p-3">
              Review completion rate (40%), consistency streak (30%), and subject balance (30%).
            </p>
          )}
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-foreground tabular-nums">{healthScore}%</div>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-primary transition-all duration-700" style={{ width: `${healthScore}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isEmpty && (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Pie chart */}
            <div className="rounded-xl border border-border bg-card p-5 card-glow">
              <h3 className="font-semibold text-foreground mb-4">By Subject</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bySubject} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="count" nameKey="name" stroke="none">
                    {bySubject.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_THEME.tooltip}
                    formatter={(value: number, name: string) => {
                      const total = bySubject.reduce((s, d) => s + d.count, 0);
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                      return [`${value} mistakes (${pct}%)`, name];
                    }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: CHART_THEME.text }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Horizontal bar chart - by type */}
            <div className="rounded-xl border border-border bg-card p-5 card-glow">
              <h3 className="font-semibold text-foreground mb-4">By Error Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                  <XAxis type="number" tick={{ fill: CHART_THEME.text, fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: CHART_THEME.text, fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={CHART_THEME.tooltip} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="url(#barGradient)">
                    <LabelList dataKey="count" position="right" fill={CHART_THEME.text} fontSize={11} />
                  </Bar>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(263, 70%, 50%)" />
                      <stop offset="100%" stopColor="hsl(224, 76%, 48%)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line chart */}
          <div className="rounded-xl border border-border bg-card p-5 card-glow">
            <h3 className="font-semibold text-foreground mb-4">Weekly Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                <XAxis dataKey="date" tick={{ fill: CHART_THEME.text, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART_THEME.text, fontSize: 12 }} />
                <Tooltip contentStyle={CHART_THEME.tooltip} />
                <Line type="monotone" dataKey="count" stroke="url(#lineGradient)" strokeWidth={2.5}
                  dot={{ r: 4, fill: 'hsl(160, 84%, 39%)' }}
                  label={{ position: 'top', fill: CHART_THEME.text, fontSize: 10 }} />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" />
                    <stop offset="100%" stopColor="hsl(224, 76%, 48%)" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Chapter Heatmap</h3>
            <div className="grid md:grid-cols-3 gap-5">
              {Object.entries(CHAPTERS).map(([subject, chapters]) => {
                const subjectData = chapterHeatmap[subject] || {};
                const maxCount = Math.max(1, ...Object.values(subjectData));
                return (
                  <div key={subject} className="rounded-xl border border-border bg-card p-4 card-glow">
                    <h4 className={`text-sm font-semibold mb-3 ${getSubjectClass(subject)} inline-block rounded-md px-2 py-0.5`}>{subject}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {chapters.map((ch) => {
                        const count = subjectData[ch] || 0;
                        const intensity = count / maxCount;
                        const bg = count === 0 ? 'bg-muted' : intensity < 0.33 ? 'bg-red-400/30' : intensity < 0.66 ? 'bg-red-500/50' : 'bg-red-600/80';
                        return (
                          <div key={ch} title={`${ch}: ${count} mistake${count !== 1 ? 's' : ''}`}
                            className={`rounded-md px-2 py-1 text-xs font-medium ${bg} cursor-default text-foreground`}>
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

          {weakAreas.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-foreground">Weak Areas (Unreviewed)</h3>
              <div className="space-y-2">
                {weakAreas.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 card-glow">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getSubjectClass(w.subject)}`}>{w.subject}</span>
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
