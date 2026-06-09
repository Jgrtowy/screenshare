"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { updateRoomDiscordServerAction } from "./actions";

type RoomDiscordServerButtonProps = {
    roomId: number;
    roomName: string;
    initialDiscordServerId: string;
};

export function RoomDiscordServerButton({ roomId, roomName, initialDiscordServerId }: RoomDiscordServerButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [discordServerId, setDiscordServerId] = useState(initialDiscordServerId);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputId = useId();

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            setDiscordServerId(initialDiscordServerId);
            setMessage(null);
            setError(null);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            await updateRoomDiscordServerAction({ roomId, discordServerId });
            setMessage("Discord server saved.");
            setOpen(false);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save Discord server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
                Settings
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{roomName}</DialogTitle>
                    </DialogHeader>

                    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                        <Label htmlFor={inputId}>Discord server ID</Label>
                        <Input id={inputId} value={discordServerId} onChange={(event) => setDiscordServerId(event.target.value)} placeholder="123456789012345678" disabled={loading} inputMode="numeric" autoComplete="off" />
                        <p className="text-xs text-muted-foreground">Only users in this Discord server will see the room on /rooms. Leave blank to clear the assignment.</p>
                        {message ? <div className="text-sm text-muted-foreground">{message}</div> : null}
                        {error ? <div className="text-sm text-destructive">{error}</div> : null}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
