"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <code className="text-sm font-mono flex-1 text-zinc-300 px-3 py-1 bg-black/50 rounded overflow-hidden text-clip whitespace-nowrap">{revealed ? text : "•".repeat(Math.min(text.length || 20, 40))}</code>
            <Button variant="ghost" size="icon" onClick={() => setRevealed(!revealed)} title={revealed ? "Hide" : "Reveal"}>
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="inline-flex gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
            </Button>
        </div>
    );
}
