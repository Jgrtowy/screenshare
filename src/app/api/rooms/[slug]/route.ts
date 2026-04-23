import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "~/db/db";
import { roomsSchema, user } from "~/db/schema";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const room = await db
        .select({
            slug: roomsSchema.slug,
            hostName: user.name,
        })
        .from(roomsSchema)
        .innerJoin(user, eq(roomsSchema.userId, user.id))
        .where(eq(roomsSchema.slug, slug))
        .limit(1);

    if (!room.length) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(room[0]);
}
