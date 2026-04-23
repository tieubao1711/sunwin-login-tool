import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopied(true);

      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition"
      title="Copy"
    >
      {copied ? (
        <Check size={16} className="text-emerald-400" />
      ) : (
        <Copy size={16} />
      )}
    </button>
  );
}