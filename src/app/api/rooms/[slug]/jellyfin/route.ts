import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "~/db/db";
import { jellyfinSettingsSchema, roomsSchema, user } from "~/db/schema";

type JellyfinSession = {
    UserId?: string;
    UserName?: string;
    NowPlayingItem?: {
        Name?: string;
        Type?: string;
        ProductionYear?: number;
        SeriesName?: string;
        SeasonName?: string;
        IndexNumber?: number;
        ParentIndexNumber?: number;
        RunTimeTicks?: number;
    };
    PlayState?: {
        PositionTicks?: number;
        IsPaused?: boolean;
    };
};

type JellyfinUser = {
    Id?: string;
    Name?: string;
};

function ticksToSeconds(ticks?: number) {
    return typeof ticks === "number" ? Math.floor(ticks / 10_000_000) : null;
}

function buildSubtitle(item: NonNullable<JellyfinSession["NowPlayingItem"]>) {
    if (item.Type !== "Episode") {
        return item.ProductionYear ? String(item.ProductionYear) : null;
    }

    const episodeParts = [typeof item.ParentIndexNumber === "number" ? `S${item.ParentIndexNumber}` : null, typeof item.IndexNumber === "number" ? `E${item.IndexNumber}` : null].filter(Boolean);
    const episodeLabel = episodeParts.length ? episodeParts.join(" ") : item.SeasonName;

    return [item.SeriesName, episodeLabel].filter(Boolean).join(" - ") || null;
}

async function fetchJellyfinJson<T>(url: string, apiKey: string, signal: AbortSignal) {
    const response = await fetch(url, {
        headers: {
            "X-Emby-Token": apiKey,
        },
        cache: "no-store",
        signal,
    });

    if (!response.ok) {
        throw new Error("Jellyfin request failed");
    }

    return (await response.json()) as T;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const room = await db
        .select({
            adminPanelAllowed: user.adminPanelAllowed,
            jellyfinEnabled: jellyfinSettingsSchema.enabled,
            jellyfinUrl: jellyfinSettingsSchema.url,
            jellyfinApiKey: jellyfinSettingsSchema.apiKey,
            jellyfinUsername: jellyfinSettingsSchema.username,
        })
        .from(roomsSchema)
        .innerJoin(user, eq(roomsSchema.userId, user.id))
        .leftJoin(jellyfinSettingsSchema, eq(jellyfinSettingsSchema.userId, roomsSchema.userId))
        .where(eq(roomsSchema.slug, slug))
        .limit(1);

    const settings = room[0];

    if (!settings) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!settings.adminPanelAllowed) {
        return NextResponse.json({ enabled: false, item: null });
    }

    if (!settings.jellyfinEnabled || !settings.jellyfinUrl || !settings.jellyfinApiKey || !settings.jellyfinUsername) {
        return NextResponse.json({ enabled: false, item: null });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const users = await fetchJellyfinJson<JellyfinUser[]>(`${settings.jellyfinUrl}/Users`, settings.jellyfinApiKey, controller.signal);
        const configuredUsername = settings.jellyfinUsername.trim().toLowerCase();
        const configuredUser = users.find((jellyfinUser) => jellyfinUser.Name?.trim().toLowerCase() === configuredUsername);

        if (!configuredUser?.Id) {
            return NextResponse.json({ enabled: true, item: null, error: "Configured Jellyfin user was not found" }, { status: 502 });
        }

        const sessions = await fetchJellyfinJson<JellyfinSession[]>(`${settings.jellyfinUrl}/Sessions?UserId=${encodeURIComponent(configuredUser.Id)}`, settings.jellyfinApiKey, controller.signal);
        const currentSession = sessions.find((session) => {
            const itemType = session.NowPlayingItem?.Type;
            const matchesConfiguredUser = session.UserId === configuredUser.Id || session.UserName?.trim().toLowerCase() === configuredUsername;
            return matchesConfiguredUser && Boolean(session.NowPlayingItem) && !session.PlayState?.IsPaused && (itemType === "Movie" || itemType === "Episode" || itemType === "Series");
        });

        if (!currentSession?.NowPlayingItem) {
            return NextResponse.json({ enabled: true, item: null });
        }

        const item = currentSession.NowPlayingItem;

        return NextResponse.json({
            enabled: true,
            item: {
                title: item.Type === "Episode" && item.SeriesName ? item.SeriesName : (item.Name ?? "Unknown title"),
                name: item.Name ?? null,
                subtitle: buildSubtitle(item),
                type: item.Type ?? "Unknown",
                positionSeconds: ticksToSeconds(currentSession.PlayState?.PositionTicks),
                runtimeSeconds: ticksToSeconds(item.RunTimeTicks),
            },
        });
    } catch {
        return NextResponse.json({ enabled: true, item: null, error: "Could not reach Jellyfin" }, { status: 502 });
    } finally {
        clearTimeout(timeoutId);
    }
}
