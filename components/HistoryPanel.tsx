import React, { useState } from 'react';
import { HistoryItem } from './HistoryItem';
import { ChevronDownIcon, TrashIcon, XIcon } from './icons';
import { TranslationHistoryItem } from '../App';

interface HistoryPanelProps {
  history: TranslationHistoryItem[];
  onClear: () => void;
  onItemClick: (item: TranslationHistoryItem) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClear, onItemClick, isModal = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(isModal); // Default to open if in modal mode

  const panelContent = (
    <>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
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
    </>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl">
        <div
          className="w-full flex justify-between items-center p-4 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-t-xl"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Translation History
          </h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
            {isModal && onClose ? (
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close history">
                    <XIcon />
                </button>
            ) : (
                <button onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="history-content" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <ChevronDownIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            )}
          </div>
        </div>
        {isModal ? panelContent : (
            isOpen && <div id="history-content">{panelContent}</div>
        )}
      </div>
    </div>
  );
};
