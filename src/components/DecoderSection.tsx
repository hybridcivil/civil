/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Volume2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  decodeNumberString,
  CODE_TO_CHAR,
  PRESET_SENTENCES,
  encodeSentence,
} from '../lib/cipherEngine.ts';
import { audioSynth } from '../lib/audioSynth.ts';

interface DecoderSectionProps {
  initialCode?: string;
  lang: 'en' | 'bn';
}

export const DecoderSection: React.FC<DecoderSectionProps> = ({
  initialCode = '',
  lang,
}) => {
  const [inputCode, setInputCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number>(-1);
  const [filterType, setFilterType] = useState<'all' | 'vowels' | 'consonants'>('all');

  // Sync if initialCode changes
  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
    }
  }, [initialCode]);

  const decodeResult = decodeNumberString(inputCode);
  const { sentence, tokens, success, totalTokens, validTokens, invalidCount, detectedWordCount } =
    decodeResult;

  const handleCopy = () => {
    if (!sentence) return;
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
      audioSynth.stop();
      setIsPlayingAudio(false);
      setActivePlaybackIndex(-1);
      return;
    }

    // Build audio tokens from valid decoded steps
    const audioTokens = tokens
      .filter((t) => t.isValid)
      .map((t) => {
        const meta = CODE_TO_CHAR[t.tokenCode];
        return {
          frequencyHz: meta ? meta.hz : 300,
          type: t.type,
          code: t.tokenCode,
        };
      });

    if (audioTokens.length === 0) return;

    setIsPlayingAudio(true);
    await audioSynth.playSequence(
      audioTokens,
      1,
      (idx) => setActivePlaybackIndex(idx),
      () => {
        setIsPlayingAudio(false);
        setActivePlaybackIndex(-1);
      }
    );
  };

  const loadSample = (presetIndex: number) => {
    const preset = PRESET_SENTENCES[presetIndex];
    if (preset) {
      const enc = encodeSentence(preset.sentence, 'continuous');
      setInputCode(enc.encodedString);
    }
  };

  const filteredTokens = tokens.filter((tok) => {
    if (filterType === 'vowels') return tok.type === 'vowel';
    if (filterType === 'consonants') return tok.type === 'consonant';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === 'bn'
                ? 'সংখ্যা থেকে বাক্য উদ্ধার করুন (Decoder)'
                : 'Numbers to Sentence Reconstruction'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {lang === 'bn'
                ? 'যেকোনো সংখ্যা মালা (ধারাবাহিক কিংবা স্পেস দেওয়া) পেস্ট করুন। অ্যালগরিদম স্বরবর্ণ (১১-১৫) ও ব্যঞ্জনবর্ণ (২১-৪১) শনাক্ত করে মূল ইংরেজি বাক্য বের করবে।'
                : 'Paste any continuous or spaced numeric cipher stream. The decoder isolates vowels (11-15), consonants (21-41), and word delimiters (00) to reconstruct the original English prose.'}
            </p>
          </div>

          {/* Quick preset loaders */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto shrink-0">
            <span className="text-xs text-slate-400 mr-1">{lang === 'bn' ? 'নমুনা:' : 'Sample:'}</span>
            <button
              onClick={() => loadSample(0)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {lang === 'bn' ? 'নমুনা ১ (১-৪L)' : 'Sample 1 (1–4L)'}
            </button>
            <button
              onClick={() => loadSample(1)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {lang === 'bn' ? 'নমুনা ২ (বই)' : 'Sample 2 (Book)'}
            </button>
            <button
              onClick={() => loadSample(2)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {lang === 'bn' ? 'নমুনা ৩ (বিড়াল)' : 'Sample 3 (Cat)'}
            </button>
          </div>
        </div>
      </div>

      {/* Input Number Stream Area */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>{lang === 'bn' ? 'ইনপুট সংখ্যা মালা (Numeric Input Stream)' : 'Input Numeric Stream'}</span>
          </label>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{totalTokens} {lang === 'bn' ? 'টোকেন' : 'tokens'}</span>
            <span aria-hidden="true">·</span>
            <span>{validTokens} {lang === 'bn' ? 'সঠিক' : 'valid'}</span>
            {inputCode && (
              <button
                onClick={() => setInputCode('')}
                className="text-slate-400 hover:text-rose-400 transition-colors ml-2"
                title="Clear input"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder={lang === 'bn' ? 'যেমন: 13003412112300110021141428001331... (ধারাবাহিক সংখ্যা পেস্ট করুন)' : 'Paste numbers here, e.g., 13003412112300110021141428001331...'}
          rows={3}
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-3 text-cyan-300 placeholder-slate-600 text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all tabular-nums"
        />

        {/* Validation Status Notification */}
        {inputCode.trim() && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              {invalidCount === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সকল সংখ্যা টোকেন বৈধ এবং সফলভাবে ডিকোড হয়েছে' : 'All tokens parsed successfully'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn'
                      ? `${invalidCount} টি অজানা টোকেন পাওয়া গেছে`
                      : `${invalidCount} unrecognized token(s) detected`}
                  </span>
                </div>
              )}
            </div>

            <div className="text-slate-400 text-xs">
              {detectedWordCount} {lang === 'bn' ? 'টি শব্দ পাওয়া গেছে' : 'words reconstructed'}
            </div>
          </div>
        )}
      </div>

      {/* Reconstructed Sentence Output */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">
              {lang === 'bn' ? 'উদ্ধারকৃত আসল বাক্য (Reconstructed English Sentence)' : 'Reconstructed English Sentence'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{sentence.length} {lang === 'bn' ? 'অক্ষর' : 'characters'}</span>
              <span>·</span>
              <span>{detectedWordCount} {lang === 'bn' ? 'শব্দ' : 'words'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAudio}
              disabled={tokens.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isPlayingAudio
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'bn' ? 'থামুন' : 'Stop'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'bn' ? 'সাউন্ড বাজান' : 'Play Audio'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              disabled={!sentence}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs disabled:opacity-40"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বাক্য কপি করুন' : 'Copy Sentence'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="min-h-[80px] bg-slate-950 border border-slate-800 rounded-lg p-4 sm:p-5 flex items-center">
          {sentence ? (
            <p className="text-lg sm:text-xl font-medium text-white tracking-wide leading-relaxed select-all">
              {sentence}
            </p>
          ) : (
            <span className="text-slate-600 text-sm italic">
              {lang === 'bn'
                ? 'উপরে সংখ্যা লিখলে এখানে মূল বাক্যটি ফুটে উঠবে...'
                : 'Decoded text will appear here once numbers are provided above...'}
            </span>
          )}
        </div>
      </div>

      {/* Step-by-Step Ledger Trace */}
      {tokens.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {lang === 'bn' ? 'টোকেন রূপান্তর খতিয়ান (Step-by-Step Decoding Ledger)' : 'Step-by-Step Decoding Ledger'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'প্রতিটি সংখ্যা কোড কিভাবে স্বরবর্ণ, ব্যঞ্জনবর্ণ অথবা স্পেসে পরিণত হয়েছে তা দেখুন।'
                  : 'Examine exactly how each numeric token maps to its corresponding vowel, consonant, or delimiter.'}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'bn' ? 'সব' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('vowels')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'vowels'
                    ? 'bg-slate-800 text-amber-300 font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'bn' ? 'স্বরবর্ণ (Vowels)' : 'Vowels'}
              </button>
              <button
                onClick={() => setFilterType('consonants')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'consonants'
                    ? 'bg-slate-800 text-cyan-300 font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'bn' ? 'ব্যঞ্জনবর্ণ (Consonants)' : 'Consonants'}
              </button>
            </div>
          </div>

          {/* Tokens Ledger Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[360px] overflow-y-auto p-1">
            {filteredTokens.map((step, idx) => {
              const isActive = activePlaybackIndex === idx;

              let borderBg = 'border-slate-800 bg-slate-950';
              let badgeColor = 'text-slate-400';
              let typeLabel = lang === 'bn' ? 'অন্যান্য' : 'Other';

              if (step.type === 'vowel') {
                borderBg = 'border-amber-500/30 bg-amber-950/20';
                badgeColor = 'text-amber-300';
                typeLabel = lang === 'bn' ? 'স্বরবর্ণ (Vowel)' : 'Vowel';
              } else if (step.type === 'consonant') {
                borderBg = 'border-cyan-500/30 bg-cyan-950/20';
                badgeColor = 'text-cyan-300';
                typeLabel = lang === 'bn' ? 'ব্যঞ্জনবর্ণ (Consonant)' : 'Consonant';
              } else if (step.type === 'separator') {
                borderBg = 'border-slate-800 bg-slate-900/60';
                badgeColor = 'text-slate-400';
                typeLabel = lang === 'bn' ? 'শব্দ ফাঁক (Space)' : 'Space';
              } else if (!step.isValid) {
                borderBg = 'border-rose-500/50 bg-rose-950/20';
                badgeColor = 'text-rose-400';
                typeLabel = lang === 'bn' ? 'অজানা (Invalid)' : 'Invalid';
              }

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${borderBg} ${
                    isActive ? 'scale-105 ring-2 ring-emerald-400 z-10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/60 tabular-nums">
                      {step.tokenCode}
                    </span>
                    <span className={`text-[10px] font-medium ${badgeColor}`}>
                      {typeLabel}
                    </span>
                  </div>

                  <div className="my-2 flex items-center justify-center">
                    <span className="text-xl font-bold text-white font-mono">
                      {step.decodedChar === ' ' ? '␣' : step.decodedChar || '—'}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 text-center truncate">
                    {step.isValid ? (
                      lang === 'bn' ? 'সঠিক কোড' : 'Valid Token'
                    ) : (
                      <span className="text-rose-400">{lang === 'bn' ? 'ত্রুটি' : 'Error'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
