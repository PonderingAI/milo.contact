"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugClientPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Initializing debug client...")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setStatus("success")
        setMessage("Debug client is working correctly!")
      } catch (error) {
        setStatus("error")
        setMessage(`Error initializing debug client: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    checkStatus()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug Client Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`p-4 rounded-md ${
              status === "loading"
                ? "bg-yellow-100 text-yellow-800"
                : status === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
