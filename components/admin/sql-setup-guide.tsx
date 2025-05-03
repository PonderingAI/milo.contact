"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface SqlSetupGuideProps {
  tableName: string
  sqlCode: string
  title: string
  description: string
}

export default function SqlSetupGuide({ tableName, sqlCode, title, description }: SqlSetupGuideProps) {
  const [isTableMissing, setIsTableMissing] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function checkTable() {
      try {
        const res = await fetch(`/api/check-table-exists?table=${tableName}`)
        const data = await res.json()
        setIsTableMissing(!data.exists)
      } catch (error) {
        console.error(`Error checking if ${tableName} exists:`, error)
        setIsTableMissing(true) // Assume missing on error
      }
    }

    checkTable()
  }, [tableName])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isTableMissing === null) {
    return <div className="animate-pulse p-4 bg-gray-800/50 rounded-md">Checking database setup...</div>
  }

  if (!isTableMissing) {
    return null // Table exists, don't show anything
  }

  return (
    <Alert variant="destructive" className="mb-8 bg-red-900/20 border-red-800">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>{description}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="border-red-400 text-red-100 hover:bg-red-900/30"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide SQL Code" : "Show SQL Code"}
            {expanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>

          {expanded && (
            <Button
              variant="outline"
              className="border-red-400 text-red-100 hover:bg-red-900/30"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy SQL"}
            </Button>
          )}
        </div>

        {expanded && (
          <div className="mt-2 max-h-96 overflow-auto rounded-md">
            <SyntaxHighlighter
              language="sql"
              style={vscDarkPlus}
              customStyle={{
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                margin: 0,
              }}
            >
              {sqlCode}
            </SyntaxHighlighter>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
