import React, { useState, useCallback, useEffect, useRef } from 'react';
import { translateBurmeseToEnglish, translateEnglishToBurmese } from './services/geminiService';
import { LanguagePanel } from './components/LanguagePanel';
import { TranslateButton } from './components/TranslateButton';
import { ErrorDisplay } from './components/ErrorDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HistoryPanel } from './components/HistoryPanel';
import { XCircleIcon, SwapIcon, TranslateIcon, XIcon } from './components/icons';

type Language = 'burmese' | 'english';

export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLang: Language;
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

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
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  
  // FIX: Removed unused `handleTranslateRef` which caused a syntax error.

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

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

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
  const startTimeoutRef = useRef<number | null>(null);

  const handleTranslate = useCallback(async (textToTranslate?: string) => {
    const isBurmeseSource = sourceLanguage === 'burmese';
    const sourceText = textToTranslate ?? (isBurmeseSource ? burmeseText : englishText);

    if (!sourceText.trim()) {
      setError(`Please enter or speak some ${isBurmeseSource ? 'Burmese' : 'English'} text to translate.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    if (isBurmeseSource) setEnglishText(''); else setBurmeseText('');

    try {
      const translation = isBurmeseSource
        ? await translateBurmeseToEnglish(sourceText)
        : await translateEnglishToBurmese(sourceText);
      
      if (isBurmeseSource) setEnglishText(translation); else setBurmeseText(translation);
      
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
        const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, 50);
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
      if (recognition.lang === 'my-MM') {
        setBurmeseText(transcript);
        setSourceLanguage('burmese');
      } else if (recognition.lang === 'en-US') {
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
    };

    return () => {
      recognition.stop();
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    }
  }, []);

  const handleRecord = (lang: Language) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
        setIsRecording(false);
        setRecordingLanguage(null);
      } else {
        recognition.stop();
      }
    } else {
      const langCode = lang === 'burmese' ? 'my-MM' : 'en-US';
      recognition.lang = langCode;
      setIsRecording(true);
      setRecordingLanguage(lang);
      
      startTimeoutRef.current = window.setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error("Speech recognition could not be started:", e);
          setError(`Speech recognition failed to start: ${e instanceof Error ? e.message : String(e)}`);
          setIsRecording(false);
          setRecordingLanguage(null);
        } finally {
          startTimeoutRef.current = null;
        }
      }, 500);
    }
  };

  const handleSpeak = (text: string, lang: Language) => {
    if (!text.trim() || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    let voice: SpeechSynthesisVoice | undefined;

    if (lang === 'english') {
      utterance.lang = 'en-AU';
      voice = voices.find(v => v.lang === 'en-AU') || voices.find(v => v.lang.startsWith('en'));
    } else {
      utterance.lang = 'my-MM';
      voice = voices.find(v => v.lang === 'my-MM') || voices.find(v => v.lang.startsWith('my'));
      if (!voice) setError("A Burmese text-to-speech voice may not be available on your system.");
    }
    
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

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
    setIsHistoryOpen(false);
  };

  const handleClearText = () => {
    setBurmeseText('');
    setEnglishText('');
    setError(null);
  };
  
  const handleSwapLanguages = () => {
    setSourceLanguage(prev => prev === 'burmese' ? 'english' : 'burmese');
    setBurmeseText(englishText);
    setEnglishText(burmeseText);
  };

  const canClear = burmeseText.trim().length > 0 || englishText.trim().length > 0;
  
  const sourceProps = sourceLanguage === 'burmese' ? {
      title: "Burmese", value: burmeseText, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setBurmeseText(e.target.value),
      placeholder: "သင်ဘာသာပြန်လိုသောစာသားကိုဤနေရာတွင်ရိုက်ထည့်ပါ...", onRecordClick: () => handleRecord('burmese'),
      onSpeakClick: () => handleSpeak(burmeseText, 'burmese'), isRecording: isRecording && recordingLanguage === 'burmese', isRecordDisabled: isRecording && recordingLanguage === 'english'
  } : {
      title: "English", value: englishText, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setEnglishText(e.target.value),
      placeholder: "Enter English text or see translation here...", onRecordClick: () => handleRecord('english'),
      onSpeakClick: () => handleSpeak(englishText, 'english'), isRecording: isRecording && recordingLanguage === 'english', isRecordDisabled: isRecording && recordingLanguage === 'burmese'
  };

  const targetProps = sourceLanguage === 'burmese' ? {
      title: "English", value: englishText,
      placeholder: "Translation will appear here...", onRecordClick: () => handleRecord('english'),
      onSpeakClick: () => handleSpeak(englishText, 'english'), isRecording: isRecording && recordingLanguage === 'english', isRecordDisabled: isRecording && recordingLanguage === 'burmese'
  } : {
      title: "Burmese", value: burmeseText,
      placeholder: "ဘာသာပြန်ချက်သည်ဤနေရာတွင်ပေါ်လာလိမ့်မည်...", onRecordClick: () => handleRecord('burmese'),
      onSpeakClick: () => handleSpeak(burmeseText, 'burmese'), isRecording: isRecording && recordingLanguage === 'burmese', isRecordDisabled: isRecording && recordingLanguage === 'english'
  };


  return (
    <div className="text-slate-800 dark:text-slate-200 font-sans">
      <div className={`fixed bottom-0 right-0 sm:bottom-8 sm:right-8 z-[9999] transition-all duration-300 ${isWidgetOpen ? 'w-full h-full sm:w-[26rem] sm:max-w-[calc(100vw-4rem)] sm:h-[85vh] sm:max-h-[42rem]' : 'w-16 h-16'}`}>
        
        {/* Main Translator Panel */}
        <div className={`w-full h-full bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl flex flex-col transition-opacity duration-300 ${isWidgetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">Translator</h2>
            <button onClick={() => setIsWidgetOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close translator">
              <XIcon />
            </button>
          </header>

          <main className="flex-grow p-4 space-y-4 overflow-y-auto">
            <LanguagePanel {...sourceProps} readOnly={isLoading} />
            
            <div className="flex justify-center my-2">
                <button onClick={handleSwapLanguages} className="p-2 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-transform duration-300 hover:rotate-180" aria-label="Swap languages">
                    <SwapIcon />
                </button>
            </div>

            <div className="relative">
              <LanguagePanel {...targetProps} onChange={() => {}} readOnly={true} />
              {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 sm:rounded-xl">
                  <LoadingSpinner />
                  </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              <TranslateButton onClick={() => handleTranslate()} isLoading={isLoading} />
              {canClear && (
                <button onClick={handleClearText} disabled={isLoading} className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50" aria-label="Clear text">
                    <XCircleIcon />
                </button>
              )}
            </div>
            {error && <ErrorDisplay message={error} />}
          </main>

          <footer className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 text-center">
            <button onClick={() => setIsHistoryOpen(true)} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline">
              Translation History
            </button>
          </footer>
        </div>

        {/* Floating Action Button */}
        {!isWidgetOpen && (
          <button
            onClick={() => setIsWidgetOpen(true)}
            className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transform transition-transform hover:scale-110"
            aria-label="Open translator"
          >
            <TranslateIcon />
          </button>
        )}
      </div>

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center" onClick={() => setIsHistoryOpen(false)}>
          <div className="w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <HistoryPanel
              history={history}
              onClear={handleClearHistory}
              onItemClick={handleUseHistoryItem}
              isModal={true}
              onClose={() => setIsHistoryOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
