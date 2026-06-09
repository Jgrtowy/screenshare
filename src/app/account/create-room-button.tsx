"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createRoomAction } from "./actions";

export function CreateRoomButton() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await createRoomAction(name);
            setOpen(false);
            setName("");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button onClick={() => setOpen(true)}>Create Room</Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Room</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-medium text-foreground">Room Name</Label>
                            <Input placeholder="My Awesome Stream" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} autoFocus required />
                        </div>
                    </form>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
