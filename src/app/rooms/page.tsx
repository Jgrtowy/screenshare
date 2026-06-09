import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import db from "~/db/db";
import { roomsSchema, user } from "~/db/schema";
import { auth } from "~/lib/auth";
import { getDiscordGuildsForUser } from "~/lib/discord";

export default async function RoomsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/login");
    }

    let guilds: Awaited<ReturnType<typeof getDiscordGuildsForUser>> = [];
    let loadError: string | null = null;

    try {
        guilds = await getDiscordGuildsForUser(session.user.id);
    } catch (err) {
        loadError = err instanceof Error ? err.message : "Could not load Discord servers";
    }

    const guildIds = guilds.map((guild) => guild.id);

    const matchedRooms = guildIds.length
        ? await db
              .select({
                  id: roomsSchema.id,
                  name: roomsSchema.name,
                  slug: roomsSchema.slug,
                  discordServerId: roomsSchema.discordServerId,
                  hostName: user.name,
              })
              .from(roomsSchema)
              .innerJoin(user, eq(roomsSchema.userId, user.id))
              .where(inArray(roomsSchema.discordServerId, guildIds))
        : [];

    const roomsByGuild = new Map<string, typeof matchedRooms>();

    for (const room of matchedRooms) {
        const serverId = room.discordServerId ?? "";
        const existingRooms = roomsByGuild.get(serverId) ?? [];
        existingRooms.push(room);
        roomsByGuild.set(serverId, existingRooms);
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-10 text-foreground">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold">Discord Rooms</h1>
                <p className="text-sm text-muted-foreground">Rooms assigned to Discord servers you are currently in.</p>
            </div>

            {loadError ? <div className="mt-6 rounded-2xl border bg-card p-4 text-sm text-destructive">{loadError}</div> : null}

            {!loadError && guilds.length === 0 ? <div className="mt-6 rounded-3xl border bg-card p-6 text-sm text-muted-foreground">No Discord servers were found for your account.</div> : null}

            {!loadError && guilds.length > 0 && matchedRooms.length === 0 ? <div className="mt-6 rounded-3xl border bg-card p-6 text-sm text-muted-foreground">You are in Discord servers, but no rooms are assigned to them yet.</div> : null}

            {matchedRooms.length > 0 ? (
                <div className="mt-6 flex flex-col gap-4">
                    {guilds
                        .filter((guild) => roomsByGuild.has(guild.id))
                        .map((guild) => {
                            const rooms = roomsByGuild.get(guild.id) ?? [];

                            return (
                                <section key={guild.id} className="rounded-3xl border bg-card p-6 shadow-sm">
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-medium">{guild.name}</h2>
                                            <p className="text-xs text-muted-foreground">Server ID: {guild.id}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {rooms.map((room) => (
                                            <div key={room.id} className="flex flex-col justify-between gap-4 rounded-2xl border bg-background/60 p-4 sm:flex-row sm:items-center">
                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <span className="truncate text-lg font-semibold">{room.name || "Unnamed Room"}</span>
                                                    <span className="text-xs text-muted-foreground">Host: {room.hostName}</span>
                                                </div>
                                                <Link href={`/room/${room.slug}`}>
                                                    <Button size="sm">Go to Room</Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                </div>
            ) : null}
        </div>
    );
}
