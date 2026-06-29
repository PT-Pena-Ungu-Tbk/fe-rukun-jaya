/**
 * Catch-all proxy route: /api/v1/* → Railway backend
 * Solusi CORS: browser kirim ke localhost, Next.js server forward ke Railway
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://be-rukun-jaya-production.up.railway.app/api/v1";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const url = new URL(req.url);
  const target = `${BACKEND}/${path.join("/")}${url.search}`;

  // Forward headers tapi hapus host & accept-encoding
  // (accept-encoding dihapus supaya Railway kirim plain text, bukan gzip)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "accept-encoding") headers.set(key, value);
  });

  const isBodyMethod = !["GET", "HEAD"].includes(req.method);
  const body = isBodyMethod ? await req.text() : undefined;

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    // Baca response sebagai text (Node.js fetch sudah auto-decompress gzip)
    const text = await res.text();

    if (!res.ok) {
      console.error(`[proxy] ${req.method} ${target} → ${res.status}`, text.slice(0, 500));
    }

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[proxy] fetch error:", err);
    return NextResponse.json({ message: "Backend tidak dapat dijangkau", error: String(err) }, { status: 502 });
  }
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
