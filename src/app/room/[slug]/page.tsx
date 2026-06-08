import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import db from "~/db/db";
import { roomsSchema, user } from "~/db/schema";
import { auth } from "~/lib/auth";
import { CurrentViewersBox } from "./current-viewers";
import { RoomHostDisplay } from "./host-display";
import { JellyfinWidget } from "./jellyfin-widget";
import { StreamPlayer } from "./player";
import { RoomAuthControls } from "./room-auth-controls";

interface RoomPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { slug } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    // Fetch the room and join with user to get the host's details
    const room = await db
        .select({
            slug: roomsSchema.slug,
            hostName: user.name,
            name: roomsSchema.name,
        })
        .from(roomsSchema)
        .innerJoin(user, eq(roomsSchema.userId, user.id))
        .where(eq(roomsSchema.slug, slug))
        .limit(1);

    const currentRoom = room[0];

    if (!currentRoom) {
        notFound();
    }

    return (
        <div className="container mx-auto py-10 max-w-5xl text-white font-sans">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Room: {currentRoom.name || currentRoom.slug.substring(0, 16)}</h1>
                    <div className="text-zinc-400">
                        Host: <RoomHostDisplay slug={currentRoom.slug} initialHostName={currentRoom.hostName} className="font-semibold text-white" />
                    </div>
                </div>

                <RoomAuthControls sessionUser={session?.user ?? null} />
            </div>

            <div className="bg-black aspect-video rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden">
                <StreamPlayer slug={currentRoom.slug} />
            </div>

            <div className="mt-6">
                <CurrentViewersBox roomSlug={currentRoom.slug} sessionUser={session?.user ?? null} />
            </div>

            <div className="mt-6">
                <JellyfinWidget roomSlug={currentRoom.slug} />
            </div>
        </div>
    );
}
