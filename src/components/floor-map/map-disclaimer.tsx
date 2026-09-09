interface MapDisclaimerProps {
  /** Where to write about the room data, or null when none is configured. */
  supportEmail: string | null
}

/**
 * Closes the map with the address to write to about the data on it.
 *
 * Renders nothing without an address: an invitation to report something with
 * nowhere to send it is worse than saying nothing.
 */
export function MapDisclaimer({ supportEmail }: MapDisclaimerProps) {
  if (!supportEmail) return null

  const subject = encodeURIComponent("room data")

  return (
    <p className="border-t pt-5 text-center text-xs text-muted-foreground">
      Something here not right? Write to{" "}
      <a
        href={`mailto:${supportEmail}?subject=${subject}`}
        className="text-primary underline underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {supportEmail}
      </a>
      .
    </p>
  )
}
