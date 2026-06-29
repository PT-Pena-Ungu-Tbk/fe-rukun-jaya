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
  // Hanya forward header yang relevan — jangan kirim cookie browser ke backend
  const headers = new Headers();
  const authToken = req.headers.get("authorization");
  if (authToken) headers.set("authorization", authToken);
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");

  const isBodyMethod = !["GET", "HEAD"].includes(req.method);
  const body = isBodyMethod ? await req.text() : undefined;

  if (isBodyMethod && body) {
    console.log(`[proxy] ${req.method} ${target} body:`, body.slice(0, 1000));
  }

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body,
    });

    const contentType = res.headers.get("content-type") ?? "application/json";

    if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
      const blob = await res.arrayBuffer();
      return new NextResponse(blob, {
        status: res.status,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": res.headers.get("content-disposition") ?? "attachment",
        },
      });
    }

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
