"use client";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export default function Home() {
    const { data: session } = authClient.useSession();

    return (
        <div className="flex flex-col justify-center items-center w-screen h-dvh  dark:bg-zinc-900 bg-white dark:text-white text-black font-mono gap-4">
            <h1>nothing to see here in particular</h1>
            {session && (
                <div className="flex flex-col justify-center items-center gap-4">
                    <p>Signed in as {session.user.name}</p>
                    <div className="flex gap-2">
                        <Button variant="default" type="button" onClick={() => redirect("/account")}>
                            Go to Account
                        </Button>
                        <Button variant="default" type="button" onClick={() => authClient.signOut()}>
                            Sign out
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
