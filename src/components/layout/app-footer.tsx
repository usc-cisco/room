import { Container } from "./container"

const ORG_URL = "https://github.com/usc-cisco"

export function AppFooter() {
  return (
    <footer className="border-t pb-[env(safe-area-inset-bottom)]">
      <Container className="py-4">
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}{" "}
          {/* Opens away from the map rather than replacing it: this is a
              credit, not a way out of the app. */}
          <a
            href={ORG_URL}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:rounded-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            USC-CISCO
          </a>{" "}
          {/* Names the app, the way the header does beside the logo. */}
          &middot; room
        </p>
      </Container>
    </footer>
  )
}
