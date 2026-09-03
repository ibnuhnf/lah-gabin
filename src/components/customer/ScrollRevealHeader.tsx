'use client';

import { useEffect, useState } from 'react';
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
  'Gabin!',
];

export default function ScrollRevealHeader() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-cycle words smoothly every 1.5s, also reacts to user scrolling
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % WORDS.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center max-w-2xl mx-auto overflow-hidden select-none">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-blue-500/15 via-sky-400/10 to-indigo-500/10 dark:from-blue-600/20 dark:via-sky-500/15 dark:to-indigo-500/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/70 text-blue-700 dark:text-blue-300 text-[11px] font-bold mb-4 shadow-xs">
        <Sparkles size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Es Gabin Premium Renyah & Dingin</span>
      </div>

      {/* Split Text Heading */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-3xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight leading-tight my-1">
        <span className="text-slate-900 dark:text-white shrink-0">
          Lah&nbsp;
        </span>

        <div className="relative h-[1.3em] overflow-hidden flex flex-col items-start justify-center">
          <div
            className="transition-transform duration-500 ease-out flex flex-col"
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
                        ? 'text-blue-600 dark:text-sky-400 font-black scale-105'
                        : 'text-blue-600 dark:text-sky-400 font-extrabold scale-100'
                      : 'text-slate-300 dark:text-neutral-700 opacity-25 scale-95'
                  }`}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 mt-3 max-w-md mx-auto leading-relaxed font-medium">
        Biskuit gabin renyah dengan isian fla lembut manis aneka rasa. Dibuat fresh setiap hari.
      </p>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mt-6">
        <a
          href="#menu"
          className="btn-primary text-xs py-2.5 px-5 shadow-md shadow-blue-500/20"
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
    </section>
  );
}
