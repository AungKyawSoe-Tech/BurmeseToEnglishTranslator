
import React from 'react';

interface LanguagePanelProps {
  title: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  readOnly?: boolean;
}

export const LanguagePanel: React.FC<LanguagePanelProps> = ({
  title,
  value,
  onChange,
  placeholder,
  readOnly = false,
}) => {
  return (
    <div className="flex flex-col h-full">
      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">{title}</label>
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
