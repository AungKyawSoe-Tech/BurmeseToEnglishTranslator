import React, { useState } from 'react';
import { HistoryItem } from './HistoryItem';
import { ChevronDownIcon, TrashIcon } from './icons';
import { TranslationHistoryItem } from '../App';


interface HistoryPanelProps {
  history: TranslationHistoryItem[];
  onClear: () => void;
  onItemClick: (item: TranslationHistoryItem) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClear, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center p-4 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-xl"
          aria-expanded={isOpen}
          aria-controls="history-content"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Translation History
          </h2>
          <div className="flex items-center gap-4">
            {history.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent toggling the panel
                  if (window.confirm('Are you sure you want to clear all translation history?')) {
                    onClear();
                  }
                }}
                className="p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                aria-label="Clear history"
                title="Clear history"
              >
                <TrashIcon />
              </button>
            )}
            <ChevronDownIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isOpen && (
          <div id="history-content" className="p-4 border-t border-slate-200 dark:border-slate-700">
            {history.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {history.map(item => (
                  <HistoryItem key={item.id} item={item} onReuse={onItemClick} />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                Your translation history will appear here.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
