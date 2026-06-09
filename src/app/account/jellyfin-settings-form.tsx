"use client";

import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { updateJellyfinSettingsAction } from "./actions";

type JellyfinSettingsFormProps = {
    initialEnabled: boolean;
    initialUrl: string;
    initialUsername: string;
    hasApiKey: boolean;
};

export function JellyfinSettingsForm({ initialEnabled, initialUrl, initialUsername, hasApiKey }: JellyfinSettingsFormProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [url, setUrl] = useState(initialUrl);
    const [username, setUsername] = useState(initialUsername);
    const [apiKey, setApiKey] = useState("");
    const [showUrl, setShowUrl] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const urlId = useId();
    const usernameId = useId();
    const apiKeyId = useId();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            await updateJellyfinSettingsAction({ enabled, url, apiKey, username });
            setApiKey("");
            setMessage("Jellyfin settings saved.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save Jellyfin settings.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex items-start gap-3 rounded-2xl border bg-background/60 p-4 text-sm text-muted-foreground">
                <input className="mt-1" type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} disabled={loading} />
                <span className="flex flex-col gap-1">
                    <span className="block font-medium text-foreground">Enable Jellyfin room widget</span>
                    <span className="text-muted-foreground">When enabled, hosted rooms poll your configured Jellyfin server for now-playing media.</span>
                </span>
            </label>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor={urlId}>
                    Jellyfin URL
                </label>
                <div className="flex gap-2">
                    <Input id={urlId} type={showUrl ? "text" : "password"} placeholder="https://jellyfin.example.com" value={url} onChange={(event) => setUrl(event.target.value)} disabled={loading} />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowUrl((value) => !value)} aria-label={showUrl ? "Hide Jellyfin URL" : "Show Jellyfin URL"} disabled={loading}>
                        {showUrl ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor={usernameId}>
                    Jellyfin username
                </label>
                <Input id={usernameId} placeholder="Jellyfin user to display" value={username} onChange={(event) => setUsername(event.target.value)} disabled={loading} autoComplete="off" />
                <p className="text-xs text-muted-foreground">Only now-playing media for this Jellyfin user will appear in hosted rooms.</p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor={apiKeyId}>
                    API key
                </label>
                <div className="flex gap-2">
                    <Input id={apiKeyId} type={showApiKey ? "text" : "password"} placeholder={hasApiKey ? "Saved - leave blank to keep current key" : "Paste Jellyfin API key"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} disabled={loading} autoComplete="off" />
                    <Button type="button" variant="outline" size="icon" onClick={() => setShowApiKey((value) => !value)} aria-label={showApiKey ? "Hide Jellyfin API key" : "Show Jellyfin API key"} disabled={loading}>
                        {showApiKey ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
                    </Button>
                </div>
            </div>

            {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Jellyfin Settings"}
            </Button>
        </form>
    );
}
