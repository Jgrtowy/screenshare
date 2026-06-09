import { and, eq } from "drizzle-orm";
import db from "~/db/db";
import { account } from "~/db/schema";

export type DiscordGuild = {
    id: string;
    name: string;
};

export async function getDiscordGuildsForUser(userId: string) {
    const accounts = await db
        .select({ accessToken: account.accessToken })
        .from(account)
        .where(and(eq(account.userId, userId), eq(account.providerId, "discord")))
        .limit(1);
    const accessToken = accounts[0]?.accessToken?.trim();

    if (!accessToken) {
        throw new Error("Discord account not connected");
    }

    const response = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Could not load Discord servers");
    }

    return (await response.json()) as DiscordGuild[];
}
