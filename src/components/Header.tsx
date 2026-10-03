/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Binary, Volume2, BookOpen, Sparkles, Languages } from 'lucide-react';

interface HeaderProps {
  activeTab: 'encoder' | 'decoder' | 'words' | 'matrix';
  setActiveTab: (tab: 'encoder' | 'decoder' | 'words' | 'matrix') => void;
  lang: 'en' | 'bn';
  setLang: (lang: 'en' | 'bn') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Binary className="w-4 h-4" />
          </div>
          <button 
            onClick={() => setActiveTab('encoder')}
            className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors text-left"
          >
            NumVocalis
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('encoder')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'encoder'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {lang === 'bn' ? 'বাক্য থেকে নম্বর (Encoder)' : 'Sentence to Numbers'}
          </button>

          <button
            onClick={() => setActiveTab('decoder')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'decoder'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {lang === 'bn' ? 'নম্বর থেকে বাক্য (Decoder)' : 'Numbers to Sentence'}
          </button>

          <button
            onClick={() => setActiveTab('words')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'words'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {lang === 'bn' ? 'শব্দ দৈর্ঘ্য (১, ২, ৩, ৪ অক্ষর)' : 'Word Lengths (1–4L)'}
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {lang === 'bn' ? 'সাইফার চার্ট (A-Z)' : 'Cipher Matrix'}
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-600 transition-colors whitespace-nowrap"
            title="Toggle Language / ভাষা পরিবর্তন"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-950 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('encoder')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'encoder' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400'
          }`}
        >
          {lang === 'bn' ? 'এনকোডার' : 'Encode'}
        </button>
        <button
          onClick={() => setActiveTab('decoder')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'decoder' ? 'bg-slate-800 text-cyan-400 font-medium' : 'text-slate-400'
          }`}
        >
          {lang === 'bn' ? 'ডিকোডার' : 'Decode'}
        </button>
        <button
          onClick={() => setActiveTab('words')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'words' ? 'bg-slate-800 text-amber-400 font-medium' : 'text-slate-400'
          }`}
        >
          {lang === 'bn' ? '১–৪ অক্ষর' : '1–4 Letters'}
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
            activeTab === 'matrix' ? 'bg-slate-800 text-rose-400 font-medium' : 'text-slate-400'
          }`}
        >
          {lang === 'bn' ? 'চার্ট' : 'Matrix'}
        </button>
      </div>
    </header>
  );
};
