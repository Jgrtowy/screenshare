"use client";

import { useEffect, useRef, useState } from "react";

export function StreamPlayer({ slug }: { slug: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

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

                const srsApiUrl = `https://${process.env.NEXT_PUBLIC_SRS_API_HOST}/rtc/v1/play/`;
                const streamUrl = `webrtc://${process.env.NEXT_PUBLIC_RTC_SERVER_IP}/live/${slug}`;

                // 2. Exchange SDP with SRS
                const response = await fetch(srsApiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        api: srsApiUrl,
                        streamurl: streamUrl,
                        sdp: offer.sdp,
                    }),
                });

                const data = await response.json();

                if (data.code !== 0) {
                    throw new Error(`SRS WebRTC error: ${data.code}`);
                }

                // 3. Set remote description from SRS answer
                await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            } catch (err: any) {
                console.error("WebRTC Error:", err);
                setError("Stream is offline or failed to load");
            }
        };

        startPlay();

        return () => {
            pc.close();
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [slug]);

    return (
        <div className="relative w-full h-full bg-black">
            {error && <div className="absolute inset-0 flex items-center justify-center text-zinc-400 z-10 bg-black/50">{error}</div>}
            <video ref={videoRef} autoPlay controls muted playsInline className="w-full h-full object-contain" />
        </div>
    );
}
