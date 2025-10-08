import React from 'react';

export const ShareView: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  let text = params.get('text') || '';

  if (id) {
    try {
      const sharesRaw = localStorage.getItem('shares');
      if (sharesRaw) {
        const shares = JSON.parse(sharesRaw);
        if (shares && shares[id] && shares[id].text) {
          text = shares[id].text;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-3xl bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Shared translation</h1>
        <pre className="whitespace-pre-wrap text-lg">{text}</pre>
      </div>
    </div>
  );
};

export default ShareView;
