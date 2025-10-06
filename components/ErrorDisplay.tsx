
import React from 'react';

interface ErrorDisplayProps {
  message: string | null;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-4 w-full max-w-2xl text-center p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg" role="alert">
      <p className="font-medium">Oops! Something went wrong.</p>
      <p className="text-sm">{message}</p>
    </div>
  );
};
