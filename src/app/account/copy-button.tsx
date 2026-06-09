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
        <div className="flex w-full items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-2xl border bg-muted/50 px-3 py-2 text-sm text-foreground">{revealed ? text : "•".repeat(Math.min(text.length || 20, 40))}</code>
            <Button variant="ghost" size="icon" onClick={() => setRevealed(!revealed)} title={revealed ? "Hide" : "Reveal"}>
                {revealed ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                {copied ? "Copied" : "Copy"}
            </Button>
        </div>
    );
}
