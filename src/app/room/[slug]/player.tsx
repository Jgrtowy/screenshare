"use client";

import "plyr-react/plyr.css";
import { useEffect, useRef, useState } from "react";

type PlyrInstance = {
    destroy: () => void;
};

export function StreamPlayer({ slug }: { slug: string }) {
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<PlyrInstance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!videoRef.current) return;

        let active = true;

        const setupPlayer = async () => {
            const { default: Plyr } = await import("plyr");

            if (!active || !videoRef.current) return;

            playerRef.current = new Plyr(videoRef.current, {
                controls: ["play", "mute", "volume", "fullscreen"],
            });
        };

        void setupPlayer();

        return () => {
            active = false;
            playerRef.current?.destroy();
            playerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const pc = new RTCPeerConnection();

        // We only want to receive media
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });

        pc.ontrack = (event) => {
            if (videoRef.current && event.streams.length > 0) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        const startPlay = async () => {
            try {
                // 1. Create WebRTC offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const serverExchangeUrl = `/api/srs/exchange`;
                const streamUrl = `webrtc://${process.env.NEXT_PUBLIC_RTC_SERVER_IP}/live/${slug}`;

                // 2. Exchange SDP with SRS via server-side proxy (uses SRS_API_USERNAME/SRS_API_PASSWORD)
                const response = await fetch(serverExchangeUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ streamurl: streamUrl, sdp: offer.sdp }),
                });

                const data = await response.json();

                if (data.code !== 0) {
                    throw new Error(`SRS WebRTC error: ${data.code}`);
                }

                // 3. Set remote description from SRS answer
                await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            } catch (err: unknown) {
                console.error("WebRTC Error:", err);
                setError("Stream is offline or failed to load");
            }
        };

        startPlay();
        setLoading(false);

        return () => {
            pc.close();
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [slug]);

    return (
        <div className="relative aspect-video w-full bg-black">
            {error && <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground">{error}</div>}
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground">Loading...</div>}
            <video ref={videoRef} autoPlay controls muted playsInline className="h-full w-full object-contain" />
        </div>
    );
}
