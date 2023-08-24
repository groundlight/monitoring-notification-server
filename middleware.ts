import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    console.log("middleware!");
    console.log("Request url: " + request.url);

    let baseUrl = "http://localhost:8000";
    if (process.env.NODE_ENV === "production") {
        baseUrl = "http://172.17.0.1:8000";
    }
    if (global.process.env.BACKEND_BASE_URL) {
        baseUrl = global.process.env.BACKEND_BASE_URL;
    }
    const redirectUrl = new URL(request.nextUrl.pathname, baseUrl);
    console.log("Rewritten to: " + redirectUrl.toJSON() + "\n");
    return NextResponse.rewrite(redirectUrl);
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: "/api/:path*",
};
