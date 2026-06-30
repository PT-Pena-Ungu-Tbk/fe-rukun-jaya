/**
 * Catch-all proxy route: /api/v1/* → Railway backend
 * Solusi CORS: browser kirim ke localhost, Next.js server forward ke Railway
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BASE_URL_API?.replace(/\/+$/, "");

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!BACKEND) {
    console.error("[proxy] BASE_URL_API is not configured in environment variables.");
    return NextResponse.json(
      { message: "Konfigurasi server API belum diset (BASE_URL_API)" },
      { status: 500 }
    );
  }

  const { path } = await params;
  const url = new URL(req.url);
  let target = "";
  if (path[0] === "suppliers") {
    const backendWithoutV1 = BACKEND.replace(/\/v1$/, "");
    target = `${backendWithoutV1}/suppliers${path.slice(1).length > 0 ? "/" + path.slice(1).join("/") : ""}${url.search}`;
  } else {
    target = `${BACKEND}/${path.join("/")}${url.search}`;
  }

  // Forward headers tapi hapus host (biar ga conflict)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") headers.set(key, value);
  });

  const isBodyMethod = !["GET", "HEAD"].includes(req.method);

  try {
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: isBodyMethod ? req.body : undefined,
      // @ts-ignore — duplex needed for streaming body in Node
      duplex: "half",
    });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip hop-by-hop, content-encoding, and content-length headers
      if (!["connection", "keep-alive", "transfer-encoding", "content-encoding", "content-length"].includes(lowerKey)) {
        resHeaders.set(key, value);
      }
    });

    return new NextResponse(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[proxy] fetch error:", err);
    return NextResponse.json({ message: "Backend tidak dapat dijangkau" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
