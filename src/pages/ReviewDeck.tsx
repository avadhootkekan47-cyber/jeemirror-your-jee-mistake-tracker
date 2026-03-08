import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjectClass } from '@/lib/constants';
import { ChevronLeft, ChevronRight, Flame, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewCard {
  id: string;
  subject: string;
  chapter: string;
  mistake_type: string;
  notes: string;
  created_at: string;
  is_reviewed: boolean;
}

export default function ReviewDeck() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ due: 0, mastered: 0, remaining: 0 });

  useEffect(() => {
    if (!user) return;
    fetchCards();
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;

    const { data: unreviewed } = await supabase
      .from('mistakes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_reviewed', false)
      .order('created_at', { ascending: true });

    const { count: mastered } = await supabase
      .from('mistakes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_reviewed', true);

    const { count: total } = await supabase
      .from('mistakes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setCards(unreviewed || []);
    setStats({
      due: unreviewed?.length || 0,
      mastered: mastered || 0,
      remaining: (total || 0) - (mastered || 0),
    });
  };

  const markAs = async (gotIt: boolean) => {
    if (cards.length === 0) return;
    const card = cards[currentIndex];

    if (gotIt) {
      await supabase
        .from('mistakes')
        .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
        .eq('id', card.id);

      const removedCard = card;
      setCards(prev => prev.filter((_, i) => i !== currentIndex));
      setStats(prev => ({ ...prev, due: prev.due - 1, mastered: prev.mastered + 1 }));
      if (currentIndex >= cards.length - 1) setCurrentIndex(Math.max(0, cards.length - 2));

      // Toast with undo
      toast({
        title: 'Marked as mastered 🔥',
        description: `${removedCard.chapter} — ${removedCard.mistake_type}`,
        action: (
          <button
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              await supabase.from('mistakes').update({ is_reviewed: false, reviewed_at: null }).eq('id', removedCard.id);
              fetchCards();
            }}
          >
            Undo
          </button>
        ),
      });
    } else {
      // Move to end of deck
      setCards(prev => {
        const newCards = [...prev];
        const [moved] = newCards.splice(currentIndex, 1);
        newCards.push(moved);
        return newCards;
      });
      toast({ title: 'Moved to end of deck', description: 'You\'ll see this one again later' });
    }
    setFlipped(false);
  };

  const card = cards[currentIndex];

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gradient">Review Deck</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center card-glow">
          <Clock className="h-4 w-4 text-accent mx-auto mb-1" aria-hidden="true" />
          <div className="text-lg font-bold text-foreground">{stats.due}</div>
          <div className="text-xs text-muted-foreground">Due Today</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center card-glow">
          <Flame className="h-4 w-4 text-success mx-auto mb-1" aria-hidden="true" />
          <div className="text-lg font-bold text-foreground">{stats.mastered}</div>
          <div className="text-xs text-muted-foreground">Mastered</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center card-glow">
          <CheckCircle2 className="h-4 w-4 text-primary mx-auto mb-1" aria-hidden="true" />
          <div className="text-lg font-bold text-foreground">{stats.remaining}</div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>

      {/* Card */}
      {card ? (
        <>
          <div
            onClick={() => setFlipped(!flipped)}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'Review card details — tap to flip back' : `${card.subject}: ${card.chapter} — tap to see details`}
            onKeyDown={(e) => e.key === 'Enter' && setFlipped(!flipped)}
            className="cursor-pointer rounded-2xl border border-border bg-card p-6 min-h-[250px] flex flex-col justify-center items-center card-glow transition-all hover:scale-[1.01]"
          >
            {!flipped ? (
              <div className="text-center space-y-3">
                <span className={`rounded-md px-3 py-1 text-xs font-semibold ${getSubjectClass(card.subject)}`}>
                  {card.subject}
                </span>
                <h2 className="text-xl font-bold text-foreground">{card.chapter}</h2>
                <p className="text-sm text-accent font-medium">{card.mistake_type}</p>
                <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Details</h3>
                <p className="text-base text-foreground">{card.notes || 'No notes recorded for this mistake.'}</p>
                <p className="text-xs text-muted-foreground">
                  Logged: {new Date(card.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Navigation + actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }}
              disabled={currentIndex === 0}
              aria-label="Previous card"
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition-colors touch-target"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => markAs(false)}
                className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-5 py-2.5 text-sm font-medium hover:bg-destructive/20 transition-colors touch-target"
              >
                Still Confused
              </button>
              <button
                onClick={() => markAs(true)}
                className="rounded-xl border border-success/30 bg-success/10 text-success px-5 py-2.5 text-sm font-medium hover:bg-success/20 transition-colors touch-target"
              >
                Got it 🔥
              </button>
            </div>

            <button
              onClick={() => { setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); setFlipped(false); }}
              disabled={currentIndex >= cards.length - 1}
              aria-label="Next card"
              className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition-colors touch-target"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {currentIndex + 1} of {cards.length}
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center card-glow">
          <Flame className="h-10 w-10 text-success mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-xl font-bold mb-1 text-foreground">All Mastered!</h2>
          <p className="text-sm text-muted-foreground">No pending reviews. Keep logging mistakes to build your deck.</p>
        </div>
      )}
    </div>
  );
}
