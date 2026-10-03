/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Copy,
  Check,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  WordAnalysis,
  encodeSentence,
  encodeCharacter,
  CODE_TO_CHAR,
} from '../lib/cipherEngine.ts';
import { audioSynth } from '../lib/audioSynth.ts';

interface WordLengthInspectorProps {
  sentence: string;
  setSentence: (s: string) => void;
  lang: 'en' | 'bn';
}

// Built-in educational catalog of words by length for exploration
const COMMON_WORD_CATALOG = {
  oneLetter: [
    { word: 'I', descEn: 'First-person singular pronoun', descBn: 'উত্তম পুরুষ একবচন সর্বনাম (আমি)' },
    { word: 'A', descEn: 'Indefinite article', descBn: 'অনির্দিষ্ট পদাশ্রিত নির্দেশক (একটি)' },
    { word: 'O', descEn: 'Vocative exclamation / poetic', descBn: 'সম্বোধনমূলক বা আবেগ প্রকাশক অব্যয়' },
  ],
  twoLetter: [
    { word: 'in', pattern: 'V-C', descEn: 'Preposition of location or inclusion', descBn: 'অবস্থান বা অন্তর্ভুক্তি বোঝায়' },
    { word: 'to', pattern: 'C-V', descEn: 'Direction or infinitive marker', descBn: 'অভিমুখ বা দিক নির্দেশক' },
    { word: 'on', pattern: 'V-C', descEn: 'Preposition of surface contact', descBn: 'পৃষ্ঠ বা ওপর নির্দেশক' },
    { word: 'at', pattern: 'V-C', descEn: 'Specific point or time', descBn: 'নির্দিষ্ট স্থান বা সময়' },
    { word: 'he', pattern: 'C-V', descEn: 'Third-person masculine pronoun', descBn: 'পুংলিঙ্গ সর্বনাম (সে)' },
    { word: 'is', pattern: 'V-C', descEn: 'Third-person singular present of be', descBn: 'হয় / বর্তমান কাল' },
    { word: 'we', pattern: 'C-V', descEn: 'First-person plural pronoun', descBn: 'উত্তম পুরুষ বহুবচন (আমরা)' },
    { word: 'go', pattern: 'C-V', descEn: 'Action verb of movement', descBn: 'যাওয়া ক্রিয়া' },
    { word: 'up', pattern: 'V-C', descEn: 'Direction towards a higher position', descBn: 'উপরের দিকে' },
    { word: 'by', pattern: 'C-V/C', descEn: 'Agent or means', descBn: 'দ্বারা / মাধ্যমে' },
  ],
  threeLetter: [
    { word: 'the', pattern: 'C-C-V', descEn: 'Definite article', descBn: 'নির্দিষ্ট নির্দেশক (টি / টা)' },
    { word: 'and', pattern: 'V-C-C', descEn: 'Conjunction connecting elements', descBn: 'সংযোজক অব্যয় (এবং)' },
    { word: 'cat', pattern: 'C-V-C', descEn: 'Small domesticated carnivorous mammal', descBn: 'গৃহপালিত প্রাণী (বিড়াল)' },
    { word: 'dog', pattern: 'C-V-C', descEn: 'Common canine pet', descBn: 'কুকুর' },
    { word: 'sun', pattern: 'C-V-C', descEn: 'The star around which the earth orbits', descBn: 'সূর্য' },
    { word: 'sky', pattern: 'C-C-C/V', descEn: 'The atmosphere viewed from earth', descBn: 'আকাশ' },
    { word: 'run', pattern: 'C-V-C', descEn: 'Move at a speed faster than walking', descBn: 'দৌড়ানো' },
    { word: 'day', pattern: 'C-V-C', descEn: '24-hour period of rotation', descBn: 'দিন' },
  ],
  fourLetter: [
    { word: 'book', pattern: 'C-V-V-C', descEn: 'Written or printed work of pages', descBn: 'বই / গ্রন্থ' },
    { word: 'read', pattern: 'C-V-V-C', descEn: 'Look at and comprehend written text', descBn: 'পড়া বা পাঠ করা' },
    { word: 'four', pattern: 'C-V-V-C', descEn: 'Numeric cardinal 4', descBn: 'সংখ্যা চার (৪)' },
    { word: 'blue', pattern: 'C-C-V-V', descEn: 'Color of a clear daytime sky', descBn: 'নীল রঙ' },
    { word: 'room', pattern: 'C-V-V-C', descEn: 'Part of the inside of a building', descBn: 'কক্ষ / ঘর' },
    { word: 'tree', pattern: 'C-C-V-V', descEn: 'Woody perennial plant with trunk', descBn: 'গাছ / বৃক্ষ' },
    { word: 'code', pattern: 'C-V-C-V', descEn: 'System of words or digits for secrecy or programming', descBn: 'কোড বা সংকেত' },
    { word: 'love', pattern: 'C-V-C-V', descEn: 'Intense feeling of deep affection', descBn: 'ভালোবাসা' },
    { word: 'time', pattern: 'C-V-C-V', descEn: 'Continuous indefinite progress of existence', descBn: 'সময় / কাল' },
    { word: 'word', pattern: 'C-V-C-C', descEn: 'Single distinct meaningful element of speech', descBn: 'শব্দ' },
  ],
};

