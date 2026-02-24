import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { CheckCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Mistake {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  notes: string | null;
  created_at: string;
}

export default function RevisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMistakes = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('mistakes')
      .select('id, subject, chapter, mistake_type, notes, created_at')
      .eq('user_id', user.id)
      .eq('is_reviewed', false)
      .order('created_at', { ascending: true });

    setMistakes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMistakes();
  }, [user]);

  const markAsRevised = async (id: string) => {
    const { error } = await supabase
      .from('mistakes')
      .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to mark as revised', variant: 'destructive' });
      return;
    }

    setMistakes((prev) => prev.filter((m) => m.id !== id));
    toast({ title: 'Revised!', description: 'Mistake marked as reviewed' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Revision Mode</h1>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          <BookOpen className="h-4 w-4" />
          {mistakes.length} mistake{mistakes.length !== 1 ? 's' : ''} pending revision
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading…</div>
      ) : mistakes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <h3 className="text-lg font-semibold">All caught up!</h3>
          <p className="text-muted-foreground mt-1">No pending mistakes to revise.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4 card-hover">
              <div className="flex items-start gap-3">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold mt-0.5 ${getSubjectClass(m.subject)}`}>
                  {m.subject}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{m.chapter}</div>
                  <div className="text-sm text-muted-foreground">{m.mistake_type}</div>
                  {m.notes && (
                    <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2.5">
                      {m.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => markAsRevised(m.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark as Revised
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
