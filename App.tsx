
import React, { useState, useCallback } from 'react';
import { translateBurmeseToEnglish } from './services/geminiService';
import { Header } from './components/Header';
import { LanguagePanel } from './components/LanguagePanel';
import { TranslateButton } from './components/TranslateButton';
import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [burmeseText, setBurmeseText] = useState<string>('');
  const [englishText, setEnglishText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = useCallback(async () => {
    if (!burmeseText.trim()) {
      setError('Please enter some Burmese text to translate.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEnglishText('');

    try {
      const translation = await translateBurmeseToEnglish(burmeseText);
      setEnglishText(translation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Translation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [burmeseText]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <Header />
        <main className="mt-8 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LanguagePanel
              title="Burmese"
              value={burmeseText}
              onChange={(e) => setBurmeseText(e.target.value)}
              placeholder="သင်ဘာသာပြန်လိုသောစာသားကိုဤနေရာတွင်ရိုက်ထည့်ပါ..."
              readOnly={isLoading}
            />
            <div className="relative">
              <LanguagePanel
                title="English"
                value={englishText}
                readOnly={true}
                placeholder="Translation will appear here..."
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <TranslateButton onClick={handleTranslate} isLoading={isLoading} />
            {error && <ErrorDisplay message={error} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
