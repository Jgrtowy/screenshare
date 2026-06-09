"use client";

import { redirect } from "next/navigation";
import React from "react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export default function Auth() {
    const [isLoading, setIsLoading] = React.useState(false);

    const session = authClient.useSession();

    if (session?.data?.user.id) {
        redirect("/");
    }

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
        <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
            <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl border bg-card p-8 shadow-sm">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Sign in</h1>
                    <p className="text-sm text-muted-foreground">Use Discord to enter room tools.</p>
                </div>
                <Button onClick={signIn} disabled={isLoading}>
                    {isLoading ? "Connecting..." : "Sign in with Discord"}
                </Button>
            </div>
        </div>
    );
}
