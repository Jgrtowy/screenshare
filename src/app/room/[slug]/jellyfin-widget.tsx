"use client";

import useSWR from "swr";

type JellyfinNowPlaying = {
    enabled: boolean;
    item: {
        title: string;
        name: string | null;
        subtitle: string | null;
        type: string;
        positionSeconds: number | null;
        runtimeSeconds: number | null;
    } | null;
    error?: string;
};

const fetcher = async (url: string) => {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
        throw new Error("Unable to load Jellyfin status");
    }

    return (await response.json()) as JellyfinNowPlaying;
};

function formatTime(seconds: number | null) {
    if (seconds === null) {
        return null;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function JellyfinWidget({ roomSlug }: { roomSlug: string }) {
    const { data, error } = useSWR(`/api/rooms/${roomSlug}/jellyfin`, fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true,
    });

    if (!data?.enabled && !error) {
        return null;
    }

    const item = data?.item ?? null;
    const position = formatTime(item?.positionSeconds ?? null);
    const runtime = formatTime(item?.runtimeSeconds ?? null);
    const progress = item?.positionSeconds !== null && item?.runtimeSeconds ? Math.min(100, Math.max(0, (item.positionSeconds / item.runtimeSeconds) * 100)) : null;

    return (
        <section className="rounded-3xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Jellyfin</div>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">Now Playing</h2>
                </div>
                <div className="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">Host media</div>
            </div>

            {item ? (
                <div className="mt-4 flex flex-col gap-3">
                    <div>
                        <div className="text-xl font-bold text-foreground">{item.title}</div>
                        {item.name && item.name !== item.title ? <div className="text-sm text-muted-foreground">{item.name}</div> : null}
                        {item.subtitle ? <div className="text-sm text-muted-foreground">{item.subtitle}</div> : null}
                    </div>

                    {progress !== null ? (
                        <div className="flex flex-col gap-2">
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{position}</span>
                                <span>{runtime}</span>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed px-3 py-6 text-sm text-muted-foreground">{error || data?.error ? "Jellyfin status is unavailable." : "Nothing is currently playing."}</div>
            )}
        </section>
    );
}
