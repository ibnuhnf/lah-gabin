'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles } from 'lucide-react';

const WORDS = [
  'enak.',
  'dingin.',
  'deket.',
  'murah.',
  'nagih.',
  'kenyang.',
  'manis.',
  'banyak rasa.',
  'Lah Gabin!',
];

export default function ScrollRevealHeader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollable = rect.height - windowHeight;

      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      const index = Math.min(
        WORDS.length - 1,
        Math.floor(progress * WORDS.length)
      );
      setActiveIndex(index);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ minHeight: `${WORDS.length * 50 + 40}vh` }}
    >
      {/* Sticky Reveal Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center px-4 overflow-hidden select-none">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-gradient-to-tr from-blue-500/15 via-sky-400/10 to-indigo-500/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Small Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold mb-6 shadow-xs animate-in fade-in duration-300">
          <Sparkles size={13} className="text-blue-500" />
          <span>Es Gabin Premium Renyah & Dingin</span>
        </div>

        {/* Sticky Split Text */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-3xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight">
          <span className="text-neutral-900 dark:text-white shrink-0">
            lah&nbsp;
          </span>

          <div className="relative h-[1.3em] overflow-hidden flex flex-col items-start justify-center">
            <div
              className="transition-transform duration-300 ease-out flex flex-col"
              style={{
                transform: `translateY(-${activeIndex * (100 / WORDS.length)}%)`,
                height: `${WORDS.length * 100}%`,
              }}
            >
              {WORDS.map((word, idx) => {
                const isSelected = activeIndex === idx;
                const isLast = idx === WORDS.length - 1;

                return (
                  <div
                    key={word}
                    className={`h-[1.3em] flex items-center transition-all duration-300 ${
                      isSelected
                        ? isLast
                          ? 'bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent font-black scale-105'
                          : 'bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent font-extrabold scale-100'
                        : 'text-neutral-300 dark:text-neutral-700 opacity-40 scale-95'
                    }`}
                  >
                    {word}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subtitle & CTA */}
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-4 max-w-sm sm:max-w-md text-center leading-relaxed font-medium">
          Biskuit gabin renyah dengan isian fla lembut manis aneka rasa. Dibuat fresh setiap hari.
        </p>

        <div className="flex items-center gap-3 mt-7">
          <a
            href="#menu"
            className="btn-primary text-xs py-2.5 px-5 shadow-lg shadow-blue-500/25"
          >
            <ShoppingBag size={14} /> Lihat Menu
          </a>
          <Link
            href="/pemesanan"
            className="btn-secondary text-xs py-2.5 px-5"
          >
            Lacak Pesanan
          </Link>
        </div>

        {/* Scroll Hint */}
        <div className="absolute bottom-6 flex flex-col items-center gap-1.5 opacity-60">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Scroll ke bawah
          </span>
          <div className="w-4 h-7 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-start justify-center p-1">
            <div className="w-1 h-1.5 bg-blue-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
