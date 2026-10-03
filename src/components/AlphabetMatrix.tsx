/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, Sparkles, Filter, Search, Check, Copy } from 'lucide-react';
import {
  VOWEL_MAP,
  CONSONANT_MAP,
  PUNCTUATION_MAP,
  CODE_TO_CHAR,
} from '../lib/cipherEngine.ts';
import { audioSynth } from '../lib/audioSynth.ts';

interface AlphabetMatrixProps {
  lang: 'en' | 'bn';
}

export const AlphabetMatrix: React.FC<AlphabetMatrixProps> = ({ lang }) => {
  const [filter, setFilter] = useState<'all' | 'vowels' | 'consonants' | 'symbols'>('all');
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Build combined letter list
  const letterList: {
    char: string;
    code: string;
    type: 'vowel' | 'consonant' | 'separator' | 'punctuation' | 'digit';
    hz: number;
    examples: string;
    examplesBn: string;
  }[] = [];

  // Vowels
  const vowelExamples: Record<string, { en: string; bn: string }> = {
    A: { en: 'A (1L), at (2L), and (3L), area (4L)', bn: 'A (১L), at (২L), and (৩L), area (৪L)' },
    E: { en: 'he (2L), red (3L), echo (4L)', bn: 'he (২L), red (৩L), echo (৪L)' },
    I: { en: 'I (1L), in (2L), ice (3L), iron (4L)', bn: 'I (১L), in (২L), ice (৩L), iron (৪L)' },
    O: { en: 'on (2L), owl (3L), open (4L)', bn: 'on (২L), owl (৩L), open (৪L)' },
    U: { en: 'up (2L), urn (3L), user (4L)', bn: 'up (২L), urn (৩L), user (৪L)' },
  };

  Object.entries(VOWEL_MAP).forEach(([char, meta]) => {
    letterList.push({
      char,
      code: meta.code,
      type: 'vowel',
      hz: meta.hz,
      examples: vowelExamples[char]?.en || '',
      examplesBn: vowelExamples[char]?.bn || '',
    });
  });

  // Consonants
  const consonantExamples: Record<string, { en: string; bn: string }> = {
    B: { en: 'be (2L), box (3L), book (4L)', bn: 'be (২L), box (৩L), book (৪L)' },
    C: { en: 'cat (3L), code (4L), city (4L)', bn: 'cat (৩L), code (৪L), city (৪L)' },
    D: { en: 'do (2L), dog (3L), dark (4L)', bn: 'do (২L), dog (৩L), dark (৪L)' },
    F: { en: 'of (2L), fox (3L), four (4L)', bn: 'of (২L), fox (৩L), four (৪L)' },
    G: { en: 'go (2L), get (3L), good (4L)', bn: 'go (২L), get (৩L), good (৪L)' },
    H: { en: 'he (2L), hat (3L), home (4L)', bn: 'he (২L), hat (৩L), home (৪L)' },
    J: { en: 'joy (3L), jar (3L), jump (4L)', bn: 'joy (৩L), jar (৩L), jump (৪L)' },
    K: { en: 'key (3L), kid (3L), king (4L)', bn: 'key (৩L), kid (৩L), king (৪L)' },
    L: { en: 'leg (3L), low (3L), love (4L)', bn: 'leg (৩L), low (৩L), love (৪L)' },
    M: { en: 'my (2L), map (3L), moon (4L)', bn: 'my (২L), map (৩L), moon (৪L)' },
    N: { en: 'no (2L), net (3L), news (4L)', bn: 'no (২L), net (৩L), news (৪L)' },
    P: { en: 'pen (3L), pie (3L), play (4L)', bn: 'pen (৩L), pie (৩L), play (৪L)' },
    Q: { en: 'quiz (4L)', bn: 'quiz (৪L)' },
    R: { en: 'run (3L), red (3L), read (4L)', bn: 'run (৩L), red (৩L), read (৪L)' },
    S: { en: 'so (2L), sun (3L), star (4L)', bn: 'so (২L), sun (৩L), star (৪L)' },
    T: { en: 'to (2L), the (3L), tree (4L)', bn: 'to (২L), the (৩L), tree (৪L)' },
    V: { en: 'van (3L), view (4L)', bn: 'van (৩L), view (৪L)' },
    W: { en: 'we (2L), way (3L), word (4L)', bn: 'we (২L), way (৩L), word (৪L)' },
    X: { en: 'box (3L), taxi (4L)', bn: 'box (৩L), taxi (৪L)' },
    Y: { en: 'by (2L), you (3L), year (4L)', bn: 'by (২L), you (৩L), year (৪L)' },
    Z: { en: 'zoo (3L), zero (4L)', bn: 'zoo (৩L), zero (৪L)' },
  };

  Object.entries(CONSONANT_MAP).forEach(([char, meta]) => {
    letterList.push({
      char,
      code: meta.code,
      type: 'consonant',
      hz: meta.hz,
      examples: consonantExamples[char]?.en || '',
      examplesBn: consonantExamples[char]?.bn || '',
    });
  });

  // Punctuation & space
  Object.entries(PUNCTUATION_MAP).forEach(([char, meta]) => {
    letterList.push({
      char: char === ' ' ? 'Space (␣)' : char,
      code: meta.code,
      type: char === ' ' ? 'separator' : 'punctuation',
      hz: meta.hz,
      examples: meta.label,
      examplesBn: char === ' ' ? 'শব্দের মাঝে ফাঁক' : meta.label,
    });
  });

  const filteredLetters = letterList.filter((item) => {
    if (filter === 'vowels' && item.type !== 'vowel') return false;
    if (filter === 'consonants' && item.type !== 'consonant') return false;
    if (filter === 'symbols' && item.type !== 'punctuation' && item.type !== 'separator') return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        item.char.toLowerCase().includes(q) ||
        item.code.includes(q) ||
        item.examples.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {lang === 'bn' ? 'সাইফার ম্যাট্রিক্স ও বর্ণমালা তালিকা' : 'Cipher Alphabet Matrix & Specifications'}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          {lang === 'bn'
            ? 'ইংরেজি ২৬টি বর্ণের প্রতিটির নির্ধারিত দুই অঙ্কের নির্দিষ্ট সংখ্যা কোড রয়েছে। স্বরবর্ণের জন্য ১১–১৫ এবং ব্যঞ্জনবর্ণের জন্য ২১–৪১ ব্যান্ড নির্ধারিত।'
            : 'Complete bidirectional mapping for all 26 English letters, delimiters, and symbols. Vowels span Tier 1 (11–15) and Consonants span Tier 2 (21–41).'}
        </p>
      </div>

      {/* Mathematical Variation Formula Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vowel Rule */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {lang === 'bn' ? 'স্বরবর্ণের গাণিতিক নিয়ম' : 'Vowel Mathematical Variation'}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-900/60 text-amber-200">
              Codes: 11 – 15
            </span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {lang === 'bn'
              ? 'ইংরেজি স্বরবর্ণ (A, E, I, O, U) হলো ভাষার মূল সুর। তাই এদেরকে ১০ এর ঘরে (১১, ১২, ১৩, ১৪, ১৫) রাখা হয়েছে এবং উচ্চ হারমোনিক ফ্রিকোয়েন্সি (৫২৩ - ১০৪৬ Hz) দেওয়া হয়েছে।'
              : 'Vowels (A, E, I, O, U) form the core harmonic vocal track. They are placed in the base-10 register (11 to 15) and voiced as bright sine chimes (523–1046 Hz).'}
          </p>
          <div className="pt-1 flex flex-wrap gap-2 text-xs font-mono">
            <span className="bg-amber-950/80 px-2 py-1 rounded border border-amber-600/30 text-amber-300">
              A = 11
            </span>
            <span className="bg-amber-950/80 px-2 py-1 rounded border border-amber-600/30 text-amber-300">
              E = 12
            </span>
            <span className="bg-amber-950/80 px-2 py-1 rounded border border-amber-600/30 text-amber-300">
              I = 13
            </span>
            <span className="bg-amber-950/80 px-2 py-1 rounded border border-amber-600/30 text-amber-300">
              O = 14
            </span>
            <span className="bg-amber-950/80 px-2 py-1 rounded border border-amber-600/30 text-amber-300">
              U = 15
            </span>
          </div>
        </div>

        {/* Consonant Rule */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              {lang === 'bn' ? 'ব্যঞ্জনবর্ণের গাণিতিক নিয়ম' : 'Consonant Structural Variation'}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200">
              Codes: 21 – 41
            </span>
          </div>
          <p className="text-xs text-cyan-200/90 leading-relaxed">
            {lang === 'bn'
              ? 'ইংরেজি ব্যঞ্জনবর্ণ (B থেকে Z) হলো ভাষার কাঠামোগত ফ্রেম। এদের কোড ২১ থেকে শুরু হয়ে ৪১ পর্যন্ত ক্রমান্বয়ে সাজানো এবং গভীর পারকাসিভ সাউন্ড টোন বরাদ্দ।'
              : 'Consonants (B to Z) form the structural articulation. Coded from 21 through 41 consecutively, voiced as resonant triangle bass hits (164–739 Hz).'}
          </p>
          <div className="pt-1 flex flex-wrap gap-1.5 text-xs font-mono">
            <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-600/30 text-cyan-300">
              B=21
            </span>
            <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-600/30 text-cyan-300">
              C=22
            </span>
            <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-600/30 text-cyan-300">
              D=23
            </span>
            <span className="text-slate-500">...</span>
            <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-600/30 text-cyan-300">
              T=36
            </span>
            <span className="bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-600/30 text-cyan-300">
              Z=41
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'all', label: lang === 'bn' ? 'সব বর্ণ' : 'All Symbols' },
              { id: 'vowels', label: lang === 'bn' ? 'স্বরবর্ণ (১১-১৫)' : 'Vowels (11-15)' },
              { id: 'consonants', label: lang === 'bn' ? 'ব্যঞ্জনবর্ণ (২১-৪১)' : 'Consonants (21-41)' },
              { id: 'symbols', label: lang === 'bn' ? 'স্পেস ও চিহ্ন' : 'Punctuation' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === t.id
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'অক্ষর বা কোড খুঁজুন...' : 'Search letter or code...'}
            className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full sm:w-48"
          />
        </div>
      </div>

      {/* Letters Matrix Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                <th className="py-2.5 px-4">{lang === 'bn' ? 'বর্ণ' : 'Character'}</th>
                <th className="py-2.5 px-4">{lang === 'bn' ? 'শ্রেণীবিভাগ' : 'Classification'}</th>
                <th className="py-2.5 px-4">{lang === 'bn' ? 'সংখ্যা কোড' : 'Cipher Code'}</th>
                <th className="py-2.5 px-4">{lang === 'bn' ? 'শব্দ তরঙ্গ (Hz)' : 'Acoustic Tone'}</th>
                <th className="py-2.5 px-4">{lang === 'bn' ? '১–৪ অক্ষরের শব্দের উদাহরণ' : 'Word Examples (1, 2, 3, 4L)'}</th>
                <th className="py-2.5 px-4 text-right">{lang === 'bn' ? 'শব্দ শুনুন' : 'Audio'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLetters.map((item) => {
                const isV = item.type === 'vowel';
                const isC = item.type === 'consonant';

                return (
                  <tr
                    key={item.char}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-bold text-base text-white">
                        {item.char}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          isV
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30'
                            : isC
                            ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isV
                          ? lang === 'bn' ? 'স্বরবর্ণ (Vowel)' : 'Vowel'
                          : isC
                          ? lang === 'bn' ? 'ব্যঞ্জনবর্ণ (Consonant)' : 'Consonant'
                          : lang === 'bn' ? 'চিহ্ন / ফাঁকা' : 'Symbol / Break'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-emerald-400 tabular-nums text-sm">
                          {item.code}
                        </span>
                        <button
                          onClick={() => handleCopy(item.code)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity ml-1"
                          title="Copy Code"
                        >
                          {copiedCode === item.code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-300 tabular-nums">
                      {item.hz.toFixed(1)} Hz
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-mono">
                      {lang === 'bn' ? item.examplesBn : item.examples}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => audioSynth.playTone(item.hz, item.type, 260)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center"
                        title="Play Letter Tone"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
