import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import db from "~/db/db";
import { roomsSchema, user } from "~/db/schema";
import { RoomHostDisplay } from "./host-display";
import { StreamPlayer } from "./player";

interface RoomPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
    const { slug } = await params;

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
                <h1 className="text-3xl font-bold">Room: {currentRoom.name || currentRoom.slug.substring(0, 16)}</h1>
                <div className="text-zinc-400">
                    Host: <RoomHostDisplay slug={currentRoom.slug} initialHostName={currentRoom.hostName} className="font-semibold text-white" />
                </div>
            </div>

            <div className="bg-black aspect-video rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden">
                <StreamPlayer slug={currentRoom.slug} />
            </div>

            <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                <h2 className="text-lg font-medium mb-2">Room Info</h2>
                <p className="text-sm text-zinc-400">
                    You are watching <RoomHostDisplay slug={currentRoom.slug} initialHostName={currentRoom.hostName} className="text-zinc-300 font-medium" />'s stream.
                </p>
                {/* Future guest/chat features can be placed here */}
            </div>
        </div>
    );
}
