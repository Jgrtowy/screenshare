import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { streamurl, sdp } = body;

        const SRS_API_HOST = process.env.SRS_API_HOST;

        if (!SRS_API_HOST) {
            return NextResponse.json({ error: "Missing SRS API host" }, { status: 500 });
        }

        const srsApiUrl = `${SRS_API_HOST}/rtc/v1/play/`;

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        const resp = await fetch(srsApiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ api: srsApiUrl, streamurl, sdp }),
        });

        const data = await resp.json();
        return NextResponse.json(data, { status: resp.status });
    } catch (err: unknown) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
