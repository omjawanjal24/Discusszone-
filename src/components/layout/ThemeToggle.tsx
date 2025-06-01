
"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react" // Import Laptop for system theme
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else { // theme is "system" or initially undefined (which next-themes often defaults to system)
      setTheme("light")
    }
  }

  if (!mounted) {
    // To prevent hydration mismatch, render a placeholder or null until mounted.
    // Rendering a button structure helps avoid layout shifts.
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Toggle theme">
        <Sun className="h-[1.2rem] w-[1.2rem]" /> {/* Default placeholder icon */}
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  let IconComponent
  let currentThemeLabel = "Toggle theme"

  if (theme === "light") {
    IconComponent = <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
    currentThemeLabel = "Switch to Dark Theme"
  } else if (theme === "dark") {
    IconComponent = <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
    currentThemeLabel = "Switch to System Theme"
  } else { // theme === "system"
    IconComponent = <Laptop className="h-[1.2rem] w-[1.2rem] transition-all" />
    currentThemeLabel = "Switch to Light Theme"
  }

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label={currentThemeLabel}>
      {IconComponent}
      <span className="sr-only">{currentThemeLabel}</span>
    </Button>
  )
}
