import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import db from "~/db/db";
import { roomsSchema, streamKeysSchema } from "~/db/schema";
import { auth } from "~/lib/auth";
import { CopyButton } from "./copy-button";
import { CreateRoomButton } from "./create-room-button";

export default async function Account() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect("/login");
    }

    const streamKeys = await db.select().from(streamKeysSchema).where(eq(streamKeysSchema.userId, session.user.id)).limit(1);

    const streamKey = streamKeys[0]?.key;

    const userRooms = await db.select().from(roomsSchema).where(eq(roomsSchema.userId, session.user.id));

    return (
        <div className="container mx-auto py-10 max-w-2xl text-white font-mono">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-lg font-medium mb-2">Your Stream Key & Connection info</h2>

                {streamKey ? (
                    <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                        <CopyButton text={streamKey} />
                    </div>
                ) : (
                    <div className="text-zinc-500 italic">No stream key assigned yet.</div>
                )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium">Your Rooms</h2>
                    <CreateRoomButton />
                </div>

                {userRooms.length > 0 ? (
                    <div className="space-y-3">
                        {userRooms.map((room) => (
                            <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-950 p-4 rounded-md border border-zinc-800 gap-4">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-semibold text-lg truncate">{room.name || "Unnamed Room"}</span>
                                    <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-none">ID: {room.slug.substring(0, 16)}...</span>
                                </div>
                                <div className="flex gap-2">
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
                    <div className="text-zinc-500 italic">You don't have any rooms yet. Click the button to create one.</div>
                )}
            </div>
        </div>
    );
}
