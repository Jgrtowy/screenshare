"use client";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export default function Home() {
    const { data: session } = authClient.useSession();

    return (
        <div className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
            <div className="flex w-full max-w-xl flex-col gap-6 rounded-3xl border bg-card p-8 shadow-sm">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold">screenshare</h1>
                    <p className="text-sm">I really need to come up with a name for this app</p>
                </div>
                {session && (
                    <div className="flex flex-col gap-4 rounded-2xl border bg-background/60 p-4">
                        <p className="text-sm text-muted-foreground">Signed in as {session.user.name}</p>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" onClick={() => redirect("/account")}>
                                Go to Account
                            </Button>
                            <Button variant="outline" type="button" onClick={() => authClient.signOut()}>
                                Sign out
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
