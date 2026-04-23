"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RoomHostDisplay({ slug, initialHostName, className = "" }: { slug: string, initialHostName: string, className?: string }) {
    const { data } = useSWR(`/api/rooms/${slug}`, fetcher, {
        fallbackData: { hostName: initialHostName },
        refreshInterval: 10000, // Re-fetch every 10 seconds
        revalidateOnFocus: true,
    });

    const hostName = data?.hostName || initialHostName;

    return <span className={className}>{hostName}</span>;
}
