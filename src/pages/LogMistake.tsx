import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS, MISTAKE_TYPES, DIFFICULTIES } from '@/lib/constants';
import { Check } from 'lucide-react';

export default function LogMistake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [chapterQuery, setChapterQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mistakeType, setMistakeType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const suggestions = subject && CHAPTERS[subject]
    ? CHAPTERS[subject].filter((c) =>
        c.toLowerCase().includes(chapterQuery.toLowerCase())
      )
    : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject || !chapter || !mistakeType || !difficulty) return;

    setSaving(true);
    const { error } = await supabase.from('mistakes').insert({
      user_id: user.id,
      subject,
      chapter,
      mistake_type: mistakeType,
      difficulty,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      console.error('Failed to insert mistake:', error);
      return;
    }
    setSaved(true);
  };

  const resetForm = () => {
    setSubject('');
    setChapter('');
    setChapterQuery('');
    setMistakeType('');
    setDifficulty('');
    setNotes('');
    setSaved(false);
  };

  if (saved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold">Mistake Logged!</h2>
          <div className="flex gap-3 justify-center">
            <button onClick={resetForm} className="rounded-lg border border-border px-5 py-2.5 font-medium transition-colors hover:bg-secondary">
              Log Another
            </button>
            <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-all hover:opacity-90">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Log a Mistake</h1>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="text-sm font-medium">Subject</label>
          <select value={subject} onChange={(e) => { setSubject(e.target.value); setChapter(''); setChapterQuery(''); }}
            required className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select subject</option>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="relative">
          <label className="text-sm font-medium">Chapter</label>
          <input
            value={chapter || chapterQuery}
            onChange={(e) => { setChapterQuery(e.target.value); setChapter(''); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={subject ? 'Start typing...' : 'Select a subject first'}
            required
            className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {showSuggestions && suggestions.length > 0 && !chapter && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <button type="button" key={s} onClick={() => { setChapter(s); setChapterQuery(''); setShowSuggestions(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Mistake Type</label>
          <select value={mistakeType} onChange={(e) => setMistakeType(e.target.value)}
            required className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select type</option>
            {MISTAKE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            required className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select difficulty</option>
            {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Notes <span className="text-muted-foreground">(optional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="What went wrong? How will you avoid this next time?"
            rows={3} className="mt-1 w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <button disabled={saving} type="submit"
          className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Mistake'}
        </button>
      </form>
    </div>
  );
}
