import { describe, expect, test } from "bun:test"

import nextConfig, { SECURITY_HEADERS } from "../next.config"

/**
 * These pin the browser-side defences so that dropping or weakening one is a
 * deliberate edit with a failing test attached, rather than a quiet diff in a
 * config file nobody reads.
 */
const headerValue = (key: string) =>
  SECURITY_HEADERS.find((header) => header.key === key)?.value

describe("security headers", () => {
  test("are served on every route", async () => {
    const routes = await nextConfig.headers!()

    expect(routes).toHaveLength(1)
    expect(routes[0].source).toBe("/:path*")
    expect(routes[0].headers).toBe(SECURITY_HEADERS)
  })

  test("keep the browser on HTTPS for at least a year", () => {
    const hsts = headerValue("Strict-Transport-Security") ?? ""
    const maxAge = Number(hsts.match(/max-age=(\d+)/)?.[1] ?? 0)

    expect(maxAge).toBeGreaterThanOrEqual(31_536_000)
    expect(hsts).toContain("includeSubDomains")
  })

  test("refuse framing and content sniffing outright", () => {
    expect(headerValue("X-Frame-Options")).toBe("DENY")
    expect(headerValue("X-Content-Type-Options")).toBe("nosniff")
  })

  test("do not hand the path to other origins", () => {
    expect(headerValue("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    )
  })

  test("deny the device features the app never uses", () => {
    const policy = headerValue("Permissions-Policy") ?? ""

    for (const feature of ["camera", "microphone", "geolocation", "payment"]) {
      expect(policy).toContain(`${feature}=()`)
    }
  })

  // `same-origin` is safe only while signing in is a top-level redirect. A move
  // to popup sign-in has to relax this to `same-origin-allow-popups`.
  test("isolate the browsing context", () => {
    expect(headerValue("Cross-Origin-Opener-Policy")).toBe("same-origin")
  })
})
