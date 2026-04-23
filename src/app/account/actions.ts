"use server";

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import db from "~/db/db";
import { roomsSchema } from "~/db/schema";
import { auth } from "~/lib/auth";

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
