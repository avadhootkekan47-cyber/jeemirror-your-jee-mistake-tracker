import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: 'easeOut' as const, delay: i * 0.1 },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Custom Cursor ─── */
function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const circlePos = useRef({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dot.current) {
        dot.current.style.left = `${e.clientX}px`;
        dot.current.style.top = `${e.clientY}px`;
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"]')) setHovered(true);
    };
    const onOut = () => setHovered(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mouseout', onOut);

    let raf: number;
    const lerp = () => {
      circlePos.current.x += (mouse.current.x - circlePos.current.x) * 0.12;
      circlePos.current.y += (mouse.current.y - circlePos.current.y) * 0.12;
      if (circle.current) {
        circle.current.style.left = `${circlePos.current.x}px`;
        circle.current.style.top = `${circlePos.current.y}px`;
      }
      raf = requestAnimationFrame(lerp);
    };
    raf = requestAnimationFrame(lerp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <div
        ref={dot}
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height] duration-200"
        style={{
          width: hovered ? 24 : 12,
          height: hovered ? 24 : 12,
          backgroundColor: '#7c3aed',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={circle}
        className="fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border transition-[width,height] duration-300"
        style={{
          width: hovered ? 60 : 40,
          height: hovered ? 60 : 40,
          borderColor: '#7c3aed',
          mixBlendMode: 'difference',
        }}
      />
    </>
  );
}

/* ─── Loader ─── */
function Loader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const dur = 2000;
    const tick = () => {
      const p = Math.min(((Date.now() - start) / dur) * 100, 100);
      setProgress(Math.round(p));
      if (p < 100) requestAnimationFrame(tick);
      else setTimeout(onDone, 300);
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#050508' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-8 select-none">
        <span className="italic" style={{ color: '#7c3aed' }}>JEE</span>
        <span style={{ color: '#f0f0f8' }}>Mirror</span>
      </h1>
      <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: '#7c3aed', width: `${progress}%` }}
        />
      </div>
      <span className="font-mono text-xs mt-3 tabular-nums" style={{ color: '#6b6b8a' }}>
        {String(progress).padStart(3, '0')}
      </span>
    </motion.div>
  );
}

