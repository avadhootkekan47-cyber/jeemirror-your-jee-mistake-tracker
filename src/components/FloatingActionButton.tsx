import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloatingActionButton() {
  return (
    <Link
      to="/log"
      aria-label="Log a new mistake"
      className="md:hidden fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-lg fab-pulse touch-target"
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
