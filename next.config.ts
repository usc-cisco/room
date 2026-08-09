import type { NextConfig } from "next"

/**
 * Features the app never asks for. Denying them outright means a script that
 * somehow got in cannot ask either.
 */
const DENIED_FEATURES = [
  "accelerometer",
  "camera",
  "display-capture",
  "geolocation",
  "gyroscope",
  "magnetometer",
  "microphone",
  "payment",
  "usb",
]

/**
 * The browser-side defences, switched on for every response.
 *
 * Not a Content-Security-Policy: a useful one here needs a nonce threaded
 * through the document on every render, which is its own piece of work rather
 * than a line in this file.
 *
 * Exported so the test asserts against the array the app actually serves.
 */
export const SECURITY_HEADERS = [
  {
    // Sent in development too. A browser ignores it over plain `http://`, so a
    // dev server saying it changes nothing — and a production-only branch is a
    // thing that can quietly be wrong on the one deploy that matters.
    //
    // No `preload`: that commits the whole apex domain, which is not this app's
    // to commit.
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Stops a browser second-guessing a Content-Type and running something as
    // script.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Nothing here is meant to be framed: the app has no iframes and is
    // embedded nowhere, so the whole class of clickjacking goes away.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Other origins learn that a request came from here, not which room
    // someone was looking at. Same-origin navigation keeps the full path.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: DENIED_FEATURES.map((feature) => `${feature}=()`).join(", "),
  },
  {
    // Safe because signing in is a top-level redirect to Google rather than a
    // popup — see `google-sign-in-button.tsx`. If better-auth is ever switched
    // to popup mode this has to become `same-origin-allow-popups`, or the
    // popup and the opener lose their handle on each other.
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
]

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon and must not be bundled.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    // One entry for everything Next serves: pages, route handlers and the
    // static assets under `/_next`.
    return [{ source: "/:path*", headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
