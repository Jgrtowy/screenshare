"use server";

import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import db from "~/db/db";
import { jellyfinSettingsSchema, roomsSchema, user } from "~/db/schema";
import { auth } from "~/lib/auth";

type JellyfinSettingsInput = {
    enabled: boolean;
    url: string;
    apiKey: string;
    username: string;
};

function normalizeJellyfinUrl(url: string) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return "";
    }

    try {
        const parsedUrl = new URL(trimmedUrl);
        return parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, "");
    } catch {
        throw new Error("Enter a valid Jellyfin URL");
    }
}

export async function createRoomAction(name: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    if (!name || name.trim() === "") {
        throw new Error("Room name is required");
    }

    const slug = crypto.randomBytes(64).toString("hex"); // 128 characters long

    await db.insert(roomsSchema).values({
        slug,
        name: name.trim(),
        userId: session.user.id,
    });

    revalidatePath("/account");
    return { success: true, slug };
}

export async function updateJellyfinSettingsAction(input: JellyfinSettingsInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const currentUser = await db.select({ adminPanelAllowed: user.adminPanelAllowed }).from(user).where(eq(user.id, session.user.id)).limit(1);

    if (!currentUser[0]?.adminPanelAllowed) {
        throw new Error("Admin access required");
    }

    const existingSettings = await db.select().from(jellyfinSettingsSchema).where(eq(jellyfinSettingsSchema.userId, session.user.id)).limit(1);
    const existingApiKey = existingSettings[0]?.apiKey ?? "";
    const url = normalizeJellyfinUrl(input.url);
    const apiKey = input.apiKey.trim() || existingApiKey;
    const username = input.username.trim();

    if (input.enabled && (!url || !apiKey || !username)) {
        throw new Error("Jellyfin URL, API key, and username are required when calls are enabled");
    }

    const now = new Date();

    await db
        .insert(jellyfinSettingsSchema)
        .values({
            userId: session.user.id,
            enabled: input.enabled,
            url: url || null,
            apiKey: apiKey || null,
            username: username || null,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: jellyfinSettingsSchema.userId,
            set: {
                enabled: input.enabled,
                url: url || null,
                apiKey: apiKey || null,
                username: username || null,
                updatedAt: now,
            },
        });

    revalidatePath("/account");
    return { success: true };
}

export async function updateRoomDiscordServerAction(input: { roomId: number; discordServerId: string }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const currentUser = await db.select({ adminPanelAllowed: user.adminPanelAllowed }).from(user).where(eq(user.id, session.user.id)).limit(1);

    if (!currentUser[0]?.adminPanelAllowed) {
        throw new Error("Admin access required");
    }

    const room = await db.select({ slug: roomsSchema.slug, userId: roomsSchema.userId }).from(roomsSchema).where(eq(roomsSchema.id, input.roomId)).limit(1);

    if (!room[0] || room[0].userId !== session.user.id) {
        throw new Error("Room not found");
    }

    const discordServerId = input.discordServerId.trim();

    if (discordServerId && !/^\d+$/.test(discordServerId)) {
        throw new Error("Enter a valid Discord server ID");
    }

    await db
        .update(roomsSchema)
        .set({
            discordServerId: discordServerId || null,
        })
        .where(eq(roomsSchema.id, input.roomId));

    revalidatePath("/account");
    revalidatePath("/rooms");
    revalidatePath(`/room/${room[0].slug}`);

    return { success: true };
}
