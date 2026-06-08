"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export default function Auth() {
    const [isLoading, setIsLoading] = React.useState(false);

    const signIn = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "discord",
                callbackURL: "/",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center w-screen h-dvh font-mono bg-zinc-950 text-white">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/30">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Sign in</h1>
                    <p className="text-sm text-zinc-400">Use Discord to enter room tools.</p>
                </div>
                <Button onClick={signIn} disabled={isLoading}>
                    {isLoading ? "Connecting..." : "Sign in with Discord"}
                </Button>
            </div>
        </div>
    );
}
