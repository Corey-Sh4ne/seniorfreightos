import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isOpsRoute = createRouteMatcher(["/ops(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  await auth.protect();

  // Role-based route protection layered on top of Clerk auth.
  // The role is the source of truth in publicMetadata, so we fetch the
  // user rather than trusting anything client-supplied.
  const { userId } = await auth();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = user.publicMetadata?.role;

  if (role === "client_user" && !isPortalRoute(request)) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (role === "dispatcher" && !isOpsRoute(request)) {
    return NextResponse.redirect(new URL("/ops", request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
