"use client"

import { useAuth } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { SidebarToggle } from "./Sidebar"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useAdmin } from "@/lib/useAdmin"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface HeaderProps {
  onSidebarToggle?: () => void
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { isAdmin, loading } = useAdmin()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={cn(
        "w-full mx-auto flex h-14 items-center justify-between px-4 transition-all duration-300",
        !loading && isAdmin ? "lg:pl-80 max-w-6xl" : "max-w-5xl"
      )}>
        <div className="flex items-center gap-2">
          {/* Toggle da sidebar para admins */}
          {onSidebarToggle && <SidebarToggle onToggle={onSidebarToggle} />}
          
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" />
                <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1" />
                <path d="M12 12v6" />
                <path d="M8 9V3" />
                <path d="M16 9V3" />
                <path d="m7 15 5-3 5 3" />
              </svg>
            </div>
            <span className="font-medium hidden sm:inline-block">Sistema de Licitações</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="bg-primary/10 p-1 rounded-full">
                  <User size={16} className="text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {user.email}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Sair"
                title="Sair"
              >
                <LogOut size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 