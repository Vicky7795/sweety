import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ type = 'success', message, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-2 bg-white ${
      isSuccess
        ? 'border-emerald-200 text-emerald-900 bg-emerald-50/90'
        : 'border-rose-200 text-rose-900 bg-rose-50/90'
    }">
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
      )}
      <span className="max-w-md">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
