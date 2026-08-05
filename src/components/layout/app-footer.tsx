import { Container } from "./container"

export function AppFooter() {
  return (
    <footer className="border-t pb-[env(safe-area-inset-bottom)]">
      <Container className="py-4">
        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 CISCO
        </p>
      </Container>
    </footer>
  )
}
