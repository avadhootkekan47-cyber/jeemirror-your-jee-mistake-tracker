import { useEffect, useState } from 'react';

interface TypingGreetingProps {
  text: string;
  speed?: number;
  className?: string;
}

export default function TypingGreeting({ text, speed = 50, className = '' }: TypingGreetingProps) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [doneTyping, setDoneTyping] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDoneTyping(false);
    setShowCursor(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDoneTyping(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  useEffect(() => {
    if (!doneTyping) return;
    const id = setTimeout(() => setShowCursor(false), 2000);
    return () => clearTimeout(id);
  }, [doneTyping]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && <span className="animate-pulse text-primary">|</span>}
    </span>
  );
}
