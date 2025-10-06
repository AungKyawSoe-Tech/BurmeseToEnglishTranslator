import React from 'react';
import { ReuseIcon } from './icons';
import { TranslationHistoryItem } from '../App';

interface HistoryItemProps {
  item: TranslationHistoryItem;
  onReuse: (item: TranslationHistoryItem) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onReuse }) => {
  const sourceLangLabel = item.sourceLang.charAt(0).toUpperCase() + item.sourceLang.slice(1);
  const targetLangLabel = (item.sourceLang === 'burmese' ? 'English' : 'Burmese');

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg group">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{sourceLangLabel}</p>
            <p className="text-slate-700 dark:text-slate-300">{item.sourceText}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{targetLangLabel}</p>
            <p className="text-cyan-600 dark:text-cyan-400 font-medium">{item.translatedText}</p>
          </div>
        </div>
        <button
          onClick={() => onReuse(item)}
          className="ml-4 p-2 rounded-full text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700/50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Reuse this translation"
          title="Reuse this translation"
        >
          <ReuseIcon />
        </button>
      </div>
    </div>
  );
};