export const WordLengthInspector: React.FC<WordLengthInspectorProps> = ({
  sentence,
  setSentence,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'sentence-words' | 'catalog'>('sentence-words');
  const [lengthFilter, setLengthFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5+'>('all');
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  const encodeResult = encodeSentence(sentence, 'continuous');
  const { words } = encodeResult;

  const filteredWords = words.filter((w) => {
    if (lengthFilter === '1') return w.length === 1;
    if (lengthFilter === '2') return w.length === 2;
    if (lengthFilter === '3') return w.length === 3;
    if (lengthFilter === '4') return w.length === 4;
    if (lengthFilter === '5+') return w.length >= 5;
    return true;
  });

  const handlePlayWord = (wordAnalysis: WordAnalysis) => {
    const audioTokens = wordAnalysis.tokens.map((t) => ({
      frequencyHz: t.frequencyHz,
      type: t.type,
      code: t.code,
    }));
    audioSynth.playSequence(audioTokens, 1.2);
  };

  const handlePlayCatalogWord = (text: string) => {
    const enc = encodeSentence(text, 'continuous');
    if (enc.tokens.length > 0) {
      audioSynth.playSequence(enc.tokens, 1.2);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedWord(id);
    setTimeout(() => setCopiedWord(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === 'bn'
                ? 'শব্দ দৈর্ঘ্য বিভাজন ও বিশ্লেষণ (১, ২, ৩, ৪ অক্ষর)'
                : 'Word Length Architecture (1, 2, 3, 4+ Letters)'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {lang === 'bn'
                ? 'ইংরেজি ভাষায় কখনো ১টি অক্ষরে একটি শব্দ হয় (যেমন: I, a), কখনো ২টি অক্ষরে (in, to), কখনো ৩টি (the, cat), আবার কখনো ৪টি (book, code)। এখানে প্রতিটি দৈর্ঘ্যের শব্দের ভেতরের স্বরবর্ণ ও ব্যঞ্জনবর্ণের গাণিতিক রূপ দেখুন।'
                : 'In English, words can span 1 letter (I, A), 2 letters (in, to, on), 3 letters (the, cat), 4 letters (book, read, code), and beyond. Explore the structural vowel/consonant number patterns for each tier.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setActiveTab('sentence-words')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'sentence-words'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? 'বর্তমান বাক্যের শব্দ' : 'Words in Active Sentence'}
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'bn' ? '১–৪ অক্ষরের রেফারেন্স ক্যাটালগ' : '1–4 Letter Word Catalog'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'sentence-words' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">
                {lang === 'bn' ? 'দৈর্ঘ্য ফিল্টার:' : 'Filter by Length:'}
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'all', label: lang === 'bn' ? 'সকল শব্দ' : 'All Words', count: words.length },
                    { id: '1', label: '1 Letter', count: words.filter((w) => w.length === 1).length },
                    { id: '2', label: '2 Letters', count: words.filter((w) => w.length === 2).length },
                    { id: '3', label: '3 Letters', count: words.filter((w) => w.length === 3).length },
                    { id: '4', label: '4 Letters', count: words.filter((w) => w.length === 4).length },
                    { id: '5+', label: '5+ Letters', count: words.filter((w) => w.length >= 5).length },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setLengthFilter(f.id)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      lengthFilter === f.id
                        ? 'bg-emerald-600 text-white font-medium shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{f.label}</span>{' '}
                    <span className="opacity-70">({f.count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-slate-400 text-xs">
              {lang === 'bn' ? 'মোট শনাক্ত শব্দ:' : 'Detected Words:'} {filteredWords.length}
            </div>
          </div>

          {/* Words Grid */}
          {filteredWords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWords.map((w, index) => {
                const copyKey = `word-${index}-${w.cleanWord}`;
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                  >
                    {/* Word Title & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-white tracking-wide">
                          {w.cleanWord || w.word}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {w.length} {w.length === 1 ? 'letter' : 'letters'}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePlayWord(w)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                        title="Listen to word tones"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Letter-by-Letter Breakdown Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {w.tokens.map((tok, tIdx) => {
                        const isV = tok.type === 'vowel';
                        return (
                          <div
                            key={tIdx}
                            className={`px-2 py-1 rounded-md border flex flex-col items-center min-w-[34px] ${
                              isV
                                ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                                : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200'
                            }`}
                          >
                            <span className="text-xs font-bold leading-none">{tok.originalChar}</span>
                            <span className="text-[10px] font-mono leading-none mt-1 opacity-90 tabular-nums">
                              {tok.code}
                            </span>
                            <span className="text-[8px] tracking-tight uppercase opacity-60 mt-0.5">
                              {isV ? 'V' : 'C'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Numeric Code & Meta Details */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">
                          {lang === 'bn' ? 'সংখ্যাতাত্ত্বিক কোড:' : 'Numeric Cipher:'}
                        </div>
                        <div className="font-mono text-emerald-400 font-semibold tabular-nums">
                          {w.numericCode}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right text-[11px] text-slate-400">
                          <span className="text-amber-400 font-medium">{w.vowelCount}V</span> /{' '}
                          <span className="text-cyan-400 font-medium">{w.consonantCount}C</span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(w.numericCode, copyKey)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Copy word numbers"
                        >
                          {copiedWord === copyKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-xl">
              <p className="text-slate-400 text-sm">
                {lang === 'bn'
                  ? 'এই ফিল্টারে কোনো শব্দ পাওয়া যায়নি। উপরে অন্য ফিল্টার সিলেক্ট করুন।'
                  : 'No words match this filter length. Try selecting another filter above.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Catalog View: Reference of 1, 2, 3, 4 letter words */
        <div className="space-y-6">
          {/* Section 1: 1-Letter Words */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center font-mono">
                  1L
                </span>
                <h3 className="text-base font-bold text-white">
                  {lang === 'bn' ? '১ অক্ষরের ইংরেজি শব্দ (Single Letter Words)' : '1-Letter English Words'}
                </h3>
              </div>
              <span className="text-xs text-amber-400 font-medium">
                {lang === 'bn' ? 'বিশুদ্ধ স্বরবর্ণ (Pure Vowels)' : 'Formed by Pure Vowels'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'ইংরেজি ভাষায় একক অক্ষরের শব্দগুলো মূলত স্বরবর্ণ (যেমন: "I" এবং "A")। এদের সংখ্যা কোড সরাসরি স্বরবর্ণের কোড (I=১৩, A=১১) ধারণ করে।'
                : 'English single-letter words are almost exclusively vowels ("I" and "A"). Their cipher representation is a standalone 2-digit vowel code.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {COMMON_WORD_CATALOG.oneLetter.map((item) => {
                const enc = encodeSentence(item.word, 'continuous');
                return (
                  <div
                    key={item.word}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white font-mono">{item.word}</span>
                        <span className="text-xs font-mono text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                          Code: {enc.encodedString}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {lang === 'bn' ? item.descBn : item.descEn}
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlayCatalogWord(item.word)}
                      className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 transition-colors"
                      title="Play"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: 2-Letter Words */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center font-mono">
                  2L
                </span>
                <h3 className="text-base font-bold text-white">
                  {lang === 'bn' ? '২ অক্ষরের ইংরেজি শব্দ (Two-Letter Words)' : '2-Letter English Words'}
                </h3>
              </div>
              <span className="text-xs text-cyan-400 font-medium">
                {lang === 'bn' ? 'স্বরবর্ণ + ব্যঞ্জনবর্ণ যুগল (V+C / C+V)' : 'Vowel + Consonant Pairs'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? '২ অক্ষরের শব্দগুলো সাধারণত একটি স্বরবর্ণ এবং একটি ব্যঞ্জনবর্ণের মিশ্রণে গঠিত (যেমন: V-C: "in", "on", "at" অথবা C-V: "to", "he", "go")।'
                : '2-letter words universally pair a vowel and a consonant (e.g. V-C: "in", "on", "at" or C-V: "to", "he", "we").'}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
              {COMMON_WORD_CATALOG.twoLetter.map((item) => {
                const enc = encodeSentence(item.word, 'continuous');
                return (
                  <div
                    key={item.word}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white font-mono">{item.word}</span>
                      <button
                        onClick={() => handlePlayCatalogWord(item.word)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Play"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="my-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-400 tabular-nums">
                        {enc.encodedString}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                        {item.pattern}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 truncate">
                      {lang === 'bn' ? item.descBn : item.descEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: 3-Letter Words */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center font-mono">
                  3L
                </span>
                <h3 className="text-base font-bold text-white">
                  {lang === 'bn' ? '৩ অক্ষরের ইংরেজি শব্দ (Three-Letter Words)' : '3-Letter English Words'}
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-medium">
                {lang === 'bn' ? 'C-V-C ট্রাইকোড প্যাটার্ন' : 'C-V-C Tri-Codes'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {COMMON_WORD_CATALOG.threeLetter.map((item) => {
                const enc = encodeSentence(item.word, 'continuous');
                return (
                  <div
                    key={item.word}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white font-mono">{item.word}</span>
                      <button
                        onClick={() => handlePlayCatalogWord(item.word)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Play"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="my-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                        {enc.encodedString}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                        {item.pattern}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 truncate">
                      {lang === 'bn' ? item.descBn : item.descEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: 4-Letter Words */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center font-mono">
                  4L
                </span>
                <h3 className="text-base font-bold text-white">
                  {lang === 'bn' ? '৪ অক্ষরের ইংরেজি শব্দ (Four-Letter Words)' : '4-Letter English Words'}
                </h3>
              </div>
              <span className="text-xs text-purple-400 font-medium">
                {lang === 'bn' ? 'C-V-V-C / C-V-C-V টেট্রা-কোড' : 'C-V-V-C / C-V-C-V Tetra-Codes'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
              {COMMON_WORD_CATALOG.fourLetter.map((item) => {
                const enc = encodeSentence(item.word, 'continuous');
                return (
                  <div
                    key={item.word}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white font-mono">{item.word}</span>
                      <button
                        onClick={() => handlePlayCatalogWord(item.word)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Play"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="my-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 tabular-nums">
                        {enc.encodedString}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                        {item.pattern}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 truncate">
                      {lang === 'bn' ? item.descBn : item.descEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
