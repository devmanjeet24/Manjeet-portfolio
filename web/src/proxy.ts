import { NextResponse, type NextRequest } from "next/server";
import { projects } from "@/data/projects";

const KNOWN = new Set(projects.map((p) => p.slug));

/**
 * Unknown /projects/<slug> gets a real 404 status.
 * (With Cache Components the page shell is sent first, so a notFound() inside the page can only
 * add `noindex`, not change the status. Checking here, before rendering, can.)
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !KNOWN.has(slug)) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/projects/:slug" };
