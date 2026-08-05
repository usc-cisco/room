import Image from "next/image"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { SignOutButton } from "./sign-out-button"

interface AccountCardProps {
  name: string
  email: string
  image?: string | null
}

export function AccountCard({ name, email, image }: AccountCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          <h1 className="truncate">{name}</h1>
        </CardTitle>
        <CardDescription className="truncate">{email}</CardDescription>
        {image ? (
          <CardAction>
            <Image
              src={image}
              alt=""
              width={36}
              height={36}
              className="rounded-full"
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <SignOutButton />
      </CardContent>
    </Card>
  )
}
