import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaLink?: string;
  steps?: string[];
}

export default function EmptyState({ icon, title, description, ctaLabel, ctaLink, steps }: EmptyStateProps) {
  return (
    <div className="card-premium p-8 text-center space-y-4">
      <div className="text-4xl">{icon}</div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {steps && steps.length > 0 && (
        <ol className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      )}
      {ctaLabel && ctaLink && (
        <Link
          to={ctaLink}
          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground glow-primary transition-all hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
