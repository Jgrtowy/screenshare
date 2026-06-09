"use client";

import { Loader2, Maximize2, Minimize2, Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function StreamPlayer({ slug }: { slug: string }) {
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const shellRef = useRef<HTMLDivElement | null>(null);
    const lastVolumeRef = useRef(1);
    const hideControlsTimerRef = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [cursorHidden, setCursorHidden] = useState(false);

    const clearControlsTimer = () => {
        if (hideControlsTimerRef.current !== null) {
            window.clearTimeout(hideControlsTimerRef.current);
            hideControlsTimerRef.current = null;
        }
    };

    const revealControls = () => {
        setControlsVisible(true);
        setCursorHidden(false);

        if (!isPlaying || isLoading || error) {
            return;
        }

        clearControlsTimer();
        hideControlsTimerRef.current = window.setTimeout(() => {
            setControlsVisible(false);
            setCursorHidden(true);
        }, 2200);
    };

    useEffect(() => {
        return () => clearControlsTimer();
    }, []);

    useEffect(() => {
        if (!isPlaying || isLoading || error) {
            setControlsVisible(true);
            setCursorHidden(false);
            clearControlsTimer();
            return;
        }

        revealControls();

        return () => clearControlsTimer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, isLoading, error]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const syncPlaybackState = () => {
            setIsPlaying(!video.paused && !video.ended);
        };

        const syncVolumeState = () => {
            const nextVolume = clamp(video.volume, 0, 1);

            setVolume(nextVolume);
            setIsMuted(video.muted || nextVolume === 0);

            if (nextVolume > 0) {
                lastVolumeRef.current = nextVolume;
            }
        };

        const syncDurationState = () => {
            setIsLoading(false);
        };

        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => setIsLoading(false);

        const syncFullscreenState = () => {
            setIsFullscreen(document.fullscreenElement === shellRef.current);
        };

        video.addEventListener("play", syncPlaybackState);
        video.addEventListener("pause", syncPlaybackState);
        video.addEventListener("loadedmetadata", syncDurationState);
        video.addEventListener("durationchange", syncDurationState);
        video.addEventListener("volumechange", syncVolumeState);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("playing", handlePlaying);
        video.addEventListener("ended", syncPlaybackState);
        document.addEventListener("fullscreenchange", syncFullscreenState);

        syncPlaybackState();
        syncVolumeState();
        syncDurationState();
        syncFullscreenState();

        return () => {
            video.removeEventListener("play", syncPlaybackState);
            video.removeEventListener("pause", syncPlaybackState);
            video.removeEventListener("loadedmetadata", syncDurationState);
            video.removeEventListener("durationchange", syncDurationState);
            video.removeEventListener("volumechange", syncVolumeState);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("playing", handlePlaying);
            video.removeEventListener("ended", syncPlaybackState);
            document.removeEventListener("fullscreenchange", syncFullscreenState);
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        let active = true;
        const pc = new RTCPeerConnection();

        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });

        pc.ontrack = (event) => {
            if (!active || event.streams.length === 0) {
                return;
            }

            video.srcObject = event.streams[0];

            void video.play().catch(() => {
                setIsPlaying(false);
            });
        };

        const startPlay = async () => {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const serverExchangeUrl = `/api/srs/exchange`;
                const streamUrl = `webrtc://${process.env.NEXT_PUBLIC_RTC_SERVER_IP}/live/${slug}`;

                const response = await fetch(serverExchangeUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ streamurl: streamUrl, sdp: offer.sdp }),
                });

                const data = await response.json();

                if (data.code !== 0) {
                    throw new Error(`SRS WebRTC error: ${data.code}`);
                }

                await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }));
            } catch (err: unknown) {
                console.error("WebRTC Error:", err);
                setError("Stream is offline or failed to load");
                setIsLoading(false);
            }
        };

        setIsLoading(true);
        void startPlay();

        return () => {
            active = false;
            if (video) {
                video.srcObject = null;
            }

            pc.close();
        };
    }, [slug]);

    const togglePlay = async () => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        revealControls();

        if (video.paused) {
            await video.play().catch(() => {
                setError("Stream is offline or failed to load");
            });
        } else {
            video.pause();
        }
    };

    const setVideoVolume = (nextVolume: number) => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const normalized = clamp(nextVolume, 0, 1);

        video.volume = normalized;
        video.muted = normalized === 0;
        setVolume(normalized);
        setIsMuted(normalized === 0);

        if (normalized > 0) {
            lastVolumeRef.current = normalized;
        }

        revealControls();
    };

    const toggleMute = () => {
        if (isMuted || volume === 0) {
            setVideoVolume(lastVolumeRef.current || 0.65);
            return;
        }

        lastVolumeRef.current = volume || lastVolumeRef.current;
        setVideoVolume(0);
    };

    const toggleFullscreen = async () => {
        const shell = shellRef.current;

        if (!shell) {
            return;
        }

        revealControls();

        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => undefined);
            return;
        }

        if (shell.requestFullscreen) {
            await shell.requestFullscreen().catch(() => undefined);
            return;
        }

        const anyShell = shell as HTMLElement & {
            webkitRequestFullscreen?: () => Promise<void> | void;
        };

        await anyShell.webkitRequestFullscreen?.();
    };

    const controlPanelClassName = controlsVisible || !isPlaying || isLoading || error ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3";

    return (
        <section
            ref={shellRef}
            aria-label="Video player"
            className={`group relative aspect-video w-full overflow-hidden bg-background ${isFullscreen ? "rounded-none border-0" : "rounded-3xl border"} ${cursorHidden ? "cursor-none" : "cursor-auto"}`}
            onPointerMove={revealControls}
            onPointerDown={revealControls}
            onFocusCapture={revealControls}
            onKeyDown={revealControls}
            onMouseLeave={() => {
                clearControlsTimer();
                setControlsVisible(true);
                setCursorHidden(false);
            }}
        >
            <video ref={videoRef} autoPlay muted={isMuted} playsInline className="h-full w-full object-contain" />

            <div className={`absolute inset-x-0 bottom-0 p-4 sm:p-5 transition-all duration-300 ${controlPanelClassName}`}>
                <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                                void togglePlay();
                            }}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
                        </Button>

                        <Button type="button" variant="outline" size="icon-sm" onClick={toggleMute} aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}>
                            {isMuted || volume === 0 ? <VolumeX data-icon="inline-start" /> : volume < 0.5 ? <Volume1 data-icon="inline-start" /> : <Volume2 data-icon="inline-start" />}
                        </Button>

                        <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVideoVolume(Number(event.currentTarget.value))} className="w-20 min-w-0 cursor-pointer accent-primary" />
                    </div>

                    <div className="flex items-center justify-start md:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                                void toggleFullscreen();
                            }}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 data-icon="inline-start" /> : <Maximize2 data-icon="inline-start" />}
                        </Button>
                    </div>
                </div>
            </div>

            {(isLoading || error) && (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center backdrop-blur-sm">
                    <div className="max-w-sm p-6">
                        {error ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin" />
                                <div className="text-lg font-semibold">{error}</div>
                                <div className="text-sm">Reconnect the stream and the deck will recover automatically.</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin" data-icon="inline-start" />
                                <div className="text-lg font-semibold">Tuning the feed</div>
                                <div className="text-sm">Syncing with the broadcast source.</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
