/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss, onRetry }) => {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-200">Processing Error</p>
          <p className="text-red-300/90 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-400/40 bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold text-red-100 transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="text-red-400 hover:text-red-200 p-1.5 rounded hover:bg-red-900/40 transition-colors"
          title="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
