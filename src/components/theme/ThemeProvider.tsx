"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remover classes antigas
    root.classList.remove("light", "dark")
    
    // Adicionar classe de transição, se necessário
    if (disableTransitionOnChange) {
      root.classList.add("disable-transition")
    }

    // Aplicar tema
    if (theme === "system" && enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      
      root.classList.add(systemTheme)
      root.style.colorScheme = systemTheme
    } else {
      root.classList.add(theme)
      root.style.colorScheme = theme
    }

    // Remover classe de transição, se necessário
    if (disableTransitionOnChange) {
      setTimeout(() => {
        root.classList.remove("disable-transition")
      }, 0)
    }
  }, [theme, enableSystem, disableTransitionOnChange])

  // Adicionar listener para mudanças no tema do sistema
  useEffect(() => {
    if (!enableSystem) return
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        
        root.classList.remove("light", "dark")
        root.classList.add(systemTheme)
        root.style.colorScheme = systemTheme
      }
    }
    
    mediaQuery.addEventListener("change", handleChange)
    
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, enableSystem])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      // Salvar preferência no localStorage
      localStorage.setItem("theme", theme)
      setTheme(theme)
    },
  }

  // Carregar tema do localStorage no carregamento inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null
    
    if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return context
} 