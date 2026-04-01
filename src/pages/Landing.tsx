import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "@/lib/supabase";

gsap.registerPlugin(ScrollTrigger);

const APP_URL = "https://jeemirror-your-jee-mistake-tracker.vercel.app";

/* ─── Activity Ticker Messages ─── */
const TICKER_MSGS = [
  "🔴 Avadhoot just logged a mistake in Rotational Motion",
  "🔴 A student fixed their Electrochemistry weak spot",
  "🔴 27 mistakes logged by JEEMirror users this week",
  "🔴 New user joined from Nashik",
  "🔴 Chapter Revision streak: 3 days",
];

/* ─── Spiral Card Data ─── */
const SPIRAL_CARDS = [
  { title: "Concept vs. Silly Mistakes", desc: "Differentiate between genuine knowledge gaps and careless errors.", icon: "ph-brain" },
  { title: "Mock Test Analytics", desc: "Watch your error rate drop over time with detailed visual charts.", icon: "ph-trend-up" },
  { title: "Active Revision Mode", desc: "The app feeds you past mistakes to solve again before your next test.", icon: "ph-warning-circle" },
  { title: "Daily Study Planner", desc: "Set daily goals and check off topics synced with weak chapters.", icon: "ph-check-square" },
  { title: "Goal Tracking", desc: "Set specific target scores and monitor your proximity to reaching them.", icon: "ph-target" },
  { title: "Smart Alerts", desc: "Get notified when you repeat the exact same mistake type thrice.", icon: "ph-bell-ringing" },
  { title: "Organized Archives", desc: "Never lose a noted mistake again with our robust tagging & search.", icon: "ph-folder-open" },
  { title: "Rank Boost", desc: "Watch your percentiles skyrocket as you plug your knowledge leaks.", icon: "ph-rocket-launch" },
];

/* ─── FAQ Data ─── */
const FAQS = [
  { q: "Is JEEMirror free?", a: "JEEMirror has a free trial with basic logging. Full analytics, spaced repetition, and all premium features require a subscription at ₹50/month." },
  { q: "How do I pay?", a: "Pay via UPI to our number. Then submit your UTR (transaction ID) inside the app. We activate your account within minutes — usually faster." },
  { q: "Which subjects does it cover?", a: "All three JEE subjects: Physics, Chemistry, and Mathematics — with all 54 standard JEE chapters organized for easy selection." },
  { q: "Will it work on my phone?", a: "Yes! JEEMirror is a Progressive Web App (PWA). Open it in Chrome on Android, tap 'Add to Home Screen', and it works exactly like a native app." },
  { q: "Is my data safe?", a: "Absolutely. Your data is stored securely on Supabase (built on PostgreSQL) with Row Level Security — only you can see your mistakes." },
  { q: "Can I cancel anytime?", a: "Yes. Plans are month-to-month. No auto-renewals, no hidden charges. Just UPI — as simple as it gets." },
];

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  { text: "This is exactly what I needed. I could finally see WHY I kept failing Thermodynamics.", name: "Saiprasad G.", title: "JEE 2026 Aspirant" },
  { text: "Logged 15 mistakes in my first mock. The analytics showed I have a huge problem with silly calculation errors.", name: "Harshit K.", title: "JEE 2026" },
  { text: "₹50 a month is literally nothing. My coaching costs ₹1.2 lakh and doesn't give me this data.", name: "JEE Aspirant", title: "Maharashtra" },
];

/* ═══════════════════════════════════════════
   LEADERBOARD COMPONENT
   ═══════════════════════════════════════════ */
function LeaderboardSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, plan")
          .order("created_at", { ascending: true })
          .limit(20);
        if (!profiles) { setLoading(false); return; }

        const filtered = profiles.filter(p => {
          if (!p.name || p.name.trim() === "") return false;
          const n = p.name.toLowerCase();
          if (n.includes("haha") || n.includes("azevcz") || n.includes("test")) return false;
          return true;
        });

        const withCounts = await Promise.all(
          filtered.map(async (p) => {
            const { count } = await supabase.from("mistakes").select("id", { count: "exact", head: true }).eq("user_id", p.id);
            return { ...p, mistake_count: count || 0 };
          })
        );
        withCounts.sort((a, b) => b.mistake_count - a.mistake_count);
        setUsers(withCounts.slice(0, 10));
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const formatName = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    return parts[0];
  };

  const getMedal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
  const getBorder = (i: number) => i === 0 ? "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]" : i === 1 ? "border-gray-300" : i === 2 ? "border-amber-600" : "border-white/10";

  return (
    <section className="py-32 relative overflow-hidden border-t border-white/5" style={{ background: "#0B0914" }}>
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>🏆 JEEMirror Leaderboard</h2>
          <p className="text-xl text-gray-400">Top aspirants ranked by activity this week</p>
        </div>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-xl p-4 border border-white/5 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-white/10 rounded w-1/3" /><div className="h-3 bg-white/5 rounded w-1/4" /></div>
              </div>
            ))
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500">Leaderboard loading...</p>
          ) : (
            users.map((u, i) => (
              <div key={u.id} className={`leaderboard-row glass-panel rounded-xl p-4 border ${getBorder(i)} flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 ${i === 0 ? "border-l-4 border-l-[#00F0FF]" : i === 1 ? "border-l-4 border-l-[#8B5CF6]" : ""}`}>
                <span className="text-2xl w-10 text-center">{getMedal(i)}</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#8B5CF6] flex items-center justify-center text-[#0B0914] font-bold text-sm">
                  {u.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{formatName(u.name)}</div>
                  <div className="text-xs">
                    {u.plan === "premium" ? <span className="text-[#00F0FF] font-bold">⭐ Premium</span> : <span className="text-gray-500">Trial</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{u.mistake_count || "—"}</div>
                  <div className="text-xs text-gray-500">mistakes</div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-12">
          <Link to="/signup" className="inline-block px-8 py-4 rounded-xl bg-[#00F0FF] text-[#0B0914] font-bold text-lg hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] transition-all">
            Want to top the leaderboard? Start logging →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SHARE WIDGET
   ═══════════════════════════════════════════ */
function ShareWidget() {
  const [open, setOpen] = useState(false);
  const shareText = "Hey! I'm using JEEMirror to track my JEE mistakes. Try it free → jeemirror-your-jee-mistake-tracker.vercel.app";

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "JEEMirror", text: shareText, url: APP_URL }); return; } catch { /* fallback */ }
    }
    setOpen(true);
  };

  return (
    <>
      <button onClick={handleShare} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-2xl hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all hover:scale-110" aria-label="Share">
        <i className="ph ph-share-network" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div className="glass-panel rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Share JEEMirror with your JEE batch!</h3>
            <div className="flex gap-3 mb-4">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 rounded-xl bg-green-600 text-white text-center font-bold hover:bg-green-500 transition-colors">WhatsApp</a>
              <button onClick={() => navigator.clipboard.writeText(APP_URL)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">Copy Link</button>
            </div>
            <button onClick={() => setOpen(false)} className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors">Close</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════ */
export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricingPlan, setPricingPlan] = useState<"yearly" | "monthly">("yearly");

  // Activity ticker
  useEffect(() => {
    const iv = setInterval(() => setTickerIdx(p => (p + 1) % TICKER_MSGS.length), 3000);
    return () => clearInterval(iv);
  }, []);

  // Body class for landing
  useEffect(() => {
    document.body.classList.add("landing-page");
    document.body.style.backgroundColor = "#0B0914";
    document.body.style.color = "white";
    return () => {
      document.body.classList.remove("landing-page");
      document.body.style.backgroundColor = "";
      document.body.style.color = "";
    };
  }, []);

  // ═══ ALL GSAP ANIMATIONS ═══
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── Custom Cursor ── */
      const cursorDot = document.getElementById("cursor-dot");
      const cursorRing = document.getElementById("cursor-ring");
      if (cursorDot && cursorRing && !window.matchMedia("(pointer: coarse)").matches) {
        let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
        let ringX = mouseX, ringY = mouseY;

        const onMove = (e: MouseEvent) => {
          mouseX = e.clientX; mouseY = e.clientY;
          cursorDot.style.left = `${mouseX}px`;
          cursorDot.style.top = `${mouseY}px`;
        };
        document.addEventListener("mousemove", onMove);

        gsap.ticker.add(() => {
          ringX += (mouseX - ringX) * 0.15;
          ringY += (mouseY - ringY) * 0.15;
          cursorRing.style.left = `${ringX}px`;
          cursorRing.style.top = `${ringY}px`;
        });

        document.querySelectorAll(".hover-trigger, button, a").forEach(el => {
          el.addEventListener("mouseenter", () => {
            cursorRing!.style.width = "60px"; cursorRing!.style.height = "60px";
            cursorRing!.style.borderColor = "#00F0FF"; cursorRing!.style.backgroundColor = "rgba(0,240,255,0.1)";
          });
          el.addEventListener("mouseleave", () => {
            cursorRing!.style.width = "40px"; cursorRing!.style.height = "40px";
            cursorRing!.style.borderColor = "rgba(139,92,246,0.5)"; cursorRing!.style.backgroundColor = "transparent";
          });
        });

        document.querySelectorAll(".magnetic").forEach(elem => {
          elem.addEventListener("mousemove", function (this: HTMLElement, e: Event) {
            const me = e as MouseEvent;
            const rect = this.getBoundingClientRect();
            const x = me.clientX - rect.left - rect.width / 2;
            const y = me.clientY - rect.top - rect.height / 2;
            gsap.to(this, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: "power2.out" });
          });
          elem.addEventListener("mouseleave", function (this: HTMLElement) {
            gsap.to(this, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
          });
        });
      }

      /* ── Hero 3D Tilt ── */
      if (!window.matchMedia("(pointer: coarse)").matches) {
        document.addEventListener("mousemove", (e) => {
          const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
          const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
          gsap.to("#hero-mockup-wrapper", { rotationY: xAxis, rotationX: yAxis, duration: 1, ease: "power2.out" });
        });
      }

      /* ── Hero Zoom ── */
      gsap.to("#hero-mockup", {
        scale: 1, filter: "blur(0px)", opacity: 1, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 }
      });
      gsap.to("#hero-content", {
        y: -100, opacity: 0, scale: 0.9, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "+=50%", scrub: 1 }
      });

      /* ── Parallax ── */
      gsap.utils.toArray<HTMLElement>(".parallax-element").forEach(layer => {
        gsap.to(layer, {
          y: -200, rotation: 15, ease: "none",
          scrollTrigger: { trigger: "#problem-section", start: "top bottom", end: "bottom top", scrub: 0.5 }
        });
      });

      /* ── Features Sticky ── */
      const featureTexts = gsap.utils.toArray<HTMLElement>(".feature-text");
      const featureMedias = gsap.utils.toArray<HTMLElement>(".feature-media");
      ScrollTrigger.create({
        trigger: "#features-wrapper", start: "top top", end: "bottom bottom",
        onUpdate: (self) => {
          const progress = self.progress;
          const activeIndex = progress > 0.33 && progress < 0.66 ? 1 : progress >= 0.66 ? 2 : 0;
          featureTexts.forEach((text, i) => {
            text.style.opacity = i === activeIndex ? "1" : "0.2";
            text.style.transform = i === activeIndex ? "scale(1.05)" : "scale(1)";
          });
          featureMedias.forEach((media, i) => {
            if (i === activeIndex) {
              media.style.opacity = "1"; media.style.transform = "translateY(0) scale(1)";
            } else {
              media.style.opacity = "0"; media.style.transform = i < activeIndex ? "translateY(-40px) scale(0.95)" : "translateY(40px) scale(0.95)";
            }
          });
        }
      });

      /* ── Mascot Journey ── */
      gsap.to("#journey-track", {
        xPercent: -75, ease: "none",
        scrollTrigger: {
          trigger: "#journey-section", start: "top top", end: "+=300%", pin: true, scrub: 1,
          onUpdate: (self) => {
            const tooltip = document.getElementById("mascot-tooltip");
            if (!tooltip) return;
            const p = self.progress;
            tooltip.style.opacity = p > 0.05 && p < 0.95 ? "1" : "0";
            const arrow = '<div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#8B5CF6]"></div>';
            if (p < 0.25) tooltip.innerHTML = `Taking mock test...${arrow}`;
            else if (p < 0.55) tooltip.innerHTML = `Logging silly mistakes!${arrow}`;
            else if (p < 0.85) tooltip.innerHTML = `Finding patterns...${arrow}`;
            else tooltip.innerHTML = `Ready for JEE!${arrow}`;
          }
        }
      });
      gsap.to("#mascot", { y: 15, repeat: -1, yoyo: true, duration: 1.5, ease: "sine.inOut" });

      /* ── Spiral Tunnel ── */
      const spiralCards = gsap.utils.toArray<HTMLElement>(".spiral-card");
      const spiralWorld = document.getElementById("spiral-world");
      if (spiralWorld && spiralCards.length) {
        const tlSpiral = gsap.timeline({
          scrollTrigger: { trigger: "#spiral-section", start: "top top", end: "+=400%", pin: true, scrub: 1 }
        });
        tlSpiral.to(spiralWorld, { rotation: 180, ease: "none", duration: 3 }, 0);
        spiralCards.forEach((card, i) => {
          const angle = (i / spiralCards.length) * Math.PI * 4;
          const radius = window.innerWidth < 768 ? 160 : 380;
          const targetX = Math.cos(angle) * radius, targetY = Math.sin(angle) * radius;
          gsap.set(card, { xPercent: -50, yPercent: -50, x: targetX * 0.05, y: targetY * 0.05, scale: 0.05, opacity: 0, filter: "blur(20px)", rotation: angle * (180 / Math.PI) * 0.5 });
          const staggerStart = (i / spiralCards.length) * 1.8;
          tlSpiral.to(card, { x: targetX, y: targetY, scale: 1, opacity: 1, filter: "blur(0px)", ease: "power2.out", duration: 0.5 }, staggerStart);
          tlSpiral.to(card, { x: targetX * 1.5, y: targetY * 1.5, scale: 1.5, opacity: 0, filter: "blur(20px)", ease: "power2.in", duration: 0.3 }, staggerStart + 0.8);
        });
        tlSpiral.set({}, {}, 3.2);
      }

      /* ── Text Reveal ── */
      gsap.to(".reveal-word", {
        color: "#ffffff", textShadow: "0 0 25px rgba(0,240,255,0.6)", scale: 1.05, stagger: 0.05,
        scrollTrigger: { trigger: "#text-reveal-section", start: "top 75%", end: "center center", scrub: 1 }
      });

      /* ── Bento Grid ── */
      gsap.from(".bento-item", {
        y: 100, opacity: 0, rotationX: -15, scale: 0.9, stagger: 0.15, duration: 1, ease: "back.out(1.2)",
        scrollTrigger: { trigger: "#dashboard", start: "top 70%" }
      });

      /* ── Roadmap ── */
      gsap.utils.toArray<HTMLElement>(".roadmap-anim").forEach((card, i) => {
        gsap.from(card, { y: 100, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" } });
        if (i !== 2) {
          gsap.to(card, { scale: 0.92, opacity: 0.3, filter: "blur(5px)", scrollTrigger: { trigger: card, start: "top 120px", end: "bottom top", scrub: true } });
        }
      });

      /* ── Social Proof ── */
      gsap.from(".social-anim", { x: -50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".social-header", start: "top 80%" } });

      /* ── Leaderboard rows ── */
      gsap.from(".leaderboard-row", { x: -50, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: ".leaderboard-row", start: "top 85%" } });

      /* ── Testimonials ── */
      gsap.from(".testimonial-card", { y: 50, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: ".testimonial-header", start: "top 80%" } });

      /* ── Pricing ── */
      gsap.fromTo(".pricing-card",
        { y: 50, scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, stagger: 0.2, duration: 1, ease: "elastic.out(1, 0.7)", scrollTrigger: { trigger: ".pricing-header", start: "top 80%" } }
      );

      /* ── FAQ ── */
      gsap.from(".faq-item", { y: 30, opacity: 0, stagger: 0.1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: ".faq-header", start: "top 75%" } });

      /* ── CTA ── */
      gsap.from(".cta-anim", { scale: 0.9, opacity: 0, y: 50, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: ".cta-anim", start: "top 85%" } });

      /* ── Scroll Progress ── */
      gsap.to("#scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.1 } });

    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="antialiased selection:bg-[#00F0FF] selection:text-[#0B0914] relative" style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#0B0914", color: "white", overflowX: "hidden" }}>
      {/* Global Elements */}
      <div className="film-grain" />
      <div id="cursor-dot" />
      <div id="cursor-ring" />
      <div id="scroll-progress" className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6] z-[100] origin-left scale-x-0 w-full" style={{ boxShadow: "0 0 15px rgba(0,240,255,0.8)" }} />

      {/* ══ NAVIGATION ══ */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 glass-panel border-b-0 py-4" id="main-nav">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 magnetic hover-trigger">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00F0FF] to-[#8B5CF6] flex items-center justify-center font-bold text-[#0B0914] text-lg" style={{ fontFamily: "Outfit, sans-serif", boxShadow: "0 0 15px rgba(139,92,246,0.5)" }}>M</div>
            <span className="font-bold text-xl tracking-tight hidden sm:block" style={{ fontFamily: "Outfit, sans-serif" }}>JEE Mirror</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover-trigger hover:text-white transition-colors relative group">Features<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#00F0FF] transition-all group-hover:w-full" /></a>
            <a href="#dashboard" className="hover-trigger hover:text-white transition-colors relative group">Dashboard<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#00F0FF] transition-all group-hover:w-full" /></a>
            <a href="#pricing" className="hover-trigger text-white transition-colors relative group">Pricing<span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#00F0FF] transition-all" /></a>
          </div>
          <a href="#pricing" className="magnetic hover-trigger px-5 py-2 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 hover:bg-[#00F0FF] hover:text-[#0B0914] transition-all font-bold text-sm" style={{ boxShadow: "0 0 10px rgba(0,240,255,0.2)" }}>
            View Pricing
          </a>
        </div>
      </nav>

      {/* ══ SECTION 1: HERO ══ */}
      <section id="hero" className="relative h-[200vh] perspective-1000">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.15)_0%,transparent_50%)] z-0 pointer-events-none" />
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center pt-20">
          {/* Background Mockup */}
          <div id="hero-mockup-wrapper" className="absolute w-[80vw] max-w-5xl aspect-video z-0 preserve-3d">
            <div id="hero-mockup" className="w-full h-full glass-panel rounded-2xl ui-mockup flex flex-col overflow-hidden opacity-30 blur-xl scale-75">
              <div className="h-12 border-b border-white/10 flex items-center px-6 gap-4 bg-white/5">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-[#EF4444]/50" /><div className="w-3 h-3 rounded-full bg-yellow-500/50" /><div className="w-3 h-3 rounded-full bg-green-500/50" /></div>
                <div className="w-48 h-4 rounded bg-white/10 mx-auto" />
              </div>
              <div className="flex-1 flex p-6 gap-6" style={{ background: "rgba(11,9,20,0.8)" }}>
                <div className="w-1/4 flex flex-col gap-4">
                  <div className="h-8 rounded bg-white/10 w-full" /><div className="h-8 rounded bg-white/5 w-3/4" /><div className="h-8 rounded bg-white/5 w-5/6" />
                </div>
                <div className="w-3/4 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="h-32 rounded bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex-1" />
                    <div className="h-32 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/30 flex-1" />
                  </div>
                  <div className="h-64 rounded bg-[#121021] border border-white/5 w-full flex items-end p-4 gap-2">
                    <div className="w-1/6 bg-[#00F0FF]/50 h-[30%] rounded-t" /><div className="w-1/6 bg-[#00F0FF]/60 h-[50%] rounded-t" /><div className="w-1/6 bg-[#00F0FF]/80 h-[40%] rounded-t" />
                    <div className="w-1/6 bg-[#8B5CF6]/60 h-[80%] rounded-t" /><div className="w-1/6 bg-[#8B5CF6]/80 h-[60%] rounded-t" /><div className="w-1/6 bg-[#EF4444]/60 h-[90%] rounded-t" style={{ boxShadow: "0 0 15px rgba(239,68,68,0.5)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Foreground Text */}
          <div id="hero-content" className="relative z-10 text-center max-w-4xl px-6 flex flex-col items-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1936] border border-white/10 text-xs font-medium text-[#00F0FF] mb-4" style={{ boxShadow: "0 0 15px rgba(0,240,255,0.2)" }}>
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]" /></span>
              Now Tracking JEE 2025 &amp; 2026 | 27 mistakes logged
            </div>

            {/* Activity Ticker */}
            <div className="h-6 mb-6 overflow-hidden">
              <p key={tickerIdx} className="text-xs text-gray-500 animate-fade-in">{TICKER_MSGS[tickerIdx]}</p>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold leading-tight tracking-tight mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
              Turn Every <span className="text-gradient-cyan">Mistake</span> Into Your Secret Weapon.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl">
              JEE Mirror helps you track, tag, and analyze your errors so you never repeat them on exam day.
            </p>
            <div className="flex gap-4 pointer-events-auto flex-wrap justify-center">
              <a href="#pricing" className="magnetic hover-trigger px-8 py-4 rounded-xl bg-[#00F0FF] text-[#0B0914] font-bold text-lg hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] transition-all">View Pricing</a>
              <a href="#features" className="magnetic hover-trigger px-8 py-4 rounded-xl glass-panel text-white font-medium text-lg hover:bg-white/10 transition-all border border-white/10 relative overflow-hidden group">
                <span className="relative z-10">See Features</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </a>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Scroll to Explore</span>
            <div className="w-[2px] h-12 bg-gradient-to-b from-[#00F0FF] to-transparent" />
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: PROBLEM → SOLUTION ══ */}
      <section className="relative min-h-screen flex items-center py-32 overflow-hidden border-t border-white/5" id="problem-section" style={{ background: "#0B0914" }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#EF4444]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none text-white/5 text-4xl md:text-6xl font-bold select-none" style={{ fontFamily: "Outfit, sans-serif" }}>
          <div className="parallax-element absolute top-[10%] left-[10%]">∫ e^x dx = e^x + C</div>
          <div className="parallax-element absolute top-[40%] right-[15%]">F = G(m1m2)/r²</div>
          <div className="parallax-element absolute bottom-[20%] left-[20%]">Δx · Δp ≥ ℏ/2</div>
          <div className="parallax-element absolute top-[70%] right-[30%]">PV = nRT</div>
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center perspective-1000">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>
            You aren't losing marks because you don't know the concepts.
          </h2>
          <p className="text-lg sm:text-xl md:text-3xl text-gray-400 leading-relaxed max-w-4xl mx-auto">
            You are losing them because you are stuck in a loop. You take a mock test, check the score, and move on—only to repeat the <span className="text-[#EF4444] font-bold animate-pulse">exact same silly errors.</span> It is time to break the cycle.
          </p>
        </div>
      </section>

      {/* ══ SECTION 3: FEATURES ══ */}
      <section id="features" className="relative" style={{ background: "#121021" }}>
        <div className="h-[300vh] relative" id="features-wrapper">
          <div className="sticky top-0 h-screen w-full flex flex-col md:flex-row items-center max-w-7xl mx-auto px-6 gap-12 overflow-hidden">
            <div className="w-full md:w-1/2 hidden md:flex flex-col gap-24 py-32 relative">
              <div className="feature-text opacity-100 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] mb-6" style={{ boxShadow: "0 0 20px rgba(139,92,246,0.3)" }}><i className="ph ph-note-pencil text-2xl" /></div>
                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Zero-friction mistake logging.</h3>
                <p className="text-lg text-gray-400">Tag every mistake by subject, chapter, and difficulty in seconds right after your mock test.</p>
              </div>
              <div className="feature-text opacity-20 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-6" style={{ boxShadow: "0 0 20px rgba(239,68,68,0.3)" }}><i className="ph ph-chart-polar text-2xl" /></div>
                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Pattern detection &amp; Heatmaps.</h3>
                <p className="text-lg text-gray-400">Spot your weakest links instantly. Our Chapter Heatmap turns darker red the more mistakes you make.</p>
              </div>
              <div className="feature-text opacity-20 transition-all duration-500">
                <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF] mb-6" style={{ boxShadow: "0 0 20px rgba(0,240,255,0.3)" }}><i className="ph ph-calendar-check text-2xl" /></div>
                <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Targeted Active Revision.</h3>
                <p className="text-lg text-gray-400">Stop guessing what to study. The Study Planner serves you un-reviewed mistakes and prioritizes weakest chapters.</p>
              </div>
            </div>
            <div className="w-full md:w-1/2 h-[50vh] md:h-[70vh] glass-panel rounded-2xl border border-white/10 overflow-hidden relative" style={{ boxShadow: "0 0 50px rgba(0,0,0,0.5)" }}>
              <div className="h-10 border-b border-white/5 bg-[#0B0914] flex items-center px-4 gap-2 z-20 relative">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <div className="mx-auto text-xs text-gray-500 font-mono flex items-center gap-2"><i className="ph ph-lock text-[#00F0FF]" /> app.jeemirror.in</div>
              </div>
              {/* Slide 1 */}
              <div className="feature-media absolute top-10 left-0 w-full h-[calc(100%-2.5rem)] p-6 md:p-8 transition-all duration-700 opacity-100 translate-y-0" style={{ background: "#1C1936" }}>
                <h4 className="text-lg md:text-xl mb-6 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}><i className="ph ph-plus-circle text-[#8B5CF6]" /> Log New Mistake</h4>
                <div className="space-y-4">
                  <div className="h-12 w-full bg-[#0B0914] rounded-lg border border-white/5 flex items-center px-4 text-gray-400 text-sm">Subject: Physics</div>
                  <div className="h-12 w-full bg-[#0B0914] rounded-lg border border-white/5 flex items-center px-4 text-gray-400 text-sm">Chapter: Rotational Motion</div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="px-3 py-1 rounded bg-[#EF4444]/20 text-[#EF4444] text-xs border border-[#EF4444]/30 animate-pulse">Calculation Error</div>
                    <div className="px-3 py-1 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs border border-[#8B5CF6]/30">Formula forgot</div>
                  </div>
                  <div className="h-20 w-full bg-[#0B0914] rounded-lg border border-white/5 mt-4 p-4 text-gray-500 text-xs font-mono">Moment of inertia of solid sphere is 2/5 MR², I used 2/3 MR²...<span className="animate-ping">|</span></div>
                  <div className="h-10 w-32 bg-[#00F0FF] rounded-lg ml-auto mt-4 flex items-center justify-center text-[#0B0914] font-bold text-sm">Save</div>
                </div>
              </div>
              {/* Slide 2 */}
              <div className="feature-media absolute top-10 left-0 w-full h-[calc(100%-2.5rem)] p-6 md:p-8 transition-all duration-700 opacity-0 translate-y-10" style={{ background: "#1C1936" }}>
                <h4 className="text-lg md:text-xl mb-6 flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}><i className="ph ph-fire text-[#EF4444]" /> Chapter Heatmap</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[10,60,20,0,0,40,80,10,30,0,0,50].map((v, i) => (
                    <div key={i} className="aspect-square rounded border border-white/5 flex items-center justify-center text-xs font-bold" style={{ background: v ? `rgba(239,68,68,${v/100})` : "#0B0914", color: v >= 60 ? "white" : undefined }}>
                      {v >= 40 ? Math.round(v * 0.2) : ""}
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="text-gray-400">Weakest: Electromagnetism</span>
                  <span className="text-[#EF4444] font-bold"><i className="ph ph-warning" /> Priority High</span>
                </div>
              </div>
              {/* Slide 3 */}
              <div className="feature-media absolute top-10 left-0 w-full h-[calc(100%-2.5rem)] p-6 md:p-8 transition-all duration-700 opacity-0 translate-y-10" style={{ background: "#1C1936" }}>
                <h4 className="text-lg md:text-xl mb-6 flex justify-between items-center" style={{ fontFamily: "Outfit, sans-serif" }}>
                  <span className="flex items-center gap-2"><i className="ph ph-calendar-check text-[#00F0FF]" /> Today's Plan</span>
                  <span className="text-xs px-2 py-1 bg-[#00F0FF]/20 text-[#00F0FF] rounded border border-[#00F0FF]/30 animate-pulse">3 Tasks</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-[#0B0914] border border-[#00F0FF]/50 rounded-lg flex items-center gap-3" style={{ boxShadow: "0 0 10px rgba(0,240,255,0.2)" }}>
                    <div className="w-5 h-5 rounded border border-[#00F0FF]/50 shrink-0" />
                    <div><div className="text-sm font-medium text-[#00F0FF]">Revise Math: Definite Integrals</div><div className="text-xs text-[#00F0FF]/70">14 pending mistakes</div></div>
                  </div>
                  <div className="p-3 bg-[#0B0914] border border-white/10 rounded-lg flex items-center gap-3 opacity-50">
                    <div className="w-5 h-5 rounded border border-[#00F0FF] bg-[#00F0FF]/20 flex items-center justify-center shrink-0"><i className="ph ph-check text-[#00F0FF] text-xs" /></div>
                    <div className="line-through"><div className="text-sm font-medium">Mock Test 4 Analysis</div></div>
                  </div>
                  <div className="p-3 bg-[#0B0914] border border-white/10 rounded-lg flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-gray-600 shrink-0" />
                    <div><div className="text-sm font-medium">Physics: Modern Physics</div><div className="text-xs text-gray-500">Suggested based on trends</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: MASCOT JOURNEY ══ */}
      <section className="relative overflow-hidden h-screen" id="journey-section" style={{ background: "#0F0D1C" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.05)_0%,transparent_100%)]" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#8B5CF6]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="w-full h-full flex items-center overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div id="mascot" className="w-24 h-24 mascot-glow relative">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" style={{ filter: "drop-shadow(0 0 20px rgba(0,240,255,0.8))" }}>
                <rect x="20" y="20" width="60" height="60" rx="16" fill="#1C1936" stroke="#00F0FF" strokeWidth="4" />
                <circle cx="35" cy="45" r="5" fill="#00F0FF" className="animate-pulse" />
                <circle cx="65" cy="45" r="5" fill="#00F0FF" className="animate-pulse" />
                <path d="M40 65 Q50 75 60 65" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M50 10 L50 20 M40 10 L60 10" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div id="mascot-tooltip" className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6] text-[#0B0914] font-bold text-sm rounded-lg opacity-0 transition-opacity duration-300" style={{ boxShadow: "0 0 20px rgba(139,92,246,0.6)" }}>
                Ready to analyze!
              </div>
            </div>
          </div>
          <div id="journey-track" className="absolute top-0 left-0 h-full w-[400vw] flex items-center z-10 pointer-events-none">
            <div className="w-[100vw] h-full relative flex items-center justify-center">
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="absolute right-[20%] top-[30%] text-6xl opacity-20"><i className="ph ph-exam" /></div>
              <div className="absolute right-[10%] bottom-[40%] px-6 py-4 glass-panel rounded-xl text-[#EF4444] font-bold -rotate-[5deg]" style={{ boxShadow: "0 0 30px rgba(239,68,68,0.2)" }}>Result: 112/300</div>
            </div>
            <div className="w-[100vw] h-full relative flex items-center justify-center">
              <div className="absolute left-[20%] top-[40%] px-4 py-2 bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50 rounded-lg rotate-12 animate-bounce">Silly Math Error!</div>
              <div className="absolute left-[30%] bottom-[30%] px-4 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded-lg -rotate-[10deg]">Formula Forgot</div>
              <div className="absolute right-[20%] top-[40%] text-center">
                <i className="ph ph-funnel text-5xl text-[#8B5CF6] mb-2" style={{ filter: "drop-shadow(0 0 15px rgba(139,92,246,0.6))" }} />
                <p className="text-sm text-gray-400 font-mono tracking-widest uppercase">Filtering mistakes...</p>
              </div>
            </div>
            <div className="w-[100vw] h-full relative flex items-center justify-center">
              <div className="absolute left-[10%] bottom-[20%] w-64 h-48 glass-panel border border-[#00F0FF]/30 rounded-xl flex items-end justify-around p-4">
                <div className="w-8 bg-[#00F0FF]/20 h-[30%] rounded-t" /><div className="w-8 bg-[#00F0FF]/40 h-[60%] rounded-t" /><div className="w-8 bg-[#00F0FF]/60 h-[40%] rounded-t" />
                <div className="w-8 bg-[#00F0FF] h-[90%] rounded-t" style={{ boxShadow: "0 0 25px rgba(0,240,255,0.8)" }} />
              </div>
              <div className="absolute right-[20%] top-[30%] text-4xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                Patterns <span className="text-[#00F0FF]" style={{ filter: "drop-shadow(0 0 10px rgba(0,240,255,0.8))" }}>Found.</span>
              </div>
            </div>
            <div className="w-[100vw] h-full relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.15)_0%,transparent_70%)]" />
              <div className="absolute right-[10%] sm:right-[30%] text-center">
                <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6] mb-4" style={{ fontFamily: "Outfit, sans-serif", filter: "drop-shadow(0 0 30px rgba(0,240,255,0.5))" }}>99.9%ile</h2>
                <p className="text-lg md:text-xl text-[#00F0FF]/70 tracking-widest uppercase font-bold">Mistakes eliminated.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: SPIRAL TUNNEL ══ */}
      <section className="relative overflow-hidden h-screen flex flex-col items-center justify-center" id="spiral-section" style={{ background: "#0B0914" }}>
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none z-0" />
        <div className="text-center absolute top-24 z-50 w-full px-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Everything you need to <span className="text-[#8B5CF6]" style={{ filter: "drop-shadow(0 0 15px rgba(139,92,246,0.6))" }}>level up</span>.</h2>
          <p className="text-gray-400 text-lg">Powerful features wrapped in a frictionless UI.</p>
        </div>
        <div id="spiral-world" className="absolute top-1/2 left-1/2 w-0 h-0 z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-[#8B5CF6]/20 rounded-full blur-[100px] mix-blend-screen" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] bg-[#00F0FF]/20 rounded-full blur-[60px] mix-blend-screen animate-pulse" />
          {SPIRAL_CARDS.map((card, i) => (
            <div key={i} className={`spiral-card absolute w-[85vw] max-w-md glass-panel p-6 md:p-8 rounded-2xl border ${i === SPIRAL_CARDS.length - 1 ? "border-[#00F0FF]/50 bg-[#0a1a2f]" : "border-white/10"} flex flex-col items-center text-center shadow-2xl`}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-3xl" style={i === SPIRAL_CARDS.length - 1 ? { background: "#00F0FF", color: "#0B0914" } : undefined}>
                <i className={`ph ${card.icon}`} />
              </div>
              <h3 className={`text-xl md:text-2xl font-bold mb-2 ${i === SPIRAL_CARDS.length - 1 ? "text-[#00F0FF]" : ""}`}>{card.title}</h3>
              <p className={`text-sm md:text-base ${i === SPIRAL_CARDS.length - 1 ? "text-gray-300 font-medium" : "text-gray-400"}`}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 5.5: TEXT REVEAL ══ */}
      <section className="h-[80vh] flex items-center justify-center relative overflow-hidden" id="text-reveal-section" style={{ background: "#0B0914" }}>
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
          <div className="w-[50vw] h-[50vw] bg-[#8B5CF6]/10 rounded-full blur-[100px] absolute -translate-x-1/4 -translate-y-1/4 mix-blend-screen" />
          <div className="w-[40vw] h-[40vw] bg-[#00F0FF]/10 rounded-full blur-[100px] absolute translate-x-1/4 translate-y-1/4 mix-blend-screen" />
        </div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white/5" style={{ fontFamily: "Outfit, sans-serif" }}>
            {["Most", "students", "lose", "marks", "not", "because", "they", "don't", "know", "concepts,"].map((w, i) => (
              <span key={i} className="reveal-word transition-all duration-300 inline-block mr-2 md:mr-3">{w}</span>
            ))}
            <br className="hidden md:block" />
            {["but", "because", "they"].map((w, i) => (
              <span key={`b${i}`} className="reveal-word transition-all duration-300 inline-block mr-2 md:mr-3">{w}</span>
            ))}
            {["repeat", "the", "same", "silly", "mistakes."].map((w, i) => (
              <span key={`c${i}`} className="reveal-word transition-all duration-300 inline-block mr-2 md:mr-3 text-[#00F0FF]/10">{w}</span>
            ))}
          </h2>
        </div>
      </section>

      {/* ══ SECTION 6: DASHBOARD BENTO ══ */}
      <section id="dashboard" className="py-32 border-t border-white/5 relative z-10" style={{ background: "#121021" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Your new command center.</h2>
            <p className="text-lg md:text-xl text-gray-400">Designed entirely for JEE aspirants to turn weaknesses into strengths.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] md:auto-rows-[300px] perspective-1000">
            <div className="bento-item md:col-span-2 glass-panel rounded-2xl p-6 md:p-8 border border-white/5 hover:border-[#00F0FF]/50 transition-all duration-500 group overflow-hidden relative cursor-pointer hover:-translate-y-2">
              <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-[#00F0FF] transition-colors">Detailed Analytics</h3>
                <p className="text-gray-400 text-sm mb-4 md:mb-6">Subject-wise breakdown of where you lose marks.</p>
                <div className="flex-1 w-full bg-[#0B0914] rounded-xl border border-white/5 flex items-end justify-center gap-4 p-4">
                  <div className="w-12 bg-[#00F0FF]/40 rounded-t h-[40%] group-hover:h-[45%] transition-all duration-500 delay-100" />
                  <div className="w-12 bg-[#00F0FF]/60 rounded-t h-[70%] group-hover:h-[80%] transition-all duration-500 delay-200" />
                  <div className="w-12 bg-[#00F0FF] rounded-t h-[90%] group-hover:h-[100%] transition-all duration-500" style={{ boxShadow: "0 0 20px rgba(0,240,255,0.4)" }} />
                </div>
              </div>
            </div>
            <div className="bento-item glass-panel rounded-2xl p-6 md:p-8 border border-white/5 hover:border-[#8B5CF6]/50 transition-all duration-500 group cursor-pointer hover:-translate-y-2">
              <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-[#8B5CF6] transition-colors">Smart Tags</h3>
              <p className="text-gray-400 text-sm mb-4 md:mb-6">Categorize by error type.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs rounded-full">Calculation Error</span>
                <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs rounded-full">Forgot Formula</span>
                <span className="px-3 py-1 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded-full">Concept Gap</span>
                <span className="px-3 py-1 bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] text-xs rounded-full font-medium">Time Management</span>
              </div>
            </div>
            <div className="bento-item glass-panel rounded-2xl p-6 md:p-8 border border-white/5 hover:border-white/40 transition-all duration-500 group cursor-pointer hover:-translate-y-2">
              <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-white transition-colors">Revision Queue</h3>
              <p className="text-gray-400 text-sm mb-4 md:mb-6">Oldest mistakes first.</p>
              <div className="space-y-3">
                <div className="h-10 w-full bg-[#0B0914] border border-white/5 rounded flex items-center px-4 justify-between"><span className="text-xs text-gray-300 font-mono">Mock 1: Vectors</span><div className="w-4 h-4 border border-gray-500 rounded" /></div>
                <div className="h-10 w-full bg-[#0B0914] border border-white/5 rounded flex items-center px-4 justify-between"><span className="text-xs text-gray-300 font-mono">Practice: Kinematics</span><div className="w-4 h-4 border border-gray-500 rounded" /></div>
              </div>
            </div>
            <div className="bento-item md:col-span-2 glass-panel rounded-2xl p-6 md:p-8 border border-white/5 hover:border-[#EF4444]/50 transition-all duration-500 group flex items-center justify-between cursor-pointer hover:-translate-y-2">
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-2 group-hover:text-[#EF4444] transition-colors">Chapter Heatmaps</h3>
                <p className="text-gray-400 text-sm">Visual intensity maps based on error frequency.</p>
              </div>
              <div className="grid grid-cols-3 gap-1 w-24 h-24 md:w-32 md:h-32 rotate-[15deg] group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 shrink-0 ml-4">
                <div className="bg-[#EF4444]/10 rounded-sm" /><div className="bg-[#EF4444]/40 rounded-sm" /><div className="bg-[#EF4444]/20 rounded-sm" />
                <div className="bg-[#EF4444]/80 rounded-sm" /><div className="bg-[#EF4444]/10 rounded-sm" /><div className="bg-[#0B0914] rounded-sm border border-white/5" />
                <div className="bg-[#0B0914] rounded-sm border border-white/5" /><div className="bg-[#EF4444]/30 rounded-sm" /><div className="bg-[#EF4444]/50 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 6.5: ROADMAP ══ */}
      <section id="roadmap" className="py-32 relative z-10 border-t border-white/5" style={{ background: "#0B0914" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-24 roadmap-header">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>The Future of JEE Mirror</h2>
            <p className="text-lg md:text-xl text-gray-400">We are just getting started. Here is what is dropping next.</p>
          </div>
          <div className="relative">
            {[
              { icon: "ph-magic-wand", color: "#8B5CF6", label: "Coming Soon", title: "AI Study Suggestions", desc: "Our AI will analyze your mistake patterns and automatically recommend exactly which concepts you need to restudy.", top: "top-32", border: "border-[#8B5CF6]/30" },
              { icon: "ph-timer", color: "#00F0FF", label: "In Development", title: "Mock Test Mode", desc: "Generate a custom, timed mock test using exclusively the questions you've previously gotten wrong.", top: "top-40", border: "border-[#00F0FF]/30" },
              { icon: "ph-camera", color: "rgba(255,255,255,0.5)", label: "Planned", title: "Mistake Photo Uploads", desc: "Just snap a picture of your rough work or the question paper. We will store it securely with your mistake log.", top: "top-48", border: "border-white/20" },
            ].map((card, i) => (
              <div key={i} className={`stack-card roadmap-anim sticky ${card.top} glass-panel p-8 md:p-14 rounded-[2rem] border ${card.border} mb-24 bg-[#121021] origin-top cursor-default`} style={{ boxShadow: `0 30px 60px -15px ${card.color}33` }}>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl md:text-4xl shrink-0" style={{ background: `${card.color}33`, color: card.color, boxShadow: `0 0 20px ${card.color}66` }}>
                    <i className={`ph ${card.icon}`} />
                  </div>
                  <div>
                    <div className="font-bold tracking-widest text-sm mb-2 uppercase flex items-center gap-2" style={{ color: card.color }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: card.color }} /> {card.label}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>{card.title}</h3>
                    <p className="text-gray-400 text-base md:text-lg">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 7: BUILDER STORY ══ */}
      <section className="py-32 relative overflow-hidden border-t border-white/5" style={{ background: "#0B0914" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.05)_0%,transparent_50%)] z-0" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 social-header" style={{ fontFamily: "Outfit, sans-serif" }}>Built for Aspirants, by an Aspirant.</h2>
          <div className="social-anim glass-panel p-8 md:p-10 rounded-3xl border border-white/10 mt-12 text-left md:flex gap-10 items-center hover:scale-[1.02] hover:border-[#8B5CF6]/30 transition-all duration-500 cursor-default">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#00F0FF] flex-shrink-0 mx-auto md:mx-0 mb-6 md:mb-0 flex items-center justify-center overflow-hidden" style={{ boxShadow: "0 0 30px rgba(0,240,255,0.3)" }}>
              <i className="ph ph-user text-5xl md:text-6xl text-[#0B0914]" />
            </div>
            <div>
              <i className="ph ph-quotes text-3xl md:text-4xl text-[#8B5CF6] opacity-50 mb-4 block" />
              <p className="text-base md:text-xl text-gray-300 mb-6 leading-relaxed font-medium">
                JEEMirror isn't a massive corporate tool. It was built out of pure necessity to solve the exact problem you are facing right now: repeating silly mistakes and hitting a score plateau. I built it in 2 days to fix my own prep. Now, it's here to fix yours.
              </p>
              <div>
                <div className="font-bold text-white text-lg md:text-xl tracking-wide" style={{ fontFamily: "Outfit, sans-serif" }}>Avadhoot Kekan</div>
                <div className="text-[#00F0FF] text-sm font-medium tracking-widest uppercase mt-1">17-year-old Builder &amp; JEE Aspirant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL BADGE STRIP ══ */}
      <section className="py-16 border-t border-white/5 overflow-x-auto" style={{ background: "#121021" }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-8 text-center">Follow us for JEE tips:</p>
          <div className="flex gap-4 md:gap-6 justify-start md:justify-center overflow-x-auto pb-4 md:pb-0 md:flex-wrap">
            {[
              { platform: "Instagram", handle: "@cellux.official", desc: "JEE Tips & Reels", icon: "ph-instagram-logo", color: "#E4405F", url: "https://www.instagram.com/cellux.official" },
              { platform: "YouTube", handle: "@cellux-b7p", desc: "App Demos & Study Content", icon: "ph-youtube-logo", color: "#FF0000", url: "https://youtube.com/@cellux-b7p" },
              { platform: "Reddit", handle: "u/Cellux_official", desc: "Community Discussions", icon: "ph-reddit-logo", color: "#FF4500", url: "https://www.reddit.com/user/Cellux_official" },
              { platform: "Facebook", handle: "Avadhoot Kekan", desc: "Updates & Announcements", icon: "ph-facebook-logo", color: "#1877F2", url: "https://www.facebook.com/avadhootkekan" },
            ].map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="glass-panel rounded-xl p-5 md:p-6 border border-white/5 hover:border-white/20 transition-all min-w-[180px] md:min-w-[200px] flex-1 max-w-[260px] group shrink-0">
                <i className={`ph ${s.icon} text-2xl md:text-3xl mb-3 block`} style={{ color: s.color }} />
                <div className="font-bold text-sm mb-1">{s.platform}</div>
                <div className="text-xs text-gray-400 mb-2">{s.handle}</div>
                <div className="text-xs text-gray-500 mb-3">{s.desc}</div>
                <span className="text-xs font-bold text-[#00F0FF] group-hover:underline">Follow →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LEADERBOARD ══ */}
      <LeaderboardSection />

      {/* ══ SECTION 8: PRICING ══ */}
      <section id="pricing" className="py-32 relative border-t border-white/5 overflow-hidden" style={{ background: "#1C1936" }}>
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-[#00F0FF]/10 blur-[150px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 pricing-header">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Less than the cost of a rough notebook.</h2>
            <p className="text-lg md:text-xl text-gray-400">Zero recurring server costs means pure value for you.</p>
            <div className="inline-flex bg-[#0B0914] border border-white/10 rounded-full p-1 mt-8 magnetic hover-trigger" style={{ boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}>
              <button onClick={() => setPricingPlan("monthly")} className={`px-5 md:px-6 py-2 rounded-full text-sm font-medium transition-all ${pricingPlan === "monthly" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>Monthly</button>
              <button onClick={() => setPricingPlan("yearly")} className={`px-5 md:px-6 py-2 rounded-full text-sm font-medium transition-all ${pricingPlan === "yearly" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}>Yearly <span className="text-green-400 text-xs ml-1 font-bold">-41%</span></button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto perspective-1000">
            <div className={`pricing-card glass-panel rounded-3xl p-6 md:p-8 border flex flex-col relative overflow-hidden hover:-translate-y-4 transition-all duration-500 ${pricingPlan === "monthly" ? "border-[#00F0FF] shadow-[0_0_40px_rgba(0,240,255,0.15)]" : "border-white/10"}`}>
              <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors ${pricingPlan === "monthly" ? "text-[#00F0FF]" : ""}`}>Monthly Prep</h3>
              <p className="text-gray-400 text-sm mb-6">Perfect to test the waters before exams.</p>
              <div className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>₹50<span className="text-lg text-gray-500 font-normal" style={{ fontFamily: "Inter, sans-serif" }}>/mo</span></div>
              <ul className="space-y-4 mb-10 flex-1 relative z-10">
                {["Unlimited Mistake Logging", "Full Dashboard Analytics", "Active Revision Mode", "Chapter Heatmaps"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-gray-300 text-sm md:text-base"><i className="ph ph-check-circle text-[#00F0FF] text-xl" style={{ filter: "drop-shadow(0 0 5px rgba(0,240,255,0.5))" }} /> {f}</li>
                ))}
              </ul>
              <Link to="/signup" className="magnetic hover-trigger relative z-10 w-full py-4 rounded-xl border border-[#00F0FF] text-[#00F0FF] font-bold hover:bg-[#00F0FF] hover:text-[#0B0914] transition-all text-center block">Select Monthly</Link>
            </div>
            <div className={`pricing-card glass-panel rounded-3xl p-6 md:p-8 border flex flex-col relative overflow-hidden hover:-translate-y-4 transition-all duration-500 ${pricingPlan === "yearly" ? "border-[#00F0FF] shadow-[0_0_40px_rgba(0,240,255,0.15)]" : "border-white/10"}`}>
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00F0FF] to-[#8B5CF6] animate-pulse" />
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#00F0FF]/20 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute top-6 right-6 bg-[#00F0FF]/20 text-[#00F0FF] text-xs font-bold px-3 py-1 rounded-full border border-[#00F0FF]/50" style={{ boxShadow: "0 0 10px rgba(0,240,255,0.5)" }}>Most Popular</div>
              <h3 className={`text-xl md:text-2xl font-bold mb-2 transition-colors ${pricingPlan === "yearly" ? "text-[#00F0FF]" : ""}`}>Yearly Mastery</h3>
              <p className="text-gray-400 text-sm mb-6">Commit to the process and save huge.</p>
              <div className="text-4xl md:text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-white" style={{ fontFamily: "Outfit, sans-serif" }}>₹350<span className="text-lg text-gray-500 font-normal" style={{ fontFamily: "Inter, sans-serif" }}>/yr</span></div>
              <ul className="space-y-4 mb-10 flex-1 relative z-10">
                {["Everything in Monthly", "Priority Feature Access", "Keep data till JEE Adv", "Manual Admin Support"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-gray-300 font-medium text-sm md:text-base"><i className="ph ph-check-circle text-[#00F0FF] text-xl" style={{ filter: "drop-shadow(0 0 5px rgba(0,240,255,0.8))" }} /> {f}</li>
                ))}
              </ul>
              <Link to="/signup" className="magnetic hover-trigger relative z-10 w-full py-4 rounded-xl bg-[#00F0FF] text-[#0B0914] font-bold hover:bg-white transition-all text-center block" style={{ boxShadow: "0 0 30px rgba(0,240,255,0.3)" }}>Get Yearly Access</Link>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-8 opacity-80"><i className="ph ph-lock-key" /> Payment via UPI. Instant manual activation by admin within 2 hours.</p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-32 border-t border-white/5 relative" style={{ background: "#0B0914" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center testimonial-header" style={{ fontFamily: "Outfit, sans-serif" }}>What JEE Aspirants Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card glass-panel rounded-2xl p-6 md:p-8 border border-white/5 hover:border-[#8B5CF6]/30 transition-all duration-300">
                <div className="text-yellow-400 text-sm mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300 mb-6 leading-relaxed text-sm md:text-base">"{t.text}"</p>
                <div><div className="font-bold text-white text-sm">{t.name}</div><div className="text-xs text-gray-500">{t.title}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 9: FAQ ══ */}
      <section className="py-32 relative overflow-hidden" style={{ background: "#0B0914" }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center faq-header" style={{ fontFamily: "Outfit, sans-serif" }}>Frequently Asked Questions</h2>
          <div className="space-y-4 mb-32">
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item glass-panel border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-[#00F0FF]/30 transition-colors duration-300" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="p-5 md:p-6 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors">
                  <h4 className="font-bold text-base md:text-lg pr-4">{faq.q}</h4>
                  <i className={`ph ph-caret-down text-[#00F0FF] transition-transform duration-300 shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
                <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: openFaq === i ? "200px" : "0" }}>
                  <p className="p-5 md:p-6 text-gray-400 text-sm border-t border-white/5 leading-relaxed" style={{ background: "rgba(18,16,33,0.5)" }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ══ FINAL CTA ══ */}
          <div className="cta-anim glass-panel rounded-[2rem] p-10 md:p-20 text-center border border-[#00F0FF]/30 relative overflow-hidden" style={{ boxShadow: "0 0 100px rgba(0,240,255,0.15)" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#00F0FF]/20 to-transparent opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-pulse pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif", textShadow: "0 0 15px rgba(255,255,255,0.3)" }}>Stop guessing. Start tracking.</h2>
              <p className="text-lg md:text-xl text-[#00F0FF]/80 mb-10 max-w-xl mx-auto font-medium">Join 16+ JEE aspirants already using JEEMirror to fix their weak spots.</p>
              <Link to="/signup" className="magnetic hover-trigger inline-block px-8 md:px-10 py-4 md:py-5 rounded-2xl bg-[#00F0FF] text-[#0B0914] font-bold text-lg md:text-xl hover:scale-105 hover:bg-white transition-all duration-300" style={{ boxShadow: "0 0 50px rgba(0,240,255,0.4)" }}>
                Start Free Trial →
              </Link>
              <p className="text-gray-500 text-sm mt-6">No credit card. No UPI needed to start. Just sign up and log your first mistake.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-12 border-t border-white/10 text-center text-sm text-gray-500 relative z-10" style={{ background: "#0B0914" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 magnetic hover-trigger">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00F0FF] to-[#8B5CF6] flex items-center justify-center font-bold text-[#0B0914] text-sm" style={{ fontFamily: "Outfit, sans-serif", boxShadow: "0 0 10px rgba(139,92,246,0.5)" }}>M</div>
            <span className="font-bold text-white tracking-tight text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>JEE Mirror</span>
          </div>
          <p className="font-medium tracking-wide">&copy; 2026 JEE Mirror. Built by Avadhoot Kekan.</p>
          <div className="flex gap-4">
            {[
              { icon: "ph-instagram-logo", url: "https://www.instagram.com/cellux.official" },
              { icon: "ph-youtube-logo", url: "https://youtube.com/@cellux-b7p" },
              { icon: "ph-reddit-logo", url: "https://www.reddit.com/user/Cellux_official" },
              { icon: "ph-facebook-logo", url: "https://www.facebook.com/avadhootkekan" },
            ].map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xl text-gray-400 hover:text-[#00F0FF] transition-all hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
                <i className={`ph ${s.icon}`} />
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <a href="mailto:cellux.official@gmail.com" className="hover:text-white transition-colors">Contact: cellux.official@gmail.com</a>
        </div>
      </footer>

      <ShareWidget />
    </div>
  );
}
