import { and, desc, eq, gt, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import db from "~/db/db";
import { roomsSchema, roomViewersSchema } from "~/db/schema";

const VIEWER_TTL_MS = 15000;

type ViewerPayload = {
    viewerKey?: string;
    name?: string;
    image?: string | null;
    isAuthenticated?: boolean;
};

function getCutoff() {
    return new Date(Date.now() - VIEWER_TTL_MS);
}

async function roomExists(slug: string) {
    const room = await db.select({ slug: roomsSchema.slug }).from(roomsSchema).where(eq(roomsSchema.slug, slug)).limit(1);

    return room.length > 0;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    if (!(await roomExists(slug))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cutoff = getCutoff();

    await db.delete(roomViewersSchema).where(and(eq(roomViewersSchema.roomSlug, slug), lt(roomViewersSchema.lastSeenAt, cutoff)));

    const viewers = await db
        .select({
            viewerKey: roomViewersSchema.viewerKey,
            name: roomViewersSchema.name,
            image: roomViewersSchema.image,
            isAuthenticated: roomViewersSchema.isAuthenticated,
            lastSeenAt: roomViewersSchema.lastSeenAt,
        })
        .from(roomViewersSchema)
        .where(and(eq(roomViewersSchema.roomSlug, slug), gt(roomViewersSchema.lastSeenAt, cutoff)))
        .orderBy(desc(roomViewersSchema.lastSeenAt));

    return NextResponse.json({ viewers });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    if (!(await roomExists(slug))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as ViewerPayload;
    const viewerKey = body.viewerKey?.trim();
    const name = body.name?.trim();

    if (!viewerKey || !name) {
        return NextResponse.json({ error: "Missing viewer data" }, { status: 400 });
    }

    const now = new Date();

    await db
        .insert(roomViewersSchema)
        .values({
            roomSlug: slug,
            viewerKey,
            name,
            image: body.image ?? null,
            isAuthenticated: body.isAuthenticated ?? false,
            lastSeenAt: now,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [roomViewersSchema.roomSlug, roomViewersSchema.viewerKey],
            set: {
                name,
                image: body.image ?? null,
                isAuthenticated: body.isAuthenticated ?? false,
                lastSeenAt: now,
                updatedAt: now,
            },
        });

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const body = (await req.json().catch(() => ({}))) as ViewerPayload;
    const viewerKey = body.viewerKey?.trim();

    if (!viewerKey) {
        return NextResponse.json({ error: "Missing viewer key" }, { status: 400 });
    }

    await db.delete(roomViewersSchema).where(and(eq(roomViewersSchema.roomSlug, slug), eq(roomViewersSchema.viewerKey, viewerKey)));

    return NextResponse.json({ ok: true });
}
