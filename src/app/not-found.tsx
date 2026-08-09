import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { PageStatus } from "@/components/layout/page-status"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center p-6">
      <PageStatus
        icon={FileQuestion}
        title="404 Not Found"
        description="That address is not part of this app. There is one screen here, and this is not it."
      >
        <Button asChild>
          <Link href="/">Back to the app</Link>
        </Button>
      </PageStatus>
    </main>
  )
}
