import { useEffect, useState, useRef } from 'react';

function getISTTime() {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function FlipDigit({ digit, prevDigit }: { digit: string; prevDigit: string }) {
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 500);
      return () => clearTimeout(t);
    }
  }, [digit, prevDigit]);

  return (
    <div className="relative w-10 h-14 sm:w-12 sm:h-16 perspective-500">
      {/* Base card */}
      <div className="absolute inset-0 rounded-lg bg-card border border-primary/25 flex items-center justify-center flip-digit-glow">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{digit}</span>
      </div>
      {/* Flip animation overlay */}
      {flipping && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          {/* Top half flipping away (old digit) */}
          <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-lg origin-bottom animate-flip-top">
            <div className="absolute inset-0 bg-card border border-primary/25 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground translate-y-[50%]">{prevDigit}</span>
            </div>
          </div>
          {/* Bottom half revealing (new digit) */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-lg origin-top animate-flip-bottom">
            <div className="absolute inset-0 bg-card border border-primary/25 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground -translate-y-[50%]">{digit}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlipClock() {
  const [time, setTime] = useState(getISTTime);
  const prevTimeRef = useRef(time);

  useEffect(() => {
    const id = setInterval(() => {
      prevTimeRef.current = time;
      setTime(getISTTime());
    }, 1000);
    return () => clearInterval(id);
  });

  const current = time.toUpperCase();
  const prev = prevTimeRef.current.toUpperCase();

  // Parse: "01:30 PM" → digits ["0","1"], ["3","0"], period "PM"
  const parts = current.split(' ');
  const timePart = parts[0]; // "01:30"
  const period = parts[1] || 'AM'; // "PM"

  const prevParts = prev.split(' ');
  const prevTimePart = prevParts[0];

  const [hh, mm] = timePart.split(':');
  const [phh, pmm] = prevTimePart.split(':');

  const digits = [hh[0], hh[1], mm[0], mm[1]];
  const prevDigits = [phh?.[0] || hh[0], phh?.[1] || hh[1], pmm?.[0] || mm[0], pmm?.[1] || mm[1]];

  return (
    <div className="flex flex-col items-center gap-1.5" role="timer" aria-label={`Current time: ${current}`}>
      <div className="flex items-center gap-1.5 sm:gap-2 clock-breathing-glow rounded-xl p-2.5 sm:p-3">
        <FlipDigit digit={digits[0]} prevDigit={prevDigits[0]} />
        <FlipDigit digit={digits[1]} prevDigit={prevDigits[1]} />
        <span className="text-2xl sm:text-3xl font-bold text-primary animate-pulse mx-0.5">:</span>
        <FlipDigit digit={digits[2]} prevDigit={prevDigits[2]} />
        <FlipDigit digit={digits[3]} prevDigit={prevDigits[3]} />
        <span className="ml-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
          {period}
        </span>
      </div>
      <span className="text-xs font-semibold text-primary/70 tracking-widest">IST</span>
    </div>
  );
}
