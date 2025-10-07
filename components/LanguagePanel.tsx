
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
  isRecordDisabled?: boolean;
  error?: string | null;
  maxLength: number;
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
  isRecordDisabled = false,
  error = null,
  maxLength
}) => {
  const baseClasses = 'w-full h-64 p-4 text-base border-2 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 resize-none';
  
  let dynamicClasses = '';
  if (readOnly) {
    dynamicClasses = 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-not-allowed';
  } else if (error) {
    dynamicClasses = 'bg-white dark:bg-slate-900 border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500';
  } else {
    dynamicClasses = 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500 dark:focus:ring-cyan-400 dark:focus:border-cyan-400';
  }

  const textareaClassName = `${baseClasses} ${dynamicClasses}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={title} className="text-sm font-semibold text-slate-600 dark:text-slate-400">{title}</label>
        <div className="flex items-center gap-2">
            {onRecordClick && (
                <button 
                    onClick={onRecordClick} 
                    disabled={isRecordDisabled}
                    className={`p-2 rounded-full transition-colors duration-200 ${isRecording ? 'bg-red-500/20 text-red-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
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
        id={title}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={textareaClassName}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${title.toLowerCase()}-error` : undefined}
      />
      <div className="flex justify-between items-center text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 px-1">
        {error ? (
          <span id={`${title.toLowerCase()}-error`} className="text-red-500" role="alert">
            {error}
          </span>
        ) : (
          <span>&nbsp;</span> /* Keep space to prevent layout shift */
        )}
        <span>{value.length} / {maxLength}</span>
      </div>
    </div>
  );
};
