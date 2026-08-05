"use client"

import { ChevronDown, LogOut } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { SignOutDialog } from "./sign-out-dialog"

interface UserMenuProps {
  name: string
  email: string
  image?: string | null
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const studentId = email.split("@")[0] // Student ID is the local part of the school address: 00000000@usc.edu.ph.

  function handleSignOutSelect(event: Event) {
    event.preventDefault()

    setMenuOpen(false)
    setConfirmOpen(true)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          {/* Sits on the brand header, so the ghost variant's muted hover and
              the brand-blue focus ring (1.0:1 against this background) are both
              overridden with the header foreground. */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-header-foreground hover:bg-header-foreground/15 hover:text-header-foreground focus-visible:border-header-foreground focus-visible:ring-header-foreground/50 aria-expanded:bg-header-foreground/15 aria-expanded:text-header-foreground"
          >
            {image ? (
              <Image
                src={image}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 rounded-full"
              />
            ) : null}
            <span className="font-mono tabular-nums">{studentId}</span>

            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 text-header-foreground/80 transition-transform duration-150 motion-reduce:transition-none",
                menuOpen && "rotate-180"
              )}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            {image ? (
              <Image
                src={image}
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-full"
              />
            ) : null}

            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </span>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={handleSignOutSelect}
            className="text-destructive! **:text-destructive!"
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog
        email={email}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
    </>
  )
}