/* ─── Scroll-triggered section wrapper ─── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
    >
      {children}
    </motion.section>
  );
}

/* ─── Cycling Words ─── */
const cycleWords = ['Find patterns.', 'Eliminate weaknesses.', 'Score higher.', 'Crack JEE.'];
function CyclingWords() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx(p => (p + 1) % cycleWords.length), 2500);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="h-8 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="absolute font-dm-sans text-lg md:text-xl"
          style={{ color: '#6b6b8a' }}
        >
          {cycleWords[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ─── Marquee ─── */
const marqueeText = 'Mistake Tracking ✦ Analytics Dashboard ✦ Chapter Revision ✦ Mock Test Tracker ✦ Spaced Repetition ✦ AI Analysis ✦ Study Planner ✦ Leaderboard ✦ ';
function Marquee() {
  return (
    <div className="w-full overflow-hidden py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="landing-marquee whitespace-nowrap">
        {[0, 1, 2].map(i => (
          <span key={i} className="font-playfair italic text-lg md:text-xl mr-2" style={{ color: '#6b6b8a' }}>
            {marqueeText.split('✦').map((t, j) => (
              <span key={j}>{t}{j < marqueeText.split('✦').length - 1 && <span style={{ color: '#7c3aed' }}>✦</span>}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature Rows ─── */
const features = [
  { num: '01', name: 'Mistake Tracker', desc: 'Log every error in 3 taps', tag: 'Core' },
  { num: '02', name: 'Smart Analytics', desc: 'Pie charts, heatmaps, trend lines', tag: 'Insights' },
  { num: '03', name: 'Chapter Revision', desc: 'Track all 50+ JEE chapters', tag: 'Planning' },
  { num: '04', name: 'Mock Test Tracker', desc: 'Track scores and improvement', tag: 'Performance' },
  { num: '05', name: 'Today Screen', desc: 'Three priorities. No overwhelm.', tag: 'Focus' },
  { num: '06', name: 'Health Score', desc: 'Weekly score toward 99 percentile', tag: 'Progress' },
];

/* ─── Stats ─── */
const stats = [
  { value: '3+', label: 'Subjects' },
  { value: '8+', label: 'Features' },
  { value: '∞', label: 'Mistakes to Log' },
  { value: '₹0', label: 'To Start' },
];

/* ─── Pricing ─── */
const pricingFeatures = [
  'Unlimited mistake logging',
  'Full analytics dashboard',
  'Chapter revision tracking',
  'Streak & progress tracking',
  'Mobile optimised PWA',
];

/* ─── Nav Links ─── */
const navLinks = [
  { num: '01', label: 'About', href: '#about' },
  { num: '02', label: 'Features', href: '#features' },
  { num: '03', label: 'Pricing', href: '#pricing' },
  { num: '04', label: 'Start Now', href: '/signup' },
];

/* ─── Main Landing Component ─── */
export default function Landing() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => setLoaded(true), []);

  return (
    <div className="landing-page" style={{ backgroundColor: '#050508', color: '#f0f0f8', cursor: 'none' }}>
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-dm-sans { font-family: 'DM Sans', sans-serif; }
        .font-dm-mono { font-family: 'DM Mono', monospace; }
        .landing-page * { cursor: none; }
        @media (max-width: 767px) { .landing-page, .landing-page * { cursor: auto !important; } }
        .landing-marquee {
          display: flex;
          animation: marquee-scroll 30s linear infinite;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .stroke-text {
          -webkit-text-stroke: 1.5px #f0f0f8;
          color: transparent;
        }
        @media (min-width: 768px) {
          .stroke-text { -webkit-text-stroke: 2px #f0f0f8; }
        }
        .scroll-line {
          width: 1px;
          height: 60px;
          background: linear-gradient(to bottom, #7c3aed, transparent);
          animation: scroll-pulse 2s ease-in-out infinite;
        }
        @keyframes scroll-pulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        .noise-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .feature-row:hover .feature-bg {
          opacity: 1;
        }
      `}</style>

      <CustomCursor />

      <AnimatePresence>
        {!loaded && <Loader onDone={handleLoaded} />}
      </AnimatePresence>

      {loaded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* ─── Navigation ─── */}
          <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between" style={{ mixBlendMode: 'difference' }}>
            <Link to="/" className="font-playfair text-xl font-bold select-none">
              <span className="italic" style={{ color: '#7c3aed' }}>JEE</span>
              <span>Mirror</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(n => (
                n.href.startsWith('#') ? (
                  <a key={n.num} href={n.href} className="flex items-center gap-2 group">
                    <span className="font-dm-mono text-[10px]" style={{ color: '#7c3aed' }}>{n.num}</span>
                    <span className="font-dm-sans text-xs uppercase tracking-widest transition-colors group-hover:text-white" style={{ color: '#6b6b8a' }}>{n.label}</span>
                  </a>
                ) : (
                  <Link key={n.num} to={user ? '/dashboard' : n.href} className="flex items-center gap-2 group">
                    <span className="font-dm-mono text-[10px]" style={{ color: '#7c3aed' }}>{n.num}</span>
                    <span className="font-dm-sans text-xs uppercase tracking-widest transition-colors group-hover:text-white" style={{ color: '#6b6b8a' }}>{n.label}</span>
                  </Link>
                )
              ))}
            </div>
          </nav>

          {/* ─── Hero ─── */}
          <section className="relative min-h-screen flex flex-col justify-end px-6 md:px-12 pb-12 pt-24 overflow-hidden">
            <div className="noise-overlay" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

            <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10 max-w-7xl mx-auto w-full">
              <motion.p variants={fadeUp} custom={0} className="font-dm-mono text-xs uppercase tracking-[0.3em] mb-8 md:mb-12" style={{ color: '#6b6b8a' }}>
                Built by a JEE student · For JEE students
              </motion.p>

              <div className="mb-12 md:mb-16">
                <motion.h1 variants={fadeUp} custom={1} className="font-playfair font-bold leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}>
                  Stop
                </motion.h1>
                <motion.h1 variants={fadeUp} custom={2} className="font-playfair font-bold italic leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', color: '#7c3aed' }}>
                  Repeating
                </motion.h1>
                <motion.h1 variants={fadeUp} custom={3} className="font-playfair font-bold leading-[0.9] tracking-tight stroke-text" style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}>
                  Mistakes.
                </motion.h1>
              </div>

              <motion.div variants={fadeUp} custom={4} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <CyclingWords />
                <div className="flex flex-col items-start md:items-end gap-3">
                  <Link
                    to={user ? '/dashboard' : '/signup'}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-dm-sans font-semibold text-sm text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #1e40af)' }}
                  >
                    {user ? 'Go to Dashboard' : 'Start Free Trial'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="font-dm-mono text-[11px]" style={{ color: '#6b6b8a' }}>No credit card required</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp} custom={5}
              initial="hidden" animate="visible"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
            >
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: '#6b6b8a' }}>Scroll</span>
              <div className="scroll-line" />
            </motion.div>
          </section>

          {/* ─── Marquee ─── */}
          <Marquee />

          {/* ─── About ─── */}
          <Section id="about" className="px-6 md:px-12 py-24 md:py-36 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20">
              <div>
                <motion.p variants={fadeUp} custom={0} className="font-dm-mono text-xs uppercase tracking-[0.3em] mb-6" style={{ color: '#6b6b8a' }}>
                  01 — About
                </motion.p>
                <motion.h2 variants={fadeUp} custom={1} className="font-playfair text-3xl md:text-5xl font-bold leading-tight">
                  The <span className="italic" style={{ color: '#7c3aed' }}>mirror</span> your JEE prep was missing.
                </motion.h2>
              </div>

              <div>
                <motion.p variants={fadeUp} custom={2} className="font-dm-sans text-base leading-relaxed mb-6" style={{ color: '#6b6b8a' }}>
                  Every JEE aspirant makes mistakes. The difference between cracking it and missing it is whether you learn from them. JEEMirror gives you a systematic way to log, review, and eliminate every single error.
                </motion.p>
                <motion.p variants={fadeUp} custom={3} className="font-dm-sans text-base leading-relaxed mb-10" style={{ color: '#6b6b8a' }}>
                  Built by a 17-year-old JEE student who was tired of repeating the same mistakes in every mock test. No fancy AI gimmicks — just a focused tool that works.
                </motion.p>

                <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 gap-6">
                  {stats.map(s => (
                    <div key={s.label} className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <span className="font-playfair text-3xl md:text-4xl font-bold" style={{ color: '#f0f0f8' }}>{s.value}</span>
                      <p className="font-dm-mono text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: '#6b6b8a' }}>{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </Section>

          {/* ─── Features ─── */}
          <Section id="features" className="px-6 md:px-12 py-24 md:py-36 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <motion.p variants={fadeUp} custom={0} className="font-dm-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#6b6b8a' }}>
                  02 — Features
                </motion.p>
                <motion.h2 variants={fadeUp} custom={1} className="font-playfair text-3xl md:text-5xl font-bold leading-tight">
                  Everything you need.
                </motion.h2>
              </div>
              <motion.p variants={fadeUp} custom={2} className="font-dm-sans text-base max-w-md" style={{ color: '#6b6b8a' }}>
                Six focused tools designed to turn your mistakes into your biggest advantage.
              </motion.p>
            </div>

            <div>
              {features.map((f, i) => (
                <motion.div
                  key={f.num}
                  variants={fadeUp}
                  custom={i + 3}
                  className="feature-row relative group py-5 md:py-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="feature-bg absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.08), transparent 60%)' }} />
                  <span className="font-dm-mono text-xs w-12 shrink-0 relative z-10" style={{ color: '#6b6b8a' }}>{f.num}</span>
                  <span className="font-playfair text-lg md:text-xl font-semibold md:w-56 shrink-0 relative z-10">{f.name}</span>
                  <span className="font-dm-sans text-sm flex-1 relative z-10" style={{ color: '#6b6b8a' }}>{f.desc}</span>
                  <span
                    className="font-dm-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full self-start md:self-auto relative z-10"
                    style={{ border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa' }}
                  >
                    {f.tag}
                  </span>
                </motion.div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
          </Section>

          {/* ─── Pricing ─── */}
          <Section id="pricing" className="px-6 md:px-12 py-24 md:py-36 max-w-5xl mx-auto">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="font-dm-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: '#6b6b8a' }}>03 — Pricing</p>
              <h2 className="font-playfair text-3xl md:text-5xl font-bold">
                Simple, <span className="italic" style={{ color: '#7c3aed' }}>honest</span> pricing.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'Monthly', price: '₹50', period: '/month', featured: false },
                { name: 'Yearly', price: '₹350', period: '/year', featured: true, badge: 'Best Value' },
              ].map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  custom={plan.featured ? 2 : 1}
                  className="relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    border: plan.featured ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: '#0a0a12',
                    boxShadow: plan.featured ? '0 0 40px -10px rgba(124,58,237,0.25)' : 'none',
                  }}
                  whileHover={{
                    boxShadow: '0 8px 40px -10px rgba(124,58,237,0.3)',
                  }}
                >
                  {plan.badge && (
                    <span
                      className="absolute -top-3 right-6 font-dm-mono text-[10px] uppercase tracking-widest px-4 py-1 rounded-full"
                      style={{ backgroundColor: '#7c3aed', color: '#f0f0f8' }}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="font-dm-sans text-sm uppercase tracking-widest mb-1" style={{ color: '#6b6b8a' }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-playfair text-5xl font-bold">{plan.price}</span>
                    <span className="font-dm-sans text-sm" style={{ color: '#6b6b8a' }}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {pricingFeatures.map(f => (
                      <li key={f} className="flex items-center gap-3 font-dm-sans text-sm" style={{ color: '#6b6b8a' }}>
                        <span style={{ color: '#7c3aed' }}>✦</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={user ? '/dashboard' : '/signup'}
                    className="block w-full text-center py-3.5 rounded-full font-dm-sans font-semibold text-sm transition-all hover:scale-[1.02]"
                    style={plan.featured
                      ? { background: 'linear-gradient(135deg, #7c3aed, #1e40af)', color: '#f0f0f8' }
                      : { border: '1px solid rgba(255,255,255,0.15)', color: '#f0f0f8' }
                    }
                  >
                    Get Started
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* ─── CTA ─── */}
          <section className="relative px-6 md:px-12 py-24 md:py-36 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-playfair font-bold leading-tight mb-10"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
              >
                Ready to <span className="italic" style={{ color: '#7c3aed' }}>fix your</span> mistakes?
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  to={user ? '/dashboard' : '/signup'}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-dm-sans font-semibold text-sm text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #1e40af)' }}
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:contact@jeemirror.com"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-dm-sans font-semibold text-sm transition-all hover:scale-105"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#f0f0f8' }}
                >
                  Contact Us
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </motion.div>
            </div>
          </section>

          {/* ─── Footer ─── */}
          <footer className="px-6 md:px-12 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <Link to="/" className="font-playfair text-lg font-bold select-none">
                <span className="italic" style={{ color: '#7c3aed' }}>JEE</span>
                <span>Mirror</span>
              </Link>
              <p className="font-dm-mono text-[11px] uppercase tracking-widest" style={{ color: '#6b6b8a' }}>
                © {new Date().getFullYear()} JEEMirror. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                {[
                  { label: 'Privacy', to: '/privacy' },
                  { label: 'Terms', to: '/terms' },
                ].map(l => (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="font-dm-mono text-[11px] uppercase tracking-widest transition-colors hover:text-white"
                    style={{ color: '#6b6b8a' }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  );
}
