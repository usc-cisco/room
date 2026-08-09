import type { MetadataRoute } from "next"

import { env } from "@/lib/env"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", env.appUrl).toString(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
