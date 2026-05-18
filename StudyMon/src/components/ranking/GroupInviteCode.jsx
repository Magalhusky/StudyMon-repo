import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function GroupInviteCode({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors group"
    >
      <span className="font-heading text-sm tracking-widest text-primary">{code}</span>
      {copied
        ? <Check className="w-3.5 h-3.5 text-accent" />
        : <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
      }
    </button>
  );
}