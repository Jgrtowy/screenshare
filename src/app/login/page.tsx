"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";

export default function Auth() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const signIn = async () => {
        await authClient.signIn.email({ email, password, callbackURL: "/account" });
    };

    return (
        <div className="flex justify-center items-center w-screen h-dvh font-mono">
            <div className="flex flex-col gap-4">
                <h1>sign in</h1>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                <Button onClick={signIn}>Sign In</Button>
            </div>
        </div>
    );
}
