import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("google-site-verification: googleac303a1d7cf60190.html", {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
