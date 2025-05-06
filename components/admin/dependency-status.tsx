"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function DependencyStatus() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function checkDependencies() {
      try {
        const response = await fetch("/api/dependencies")

        if (!response.ok) {
          throw new Error("Failed to load dependencies")
        }

        const data = await response.json()
        setCount(data.dependencies?.length || 0)
        setStatus("ok")
      } catch (error) {
        console.error("Error checking dependencies:", error)
        setStatus("error")
      }
    }

    checkDependencies()
  }, [])

  if (status === "loading") {
    return (
      <Badge variant="outline" className="bg-gray-600">
        Loading...
      </Badge>
    )
  }

  if (status === "error") {
    return (
      <Badge variant="outline" className="bg-red-600 flex items-center gap-1">
        <AlertCircle size={10} />
        Error
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-green-600 flex items-center gap-1">
      <CheckCircle size={10} />
      {count}
    </Badge>
  )
}
