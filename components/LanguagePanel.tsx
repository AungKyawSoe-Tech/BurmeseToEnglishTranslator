import React from 'react';
import { MicrophoneIcon, SpeakerIcon, StopIcon } from './icons';

interface LanguagePanelProps {
  title: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  readOnly?: boolean;
  isRecording?: boolean;
  onRecordClick?: () => void;
  onSpeakClick?: () => void;
}

export const LanguagePanel: React.FC<LanguagePanelProps> = ({
  title,
  value,
  onChange,
  placeholder,
  readOnly = false,
  isRecording = false,
  onRecordClick,
  onSpeakClick,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">{title}</label>
        <div className="flex items-center gap-2">
            {onRecordClick && (
                <button 
                    onClick={onRecordClick} 
                    className={`p-2 rounded-full transition-colors duration-200 ${isRecording ? 'bg-red-500/20 text-red-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    aria-label={isRecording ? `Stop recording ${title}` : `Record ${title}`}
                    title={isRecording ? `Stop recording ${title}` : `Record ${title}`}
                >
                    {isRecording ? <StopIcon /> : <MicrophoneIcon />}
                </button>
            )}
            {onSpeakClick && (
                <button 
                    onClick={onSpeakClick}
                    disabled={!value.trim()}
                    className="p-2 rounded-full transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                    aria-label={`Speak ${title} text`}
                    title={`Speak ${title} text`}
                >
                    <SpeakerIcon />
                </button>
            )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full h-64 p-4 text-base border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 resize-none
          ${
            readOnly
              ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500 dark:focus:ring-cyan-400 dark:focus:border-cyan-400'
          }`}
      />
    </div>
  );
};
