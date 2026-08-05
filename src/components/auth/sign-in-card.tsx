import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { GoogleSignInButton } from "./google-sign-in-button"

export function SignInCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        {/* CardTitle renders a div, so the real heading lives inside it. */}
        <CardTitle>
          <h1>Sign in to Room</h1>
        </CardTitle>
        <CardDescription>Google is the only way in.</CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInButton />
      </CardContent>
    </Card>
  )
}
