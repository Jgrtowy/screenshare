import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "~/db/db";
import { roomsSchema, streamKeysSchema } from "~/db/schema";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // We only care about the on_publish event for validation
        if (body.action !== "on_publish") {
            return NextResponse.json({ code: 0 });
        }

        const roomSlug = body.stream;
        const paramStr = body.param || "";
        
        // Parse the stream key from the params (e.g., ?key=your_stream_key)
        const params = new URLSearchParams(paramStr);
        const streamKey = params.get("key") || params.get("k");

        if (!roomSlug || !streamKey) {
            console.error("SRS Webhook Error: Missing stream name or stream key.");
            return NextResponse.json({ code: 1, message: "Missing stream name or key" });
        }

        // 1. Validate the stream key
        const keys = await db
            .select()
            .from(streamKeysSchema)
            .where(eq(streamKeysSchema.key, streamKey))
            .limit(1);

        const validKey = keys[0];

        if (!validKey) {
            console.error("SRS Webhook Error: Invalid stream key.");
            return NextResponse.json({ code: 1, message: "Invalid stream key" });
        }

        // 2. Set the host of the room to the user with the assigned stream key
        // By inserting a new room or updating an existing one with the same slug.
        await db
            .insert(roomsSchema)
            .values({
                slug: roomSlug,
                userId: validKey.userId,
            })
            .onConflictDoUpdate({
                target: roomsSchema.slug,
                set: {
                    userId: validKey.userId,
                },
            });

        // 0 code allows the stream to publish on SRS
        return NextResponse.json({ code: 0 });

    } catch (error) {
        console.error("SRS Webhook Error:", error);
        // Returning a non-zero code rejects the stream
        return NextResponse.json({ code: 1, message: "Internal Server Error" });
    }
}
