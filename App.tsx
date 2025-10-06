import React, { useState, useCallback, useEffect, useRef } from 'react';
import { translateBurmeseToEnglish, translateEnglishToBurmese } from './services/geminiService';
import { Header } from './components/Header';
import { LanguagePanel } from './components/LanguagePanel';
import { TranslateButton } from './components/TranslateButton';
import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HistoryPanel } from './components/HistoryPanel';
import { XCircleIcon } from './components/icons';

type Language = 'burmese' | 'english';

export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLang: Language;
}

// FIX: Cast window to `any` to access vendor-prefixed SpeechRecognition API which may not be in default TS DOM types.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

// FIX: Define interfaces for SpeechRecognition events to provide type safety
// without relying on global types that may not be available in the project's tsconfig.
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}


function App() {
  const [burmeseText, setBurmeseText] = useState<string>('');
  const [englishText, setEnglishText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<Language>('burmese');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingLanguage, setRecordingLanguage] = useState<Language | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('translationHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);


  // Load voices for text-to-speech
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return;
    }
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    // The 'voiceschanged' event fires when the voice list is ready.
    window.speechSynthesis.onvoiceschanged = loadVoices;
    // Initial load, which might be empty on some browsers.
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // FIX: Use a detailed inline type for the recognition object ref.
  // This avoids using `SpeechRecognition` as a type, which causes a name collision
  // with the constant defined above, and provides type safety for its usage.
  const recognitionRef = useRef<{
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  } | null>(null);

  const handleTranslate = useCallback(async (textToTranslate?: string) => {
    const isBurmeseSource = sourceLanguage === 'burmese';
    const sourceText = textToTranslate ?? (isBurmeseSource ? burmeseText : englishText);

    if (!sourceText.trim()) {
      setError(`Please enter or speak some ${isBurmeseSource ? 'Burmese' : 'English'} text to translate.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    if (isBurmeseSource) {
      setEnglishText('');
    } else {
      setBurmeseText('');
    }

    try {
      const translation = isBurmeseSource
        ? await translateBurmeseToEnglish(sourceText)
        : await translateEnglishToBurmese(sourceText);
      
      if (isBurmeseSource) {
        setEnglishText(translation);
      } else {
        setBurmeseText(translation);
      }
      
      const newHistoryItem: TranslationHistoryItem = {
        id: new Date().toISOString() + Math.random(),
        timestamp: Date.now(),
        sourceText: sourceText,
        translatedText: translation,
        sourceLang: sourceLanguage,
      };

      setHistory(prevHistory => {
        if (prevHistory.length > 0 && prevHistory[0].sourceText === newHistoryItem.sourceText) {
            return prevHistory;
        }
        const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, 50); // Keep latest 50
        localStorage.setItem('translationHistory', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Translation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [burmeseText, englishText, sourceLanguage]);

  useEffect(() => {
    if (!isSpeechRecognitionSupported) {
      setError("Speech recognition is not supported in your browser. Please try Chrome or Safari.");
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (recordingLanguage === 'burmese') {
        setBurmeseText(transcript);
        setSourceLanguage('burmese');
      } else if (recordingLanguage === 'english') {
        setEnglishText(transcript);
        setSourceLanguage('english');
      }
    };
    
    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
      setRecordingLanguage(null);
    };

    recognition.onend = () => {
        setIsRecording(false);
        setRecordingLanguage(null);
        // Automatically translate after speech ends
        setTimeout(() => handleTranslate(), 100);
    };

    return () => {
        recognition.stop();
    }
  }, [handleTranslate, recordingLanguage]);

  const handleRecord = (lang: Language) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      const langCode = lang === 'burmese' ? 'my-MM' : 'en-US';
      recognition.lang = langCode;
      setIsRecording(true);
      setRecordingLanguage(lang);
      recognition.start();
    }
  };

  const handleSpeak = (text: string, lang: Language) => {
    if (!text.trim() || !('speechSynthesis' in window)) {
        return;
    }
    // Stop any currently speaking utterance
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = lang === 'burmese' ? 'my-MM' : 'en-US';
    utterance.lang = langCode;
    
    // Find a matching voice from the state, which is populated by the useEffect hook
    let voice = voices.find(v => v.lang === langCode);
    
    // If no perfect match, try a language-only match (e.g., 'en-GB' for 'en-US')
    if (!voice) {
        const langPrefix = lang === 'burmese' ? 'my' : 'en';
        voice = voices.find(v => v.lang.startsWith(langPrefix));
    }

    if (voice) {
        utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }

  const handleBurmeseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBurmeseText(e.target.value);
    setSourceLanguage('burmese');
  };

  const handleEnglishChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEnglishText(e.target.value);
    setSourceLanguage('english');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translationHistory');
  };

  const handleUseHistoryItem = (item: TranslationHistoryItem) => {
    if (item.sourceLang === 'burmese') {
      setBurmeseText(item.sourceText);
      setEnglishText(item.translatedText);
      setSourceLanguage('burmese');
    } else {
      setEnglishText(item.sourceText);
      setBurmeseText(item.translatedText);
      setSourceLanguage('english');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearText = () => {
    setBurmeseText('');
    setEnglishText('');
    setError(null);
  };

  const canClear = burmeseText.trim().length > 0 || englishText.trim().length > 0;


  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <Header />
        <main className="mt-8 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          {!isSpeechRecognitionSupported && error && <ErrorDisplay message={error}/>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LanguagePanel
              title="Burmese"
              value={burmeseText}
              onChange={handleBurmeseChange}
              placeholder="သင်ဘာသာပြန်လိုသောစာသားကိုဤနေရာတွင်ရိုက်ထည့်ပါ..."
              readOnly={isLoading}
              onRecordClick={() => handleRecord('burmese')}
              onSpeakClick={() => handleSpeak(burmeseText, 'burmese')}
              isRecording={isRecording && recordingLanguage === 'burmese'}
            />
            <div className="relative">
              <LanguagePanel
                title="English"
                value={englishText}
                onChange={handleEnglishChange}
                readOnly={isLoading}
                placeholder="Enter English text or see translation here..."
                onRecordClick={() => handleRecord('english')}
                onSpeakClick={() => handleSpeak(englishText, 'english')}
                isRecording={isRecording && recordingLanguage === 'english'}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <LoadingSpinner />
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <div className="flex items-center gap-4">
              <TranslateButton onClick={() => handleTranslate()} isLoading={isLoading} />
              <button
                onClick={handleClearText}
                disabled={isLoading || !canClear}
                className="inline-flex items-center justify-center px-6 py-4 border-2 border-slate-300 dark:border-slate-600 text-base font-medium rounded-full shadow-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-900 transition-all duration-300 transform hover:scale-105"
                aria-label="Clear text fields"
              >
                <XCircleIcon />
                <span className="ml-2">Clear</span>
              </button>
            </div>
            {error && !isSpeechRecognitionSupported && <div className="mt-2" />}
            {error && <ErrorDisplay message={error} />}
          </div>
        </main>
        <HistoryPanel
          history={history}
          onClear={handleClearHistory}
          onItemClick={handleUseHistoryItem}
        />
      </div>
    </div>
  );
}

export default App;