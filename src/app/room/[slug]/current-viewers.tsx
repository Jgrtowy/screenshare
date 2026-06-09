"use client";

import { Facehash } from "facehash";
import Image from "next/image";
import { useEffect, useState } from "react";

type RoomSessionUser = {
    id?: string;
    name: string;
    image?: string | null;
} | null;

type Viewer = {
    viewerKey: string;
    name: string;
    image: string | null;
    isAuthenticated: boolean;
    lastSeenAt: string;
};

function getOrCreateSessionValue(key: string, createValue: () => string) {
    const existing = sessionStorage.getItem(key);

    if (existing) {
        return existing;
    }

    const nextValue = createValue();
    sessionStorage.setItem(key, nextValue);
    return nextValue;
}

export function CurrentViewersBox({ roomSlug, sessionUser }: { roomSlug: string; sessionUser: RoomSessionUser }) {
    const [viewerKey, setViewerKey] = useState<string | null>(null);
    const [viewerName, setViewerName] = useState("");
    const [viewerImage, setViewerImage] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [viewers, setViewers] = useState<Viewer[]>([]);

    useEffect(() => {
        const nextViewerKey = getOrCreateSessionValue("screenshare.viewer.key", () => crypto.randomUUID());
        const guestName = getOrCreateSessionValue("screenshare.viewer.name", () => `User#${String(Math.floor(100000 + Math.random() * 900000))}`);

        setViewerKey(nextViewerKey);
        setViewerName(sessionUser?.name ?? guestName);
        setViewerImage(sessionUser?.image ?? null);
        setIsAuthenticated(Boolean(sessionUser));
    }, [sessionUser]);

    useEffect(() => {
        if (!viewerKey || !viewerName) {
            return;
        }

        let active = true;

        const syncViewers = async () => {
            const payload = {
                viewerKey,
                name: viewerName,
                image: viewerImage,
                isAuthenticated,
            };

            await fetch(`/api/rooms/${roomSlug}/viewers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                keepalive: true,
            });

            const response = await fetch(`/api/rooms/${roomSlug}/viewers`, { cache: "no-store" });
            const data = (await response.json()) as { viewers?: Viewer[] };

            if (!active) {
                return;
            }

            setViewers(data.viewers ?? []);
        };

        void syncViewers();
        const intervalId = window.setInterval(() => {
            void syncViewers();
        }, 5000);

        const handleUnload = () => {
            void fetch(`/api/rooms/${roomSlug}/viewers`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ viewerKey }),
                keepalive: true,
            });
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            active = false;
            window.clearInterval(intervalId);
            window.removeEventListener("beforeunload", handleUnload);
            handleUnload();
        };
    }, [roomSlug, viewerImage, viewerKey, viewerName, isAuthenticated]);

    const viewerCount = viewers.length;

    return (
        <section className="rounded-3xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">{viewerCount} watching</div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {viewers.map((viewer) => (
                    <div key={viewer.viewerKey} className="flex items-center gap-3 rounded-2xl border bg-background/60 px-3 py-3">
                        <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                            {viewer.image ? <Image alt={viewer.name} className="h-full w-full object-cover" height={40} src={viewer.image} width={40} /> : <Facehash name={viewer.name} size={40} className="h-full w-full" interactive={false} showInitial={false} variant="solid" />}
                        </div>

                        <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">{viewer.name}</div>
                        </div>
                    </div>
                ))}

                {viewers.length === 0 ? <div className="rounded-2xl border border-dashed px-3 py-6 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">No current viewers yet.</div> : null}
            </div>
        </section>
    );
}
