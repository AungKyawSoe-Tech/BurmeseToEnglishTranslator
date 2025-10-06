import React from 'react';

const LanguageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13l4-16M11 11h10M13 13L11 21M17 11h2m-1 8h-6a2 2 0 01-2-2v-4a2 2 0 012-2h2.5" />
  </svg>
);

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <p className="text-base text-slate-500 dark:text-slate-400 mb-2 font-mono">
        Aung Kyaw Soe vibe coded using Google AI Studio
      </p>
      <div className="flex justify-center items-center gap-4">
        <LanguageIcon />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Burmese &lt;&gt; English Translator
        </h1>
      </div>
      <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Instantly translate between Burmese and English. Use your voice or keyboard, and listen to the translation.
      </p>
    </header>
  );
};