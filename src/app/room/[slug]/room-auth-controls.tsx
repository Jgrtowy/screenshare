"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

type RoomSessionUser = {
    name: string;
    image?: string | null;
} | null;

export function RoomAuthControls({ sessionUser }: { sessionUser: RoomSessionUser }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.refresh();
    };

    const handleSignIn = async () => {
        await authClient.signIn.social({ provider: "discord", callbackURL: `${window.location.origin}/room/${window.location.pathname.split("/").slice(-1)[0]}` });
        router.refresh();
    };

    if (!sessionUser) {
        return (
            <Button size="sm" variant="outline" onClick={handleSignIn}>
                Sign in with Discord
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
            {sessionUser.image ? <div aria-hidden="true" className="h-8 w-8 rounded-full bg-zinc-800 bg-cover bg-center" style={{ backgroundImage: `url(${sessionUser.image})` }} /> : <div className="h-8 w-8 rounded-full bg-zinc-800" />}
            <span className="text-sm font-medium text-white">{sessionUser.name}</span>
            <Button size="sm" variant="outline" onClick={handleSignOut}>
                Sign out
            </Button>
        </div>
    );
}
