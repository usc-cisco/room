import type { MetadataRoute } from "next"

import { env } from "@/lib/env"

/**
 * The landing page is the only thing a crawler can see — everything else is
 * behind the session and the allowlist — so the whole site is open except the
 * auth endpoints, which answer nothing useful and only burn crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: new URL("/sitemap.xml", env.appUrl).toString(),
    host: env.appUrl,
  }
}
