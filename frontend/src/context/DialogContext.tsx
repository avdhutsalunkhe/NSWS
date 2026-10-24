import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Send, 
  X,
  Trash2
} from 'lucide-react';

export type DialogVariant = 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'nsws';

export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  details?: string | Record<string, any>;
  icon?: ReactNode;
}

export interface PromptOptions extends DialogOptions {
  placeholder?: string;
  defaultValue?: string;
}

interface DialogContextValue {
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  alert: (options: DialogOptions | string) => Promise<void>;
  prompt: (options: PromptOptions | string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface ActiveDialogState {
  type: 'confirm' | 'alert' | 'prompt';
  options: DialogOptions;
  resolve: (value: any) => void;
  promptValue?: string;
}

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<ActiveDialogState | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const confirm = (options: DialogOptions | string): Promise<boolean> => {
    const opts: DialogOptions = typeof options === 'string' 
      ? { message: options, title: 'Please Confirm' } 
      : options;
    return new Promise((resolve) => {
      setDialogState({
        type: 'confirm',
        options: {
          variant: 'primary',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          ...opts,
        },
        resolve,
      });
    });
  };

  const alert = (options: DialogOptions | string): Promise<void> => {
    const opts: DialogOptions = typeof options === 'string' 
      ? { message: options, title: 'Notice' } 
      : options;
    return new Promise((resolve) => {
      setDialogState({
        type: 'alert',
        options: {
          variant: 'info',
          confirmText: 'OK',
          ...opts,
        },
        resolve,
      });
    });
  };

  const prompt = (options: PromptOptions | string): Promise<string | null> => {
    const opts: PromptOptions = typeof options === 'string' 
      ? { message: options, title: 'Input Required' } 
      : options;
    setPromptInput(opts.defaultValue || '');
    return new Promise((resolve) => {
      setDialogState({
        type: 'prompt',
        options: {
          variant: 'primary',
          confirmText: 'Submit',
          cancelText: 'Cancel',
          ...opts,
        },
        resolve,
        promptValue: opts.defaultValue || '',
      });
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!dialogState) return;

    if (dialogState.type === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && dialogState.type !== 'prompt') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState, promptInput]);

  const handleConfirm = () => {
    if (!dialogState) return;
    const { type, resolve } = dialogState;
    setDialogState(null);
    if (type === 'confirm') {
      resolve(true);
    } else if (type === 'prompt') {
      resolve(promptInput);
    } else {
      resolve(undefined);
    }
  };

  const handleCancel = () => {
    if (!dialogState) return;
    const { type, resolve } = dialogState;
    setDialogState(null);
    if (type === 'confirm') {
      resolve(false);
    } else if (type === 'prompt') {
      resolve(null);
    } else {
      resolve(undefined);
    }
  };

  const renderIcon = () => {
    if (!dialogState) return null;
    const variant = dialogState.options.variant || 'primary';

    switch (variant) {
      case 'nsws':
        return (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Send className="w-6 h-6" />
          </div>
        );
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
            <Trash2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  const getConfirmBtnClasses = () => {
    const variant = dialogState?.options.variant || 'primary';
    switch (variant) {
      case 'nsws':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-100';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100';
      case 'primary':
      default:
        return 'bg-red-600 hover:bg-red-700 text-white shadow-red-100';
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, alert, prompt }}>
      {children}

      {/* Styled Modern Dialog Popup */}
      {dialogState && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop with smooth blur */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={dialogState.type === 'confirm' ? handleCancel : handleConfirm}
          />

          {/* Modal Container */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all z-10 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header / Icon row */}
            <div className="p-6 pb-4">
              <div className="flex items-start gap-4">
                {renderIcon()}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {dialogState.options.title || (
                      dialogState.options.variant === 'nsws' 
                        ? 'NSWS Gateway Action' 
                        : dialogState.type === 'confirm' 
                          ? 'Confirmation' 
                          : 'Notice'
                    )}
                  </h3>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {dialogState.options.message}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Extra Details Box (if provided) */}
              {dialogState.options.details && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 overflow-x-auto max-h-40">
                  {typeof dialogState.options.details === 'object'
                    ? JSON.stringify(dialogState.options.details, null, 2)
                    : dialogState.options.details}
                </div>
              )}

              {/* Prompt Input (if prompt mode) */}
              {dialogState.type === 'prompt' && (
                <div className="mt-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder={(dialogState.options as PromptOptions).placeholder || 'Type here...'}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirm();
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              {(dialogState.type === 'confirm' || dialogState.type === 'prompt') && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
                >
                  {dialogState.options.cancelText || 'Cancel'}
                </button>
              )}
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer ${getConfirmBtnClasses()}`}
              >
                {dialogState.options.confirmText || (dialogState.type === 'confirm' ? 'Confirm' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
