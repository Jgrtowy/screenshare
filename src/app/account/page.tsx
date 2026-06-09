import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import db from "~/db/db";
import { jellyfinSettingsSchema, roomsSchema, streamKeysSchema, user } from "~/db/schema";
import { auth } from "~/lib/auth";
import { CopyButton } from "./copy-button";
import { CreateRoomButton } from "./create-room-button";
import { JellyfinSettingsForm } from "./jellyfin-settings-form";
import { RoomDiscordServerButton } from "./room-discord-server-button";

export default async function Account() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/login");
    }

    const [streamKeys, userRooms, currentUser, jellyfinSettings] = await Promise.all([
        db.select().from(streamKeysSchema).where(eq(streamKeysSchema.userId, session.user.id)).limit(1),
        db.select().from(roomsSchema).where(eq(roomsSchema.userId, session.user.id)),
        db.select({ adminPanelAllowed: user.adminPanelAllowed }).from(user).where(eq(user.id, session.user.id)).limit(1),
        db.select().from(jellyfinSettingsSchema).where(eq(jellyfinSettingsSchema.userId, session.user.id)).limit(1),
    ]);

    const streamKey = streamKeys[0]?.key;
    const jellyfinSetting = jellyfinSettings[0];
    const canManageAdminTools = Boolean(currentUser[0]?.adminPanelAllowed);

    return (
        <div className="container mx-auto max-w-4xl px-4 py-10 text-foreground">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold">Account Settings</h1>
                <p className="text-sm text-muted-foreground">Manage rooms, stream keys, and integrations from one place.</p>
            </div>

            <div className="mt-8 rounded-3xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-medium">Your Rooms</h2>
                    <div className="flex items-center gap-2">
                        <Link href="/rooms">
                            <Button variant="outline" size="sm">
                                Discord Rooms
                            </Button>
                        </Link>
                        <CreateRoomButton />
                    </div>
                </div>

                {userRooms.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        {userRooms.map((room) => (
                            <div key={room.id} className="flex flex-col justify-between gap-4 rounded-2xl border bg-background/60 p-4 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="font-semibold text-lg truncate">{room.name || "Unnamed Room"}</span>
                                    <span className="max-w-[200px] truncate text-xs text-muted-foreground sm:max-w-xs md:max-w-md lg:max-w-none">ID: {room.slug.substring(0, 16)}...</span>
                                    {room.discordServerId ? <span className="mt-1 text-xs text-muted-foreground">Discord server: {room.discordServerId}</span> : <span className="mt-1 text-xs text-muted-foreground">Not assigned to a Discord server yet.</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {canManageAdminTools ? <RoomDiscordServerButton roomId={room.id} roomName={room.name || "Unnamed Room"} initialDiscordServerId={room.discordServerId ?? ""} /> : null}
                                    <Link href={`/room/${room.slug}`}>
                                        <Button variant="default" size="sm">
                                            Go to Room
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm italic text-muted-foreground">You don't have any rooms yet. Click the button to create one.</div>
                )}
            </div>
            <div className="mt-6 rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="text-lg font-medium mb-2">Your Stream Key & Connection info</h2>

                {streamKey ? (
                    <div className="flex items-center gap-4 rounded-2xl border bg-background/60 p-3">
                        <CopyButton text={streamKey} />
                    </div>
                ) : (
                    <div className="text-sm italic text-muted-foreground">No stream key assigned yet.</div>
                )}
            </div>

            {currentUser[0]?.adminPanelAllowed ? (
                <div className="mt-6 rounded-3xl border bg-card p-6 shadow-sm">
                    <h2 className="text-lg font-medium mb-2">Jellyfin Widget</h2>
                    <p className="mb-4 text-sm text-muted-foreground">Configure the Jellyfin instance used by rooms you host. Credentials are used server-side only.</p>
                    <JellyfinSettingsForm initialEnabled={jellyfinSetting?.enabled ?? false} initialUrl={jellyfinSetting?.url ?? ""} initialUsername={jellyfinSetting?.username ?? ""} hasApiKey={Boolean(jellyfinSetting?.apiKey)} />
                </div>
            ) : null}
        </div>
    );
}
