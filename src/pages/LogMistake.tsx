import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SUBJECTS, CHAPTERS, MISTAKE_TYPES } from '@/lib/constants';
import { Check, ChevronDown, ChevronUp, Atom, FlaskConical, Calculator } from 'lucide-react';

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Atom className="h-6 w-6" />,
  Chemistry: <FlaskConical className="h-6 w-6" />,
  Mathematics: <Calculator className="h-6 w-6" />,
};

const STEPS = ['Subject', 'Chapter', 'Error Type'];

export default function LogMistake() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [mistakeType, setMistakeType] = useState('');
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        alert('Could not retrieve user. Please log in again.');
        setSaving(false);
        return;
      }

      const { error } = await supabase.from('mistakes').insert([{
        user_id: authData.user.id,
        subject,
        chapter,
        mistake_type: mistakeType,
        difficulty: 'Medium',
        notes: notes || null,
      }]);

      setSaving(false);
      if (error) {
        alert(`Failed to save mistake: ${error.message}`);
        return;
      }
      setSaved(true);
    } catch (err: any) {
      alert(`Unexpected error: ${err.message}`);
      setSaving(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSubject('');
    setChapter('');
    setMistakeType('');
    setNotes('');
    setNotesOpen(false);
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
      <h1 className="text-2xl font-bold mb-4">Log a Mistake</h1>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-[10px] mt-1 ${isActive || isDone ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full -mt-4 ${isDone ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Subject */}
      {step === 1 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">Pick a subject</p>
          <div className="grid grid-cols-1 gap-3">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => { setSubject(s); setStep(2); }}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left text-lg font-semibold transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {SUBJECT_ICONS[s]}
                </div>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Chapter */}
      {step === 2 && (
        <div className="space-y-3 animate-fade-in">
          <button onClick={() => { setStep(1); setSubject(''); }} className="text-sm text-primary hover:underline mb-1">
            ← Back to subjects
          </button>
          <p className="text-sm text-muted-foreground">Pick a chapter in <span className="font-medium text-foreground">{subject}</span></p>
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {(CHAPTERS[subject] || []).map((c) => (
              <button
                key={c}
                onClick={() => { setChapter(c); setStep(3); }}
                className="w-full rounded-xl border border-border bg-card p-4 text-left font-medium transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Error Type */}
      {step === 3 && (
        <div className="space-y-3 animate-fade-in">
          <button onClick={() => { setStep(2); setChapter(''); }} className="text-sm text-primary hover:underline mb-1">
            ← Back to chapters
          </button>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{subject}</span> → <span className="font-medium text-foreground">{chapter}</span>
          </p>
          <p className="text-sm text-muted-foreground">What type of mistake?</p>
          <div className="grid grid-cols-2 gap-3">
            {MISTAKE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setMistakeType(t);
                  // Don't auto-save, show notes option first
                }}
                className={`rounded-xl border p-4 text-left text-sm font-medium transition-all active:scale-[0.98] ${
                  mistakeType === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary hover:bg-primary/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {mistakeType && (
            <div className="space-y-3 animate-fade-in mt-4">
              {/* Collapsible notes */}
              <button
                onClick={() => setNotesOpen(!notesOpen)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Add notes (optional)
              </button>
              {notesOpen && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What went wrong? How will you avoid this next time?"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none animate-fade-in"
                />
              )}

              <button
                disabled={saving}
                onClick={handleSave}
                className="w-full rounded-xl bg-primary py-4 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Mistake'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
