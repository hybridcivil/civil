/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Play,
  Square,
  ArrowRight,
  Download,
  RotateCcw,
  Sparkles,
  Volume2,
  Info,
  Sliders,
} from 'lucide-react';
import {
  encodeSentence,
  PRESET_SENTENCES,
  CipherFormat,
  EncodedToken,
} from '../lib/cipherEngine.ts';
import { audioSynth } from '../lib/audioSynth.ts';

interface EncoderSectionProps {
  sentence: string;
  setSentence: (s: string) => void;
  onSendToDecoder: (numericCode: string) => void;
  onExploreWords: () => void;
  lang: 'en' | 'bn';
}

export const EncoderSection: React.FC<EncoderSectionProps> = ({
  sentence,
  setSentence,
  onSendToDecoder,
  onExploreWords,
  lang,
}) => {
  const [format, setFormat] = useState<CipherFormat>('continuous');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePlaybackIndex, setActivePlaybackIndex] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedToken, setSelectedToken] = useState<EncodedToken | null>(null);

  const encodeResult = encodeSentence(sentence, format);
  const { tokens, encodedString, words, vowelTotal, consonantTotal } = encodeResult;

  // Words breakdown by length
  const oneLetterWords = words.filter((w) => w.length === 1);
  const twoLetterWords = words.filter((w) => w.length === 2);
  const threeLetterWords = words.filter((w) => w.length === 3);
  const fourLetterWords = words.filter((w) => w.length === 4);
  const fivePlusLetterWords = words.filter((w) => w.length >= 5);

  const handleCopy = () => {
    if (!encodedString) return;
    navigator.clipboard.writeText(encodedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!encodedString) return;
    const blob = new Blob(
      [
        `NumVocalis Cipher Output\n`,
        `Original Sentence: ${sentence}\n`,
        `Format: ${format}\n`,
        `Encoded Numbers:\n${encodedString}\n\n`,
        `--- Statistical Breakdown ---\n`,
        `Total Vowels: ${vowelTotal} (Codes 11-15)\n`,
        `Total Consonants: ${consonantTotal} (Codes 21-41)\n`,
        `Word Counts:\n`,
        `1-letter words: ${oneLetterWords.map((w) => w.cleanWord).join(', ') || 'None'}\n`,
        `2-letter words: ${twoLetterWords.map((w) => w.cleanWord).join(', ') || 'None'}\n`,
        `3-letter words: ${threeLetterWords.map((w) => w.cleanWord).join(', ') || 'None'}\n`,
        `4-letter words: ${fourLetterWords.map((w) => w.cleanWord).join(', ') || 'None'}\n`,
        `5+ letter words: ${fivePlusLetterWords.map((w) => w.cleanWord).join(', ') || 'None'}\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numvocalis-encoded-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
      audioSynth.stop();
      setIsPlayingAudio(false);
      setActivePlaybackIndex(-1);
      return;
    }

    if (tokens.length === 0) return;

    setIsPlayingAudio(true);
    await audioSynth.playSequence(
      tokens,
      playbackSpeed,
      (idx) => setActivePlaybackIndex(idx),
      () => {
        setIsPlayingAudio(false);
        setActivePlaybackIndex(-1);
      }
    );
  };

  useEffect(() => {
    return () => {
      audioSynth.stop();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === 'bn'
                ? 'বাক্যকে শুধুমাত্র সংখ্যায় রূপান্তর করুন'
                : 'Sentence to Pure Numerical Cipher'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              {lang === 'bn'
                ? 'প্রতিটি ইংরেজি অক্ষরের আলাদা সংখ্যা রয়েছে। স্বরবর্ণ (Vowel: ১১-১৫) এবং ব্যঞ্জনবর্ণ (Consonant: ২১-৪১) এর মাঝে সুস্পষ্ট গাণিতিক বৈচিত্র্য রয়েছে। ১, ২, ৩ ও ৪ অক্ষরের শব্দসমূহ নিখুঁতভাবে শনাক্ত হয়।'
                : 'Every English letter maps to a precise numeric token with distinct mathematical variation between Vowels (11-15) and Consonants (21-41). Seamlessly separates 1, 2, 3, and 4-letter word structures.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span className="text-slate-300 font-medium">{lang === 'bn' ? 'স্বরবর্ণ (Vowel: ১১–১৫)' : 'Vowels (11–15)'}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
              <span className="text-slate-300 font-medium">{lang === 'bn' ? 'ব্যঞ্জনবর্ণ (Consonant: ২১–৪১)' : 'Consonants (21–41)'}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
              <span className="text-slate-400 font-medium">{lang === 'bn' ? 'শব্দ ফাঁক (০০)' : 'Space (00)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium text-slate-300">
            {lang === 'bn' ? '১, ২, ৩, ৪ অক্ষরের নমুনা বাক্য নির্বাচন করুন:' : 'Quick Presets with 1, 2, 3, 4-letter words:'}
          </span>
          <span className="hidden sm:inline">
            {lang === 'bn' ? 'ক্লিক করে সরাসরি টেস্ট করুন' : 'Click to load into editor'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_SENTENCES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setSentence(preset.sentence);
                audioSynth.stop();
                setIsPlayingAudio(false);
              }}
              className={`p-2.5 text-left rounded-lg border transition-all ${
                sentence === preset.sentence
                  ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-xs font-semibold text-white truncate">
                {lang === 'bn' ? preset.banglaTitle : preset.title}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                "{preset.sentence}"
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input Sentence Area */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>{lang === 'bn' ? 'ইংরেজি বাক্য লিখুন' : 'Input English Sentence'}</span>
          </label>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{sentence.length} {lang === 'bn' ? 'অক্ষর' : 'chars'}</span>
            <span aria-hidden="true">·</span>
            <span>{words.length} {lang === 'bn' ? 'শব্দ' : 'words'}</span>
            {sentence && (
              <button
                onClick={() => setSentence('')}
                className="text-slate-400 hover:text-rose-400 transition-colors ml-2"
                title="Clear input"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <textarea
          value={sentence}
          onChange={(e) => {
            setSentence(e.target.value);
            if (isPlayingAudio) {
              audioSynth.stop();
              setIsPlayingAudio(false);
            }
          }}
          placeholder={lang === 'bn' ? 'এখানে যেকোনো ইংরেজি বাক্য লিখুন (যেমন: I am in a room with four blue cups)...' : 'Type or paste any English sentence here...'}
          rows={3}
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg p-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-sans"
        />

        {/* Word Length Mini Summary Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400">
            {lang === 'bn' ? 'শব্দ দৈর্ঘ্য বিভাজন:' : 'Word lengths:'}
          </span>
          <span className="text-slate-300 font-mono">
            1L: <strong className="text-amber-400">{oneLetterWords.length}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono">
            2L: <strong className="text-cyan-400">{twoLetterWords.length}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono">
            3L: <strong className="text-emerald-400">{threeLetterWords.length}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono">
            4L: <strong className="text-purple-400">{fourLetterWords.length}</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300 font-mono">
            5+L: <strong className="text-slate-400">{fivePlusLetterWords.length}</strong>
          </span>

          <button
            onClick={onExploreWords}
            className="ml-auto text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium"
          >
            <span>{lang === 'bn' ? 'শব্দসমূহ বিস্তারিত দেখুন' : 'Explore Words Detail'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Output Cipher Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Output Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>{lang === 'bn' ? 'উৎপন্ন সংখ্যা মালা (Encoded Numbers)' : 'Generated Number Sequence'}</span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{tokens.length} {lang === 'bn' ? 'টি সংখ্যা টোকেন' : 'numeric tokens'}</span>
              <span>·</span>
              <span className="text-amber-400 font-medium">{vowelTotal} {lang === 'bn' ? 'স্বরবর্ণ' : 'vowels'}</span>
              <span>·</span>
              <span className="text-cyan-400 font-medium">{consonantTotal} {lang === 'bn' ? 'ব্যঞ্জনবর্ণ' : 'consonants'}</span>
            </div>
          </div>

          {/* Format selector tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto text-xs">
            <button
              onClick={() => setFormat('continuous')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                format === 'continuous'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Single continuous digit stream"
            >
              {lang === 'bn' ? 'অবিচ্ছিন্ন (Continuous)' : 'Continuous'}
            </button>
            <button
              onClick={() => setFormat('spaced')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                format === 'spaced'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Space-separated tokens"
            >
              {lang === 'bn' ? 'ফাঁকা সহ (Spaced)' : 'Spaced'}
            </button>
            <button
              onClick={() => setFormat('word-bracketed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                format === 'word-bracketed'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grouped by word length"
            >
              {lang === 'bn' ? 'শব্দ দৈর্ঘ্য (Bracketed)' : 'Word Groups'}
            </button>
          </div>
        </div>

        {/* Encoded Number Display Box */}
        <div className="relative group">
          <div className="w-full min-h-[90px] max-h-[160px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-3 sm:p-4 text-emerald-400 font-mono text-sm sm:text-base leading-relaxed break-all select-all tabular-nums">
            {encodedString ? (
              encodedString
            ) : (
              <span className="text-slate-600 font-sans text-sm italic">
                {lang === 'bn' ? 'উপরে একটি বাক্য লিখুন...' : 'Enter a sentence above to see the numerical cipher...'}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Audio Synthesizer Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAudio}
              disabled={tokens.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isPlayingAudio
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'bn' ? 'সাউন্ড বন্ধ করুন' : 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'bn' ? 'শব্দমালা শুনুন (Play Synth)' : 'Listen Audio Synth'}</span>
                </>
              )}
            </button>

            {/* Speed toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-400">
              {[0.75, 1, 1.5, 2].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setPlaybackSpeed(sp)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    playbackSpeed === sp ? 'bg-slate-800 text-white font-medium' : 'hover:text-slate-200'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons (Copy, Send to Decoder, Download) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!encodedString}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors disabled:opacity-40"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'কপি করুন' : 'Copy'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={!encodedString}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors disabled:opacity-40"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
            </button>

            <button
              onClick={() => onSendToDecoder(encodedString)}
              disabled={!encodedString}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-xs disabled:opacity-40"
            >
              <span>{lang === 'bn' ? 'ডিকোডারে পাঠান' : 'Send to Decoder'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Token Flow Chain */}
      {tokens.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {lang === 'bn' ? 'বর্ণ থেকে সংখ্যা বিশ্লেষণ প্রবাহ' : 'Interactive Letter-to-Number Stream'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'প্রতিটি টোকেনের উপর মাউস রেখে বা ক্লিক করে তার ফ্রিকোয়েন্সি ও বৈচিত্র্য দেখুন।'
                  : 'Click or hover any token to inspect its harmonic tier, sound frequency, and type.'}
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span className="text-amber-400">● {lang === 'bn' ? 'স্বরবর্ণ (১১-১৫)' : 'Vowel (11-15)'}</span>
              <span className="text-cyan-400">● {lang === 'bn' ? 'ব্যঞ্জনবর্ণ (২১-৪১)' : 'Consonant (21-41)'}</span>
              <span className="text-slate-400">● {lang === 'bn' ? 'ফাঁকা (০০)' : 'Space (00)'}</span>
            </div>
          </div>

          {/* Tokens container */}
          <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
            {tokens.map((tok, index) => {
              const isActive = activePlaybackIndex === index;
              const isSelected = selectedToken?.indexInSentence === tok.indexInSentence && selectedToken?.code === tok.code;

              let colorClasses = 'border-slate-800 bg-slate-900/60 text-slate-300';
              if (tok.type === 'vowel') {
                colorClasses = 'border-amber-500/40 bg-amber-950/30 text-amber-200 hover:border-amber-400';
              } else if (tok.type === 'consonant') {
                colorClasses = 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200 hover:border-cyan-400';
              } else if (tok.type === 'separator') {
                colorClasses = 'border-slate-700/40 bg-slate-900/80 text-slate-400 hover:border-slate-500';
              }

              return (
                <button
                  key={`${index}-${tok.code}`}
                  onClick={() => {
                    setSelectedToken(tok);
                    audioSynth.playTone(tok.frequencyHz, tok.type, 220);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[38px] px-2 py-1.5 rounded-md border text-center transition-all cursor-pointer ${colorClasses} ${
                    isActive ? 'scale-110 ring-2 ring-emerald-400 z-10 brightness-125' : ''
                  } ${isSelected ? 'ring-1 ring-white' : ''}`}
                >
                  <span className="text-xs font-bold leading-none">
                    {tok.originalChar === ' ' ? '␣' : tok.originalChar}
                  </span>
                  <span className="text-[11px] font-mono leading-none mt-1 opacity-90 tabular-nums">
                    {tok.code}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Token Inspector Details */}
          {selectedToken && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center font-mono">
                  <span className="text-white font-bold leading-none">{selectedToken.originalChar === ' ' ? '␣' : selectedToken.originalChar}</span>
                  <span className="text-[10px] text-emerald-400 leading-none mt-0.5">{selectedToken.code}</span>
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {selectedToken.type === 'vowel' && (lang === 'bn' ? 'স্বরবর্ণ (Vowel) - টিয়ার ১ হারমোনিক' : 'Vowel - Tier 1 Harmonic Resonator')}
                    {selectedToken.type === 'consonant' && (lang === 'bn' ? 'ব্যঞ্জনবর্ণ (Consonant) - টিয়ার ২ স্ট্রাকচারাল' : 'Consonant - Tier 2 Structural Consonant')}
                    {selectedToken.type === 'separator' && (lang === 'bn' ? 'শব্দ বিভাজক (Word Boundary / Space)' : 'Word Separator / Space Boundary')}
                    {selectedToken.type === 'punctuation' && (lang === 'bn' ? 'বিরামচিহ্ন (Punctuation Token)' : 'Punctuation Token')}
                  </div>
                  <div className="text-slate-400">
                    {lang === 'bn' ? 'শব্দ তরঙ্গ (Acoustic Frequency):' : 'Sound Frequency:'} {selectedToken.frequencyHz.toFixed(1)} Hz
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => audioSynth.playTone(selectedToken.frequencyHz, selectedToken.type, 300)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 font-medium"
                >
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>{lang === 'bn' ? 'টোন বাজান' : 'Play Tone'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
