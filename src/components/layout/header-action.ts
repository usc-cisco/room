/**
 * Shared overrides for ghost buttons sitting on the brand-blue header bar.
 *
 * The stock ghost variant hovers to `muted` and focuses to a brand-blue ring —
 * both near-invisible against the header (the ring is 1.0:1 on it). Everything
 * here is re-derived from the header foreground instead.
 */
export const headerActionClassName =
  "text-header-foreground hover:bg-header-foreground/15 hover:text-header-foreground focus-visible:border-header-foreground focus-visible:ring-header-foreground/50 aria-expanded:bg-header-foreground/15 aria-expanded:text-header-foreground"
