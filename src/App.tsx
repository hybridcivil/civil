/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { EncoderSection } from './components/EncoderSection.tsx';
import { DecoderSection } from './components/DecoderSection.tsx';
import { WordLengthInspector } from './components/WordLengthInspector.tsx';
import { AlphabetMatrix } from './components/AlphabetMatrix.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'encoder' | 'decoder' | 'words' | 'matrix'>('encoder');
  const [lang, setLang] = useState<'en' | 'bn'>('bn'); // Default to Bengali as requested by user!
  const [sentence, setSentence] = useState('I am in a room with four blue cups.');
  const [decoderInitialCode, setDecoderInitialCode] = useState('');

  const handleSendToDecoder = (numericCode: string) => {
    setDecoderInitialCode(numericCode);
    setActiveTab('decoder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreWords = () => {
    setActiveTab('words');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'encoder' && (
          <EncoderSection
            sentence={sentence}
            setSentence={setSentence}
            onSendToDecoder={handleSendToDecoder}
            onExploreWords={handleExploreWords}
            lang={lang}
          />
        )}

        {activeTab === 'decoder' && (
          <DecoderSection
            initialCode={decoderInitialCode}
            lang={lang}
          />
        )}

        {activeTab === 'words' && (
          <WordLengthInspector
            sentence={sentence}
            setSentence={setSentence}
            lang={lang}
          />
        )}

        {activeTab === 'matrix' && (
          <AlphabetMatrix lang={lang} />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-500 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">NumVocalis</span>
            <span aria-hidden="true">·</span>
            <span>
              {lang === 'bn'
                ? 'সংখ্যাভিত্তিক বাক্য এনকোডার ও ডিকোডার'
                : 'Numerical Sentence Cipher & Harmonic Decoder'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{lang === 'bn' ? 'স্বরবর্ণ (১১–১৫)' : 'Vowels (11–15)'}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'bn' ? 'ব্যঞ্জনবর্ণ (২১–৪১)' : 'Consonants (21–41)'}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'bn' ? '১, ২, ৩, ৪ অক্ষরের শব্দ মডেল' : '1, 2, 3, 4-Letter Models'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
