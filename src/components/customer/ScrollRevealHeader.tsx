'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isLastWord = index === WORDS.length - 1;
    const currentDuration = isLastWord ? 2800 : 1200; // Tampilkan 'Gabin!' lebih lama (2.8 detik)

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length);
        setVisible(true);
      }, 150);
    }, currentDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index]);

  return (
    <section className="relative px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center max-w-2xl mx-auto overflow-hidden select-none">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-blue-500/15 via-sky-400/10 to-indigo-500/10 dark:from-blue-600/20 dark:via-sky-500/15 dark:to-indigo-500/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/70 text-blue-700 dark:text-blue-300 text-[11px] font-bold mb-4 shadow-xs">
        <Sparkles size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Es Gabin Premium Renyah & Dingin</span>
      </div>

      {/* Centered Logo Animation (Dynamic Fade & Scale) */}
      <div className="flex items-center justify-center my-1 text-center">
        <img
          key={index}
          src="/img/lag gabin middle.svg"
          alt={`Lah Gabin ${WORDS[index]}`}
          className={`h-16 sm:h-20 md:h-24 w-auto object-contain transition-all duration-300 ease-out ${
            visible
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        />
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
