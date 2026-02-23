import { Link } from 'react-router-dom';
import { Target, BarChart3, Flame, AlertTriangle, BookOpen, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const painPoints = [
  { icon: AlertTriangle, text: 'You keep seeing the same chapters in red on every mock report.' },
  { icon: BookOpen, text: "You tell yourself you'll fix it but there's no system." },
  { icon: Brain, text: 'Without tracking, the same mistakes cost you marks every single attempt.' },
];

const features = [
  { icon: Target, title: 'Mistake Logging', desc: 'Log any mistake in under 30 seconds.' },
  { icon: BarChart3, title: 'Pattern Analytics', desc: 'See exactly which subjects and mistake types are hurting your score.' },
  { icon: Flame, title: 'Streak Tracking', desc: 'Build a daily logging habit and never miss a session.' },
];

const pricingFeatures = [
  'Unlimited mistake logging',
  'Full analytics dashboard',
  'Streak and progress tracking',
  'Mobile friendly',
  'Cancel anytime',
];

const faqs = [
  { q: 'Is my data private?', a: 'Yes, only you can see your mistakes. We never share your data.' },
  { q: 'Can I cancel anytime?', a: 'Yes, no questions asked.' },
  { q: 'Does it work on mobile?', a: 'Yes, fully optimised for mobile.' },
  { q: 'Who built this?', a: 'A 17-year-old JEE student who was frustrated with the lack of good tools.' },
  { q: 'What subjects are covered?', a: 'Physics, Chemistry, and Mathematics.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold">
          <span className="text-primary">JEE</span>Mirror
        </h1>
        <Link
          to="/login"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Login
        </Link>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-20 md:py-32 text-center max-w-4xl mx-auto">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glow-purple w-96 h-96 rounded-full" />
        </div>
        <h2 className="relative text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
          Stop Repeating The Same Mistakes In Every JEE Mock Test.
        </h2>
        <p className="relative mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Log every mistake, find your patterns, eliminate your weak spots. Built by a JEE student, for JEE students.
        </p>
        <Link
          to="/signup"
          className="relative inline-block mt-8 rounded-lg bg-primary px-8 py-3.5 text-lg font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-105"
        >
          Get Started
        </Link>
      </section>

      {/* Problem */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">Sound familiar?</h3>
        <div className="grid md:grid-cols-3 gap-5">
          {painPoints.map((p, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 card-hover">
              <p.icon className="h-8 w-8 text-primary mb-4" />
              <p className="text-muted-foreground leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">How JEEMirror helps</h3>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 card-hover">
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h4 className="font-semibold text-lg mb-2">{f.title}</h4>
              <p className="text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">Simple pricing</h3>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { name: 'Monthly', price: '₹50', period: '/month', badge: null },
            { name: 'Yearly', price: '₹350', period: '/year', badge: 'Save 41%' },
          ].map((plan) => (
            <div key={plan.name} className="relative rounded-xl border border-border bg-card p-6 card-hover">
              {plan.badge && (
                <span className="absolute -top-3 right-4 rounded-full bg-success px-3 py-1 text-xs font-bold text-background">
                  {plan.badge}
                </span>
              )}
              <h4 className="text-lg font-semibold">{plan.name}</h4>
              <div className="mt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              
              <ul className="mt-5 space-y-2.5">
                {pricingFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="mt-6 block w-full rounded-lg bg-primary py-3 text-center font-semibold text-primary-foreground transition-all hover:opacity-90"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-10">FAQ</h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
              {openFaq === i && (
                <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-10 text-center">
        <h2 className="text-lg font-bold">
          <span className="text-primary">JEE</span>Mirror
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Built by a JEE student, for JEE students.</p>
        <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
