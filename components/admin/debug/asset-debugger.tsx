"use client"

import { useState, useEffect } from "react"
import { FileCode, RefreshCw, Check, X, ImageIcon, FileText, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface AssetStatus {
  path: string
  exists: boolean
  type: "image" | "script" | "style" | "other"
  size?: number
  error?: string
}

export default function AssetDebugger() {
  const [assets, setAssets] = useState<AssetStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customAssetPath, setCustomAssetPath] = useState("")

  // Default assets to check
  const defaultAssets = [
    { path: "/favicon.ico", type: "image" },
    { path: "/favicon-16x16.png", type: "image" },
    { path: "/favicon-32x32.png", type: "image" },
    { path: "/apple-touch-icon.png", type: "image" },
    { path: "/_vercel/insights/script.js", type: "script" },
    { path: "/manifest.json", type: "other" },
  ]

  useEffect(() => {
    // Initial check
    checkAssets(defaultAssets)
  }, [])

  const checkAssets = async (assetsToCheck: Array<{ path: string; type: AssetStatus["type"] }>) => {
    setIsLoading(true)

    // Reset asset statuses
    setAssets(
      assetsToCheck.map((asset) => ({
        path: asset.path,
        exists: false,
        type: asset.type,
      })),
    )

    // Check each asset
    for (let i = 0; i < assetsToCheck.length; i++) {
      const asset = assetsToCheck[i]
      try {
        const response = await fetch(asset.path, { method: "HEAD" })

        setAssets((prev) => {
          const newAssets = [...prev]
          const index = newAssets.findIndex((a) => a.path === asset.path)
          if (index !== -1) {
            newAssets[index] = {
              path: asset.path,
              exists: response.ok,
              type: asset.type,
              size: Number.parseInt(response.headers.get("content-length") || "0"),
            }
          }
          return newAssets
        })
      } catch (error) {
        setAssets((prev) => {
          const newAssets = [...prev]
          const index = newAssets.findIndex((a) => a.path === asset.path)
          if (index !== -1) {
            newAssets[index] = {
              path: asset.path,
              exists: false,
              type: asset.type,
              error: error instanceof Error ? error.message : String(error),
            }
          }
          return newAssets
        })
      }
    }

    setIsLoading(false)
  }

  const checkCustomAsset = async () => {
    if (!customAssetPath) return

    // Determine asset type based on extension
    let type: AssetStatus["type"] = "other"
    if (/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(customAssetPath)) {
      type = "image"
    } else if (/\.(js|jsx|ts|tsx)$/i.test(customAssetPath)) {
      type = "script"
    } else if (/\.(css|scss|less)$/i.test(customAssetPath)) {
      type = "style"
    }

    try {
      setIsLoading(true)
      const response = await fetch(customAssetPath, { method: "HEAD" })

      setAssets((prev) => [
        {
          path: customAssetPath,
          exists: response.ok,
          type,
          size: Number.parseInt(response.headers.get("content-length") || "0"),
        },
        ...prev,
      ])
    } catch (error) {
      setAssets((prev) => [
        {
          path: customAssetPath,
          exists: false,
          type,
          error: error instanceof Error ? error.message : String(error),
        },
        ...prev,
      ])
    } finally {
      setIsLoading(false)
      setCustomAssetPath("")
    }
  }

  const getAssetIcon = (type: AssetStatus["type"]) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "script":
        return <FileCode className="h-4 w-4" />
      case "style":
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-green-500" />
          <h2 className="text-xl font-bold text-green-400">Static Asset Diagnostics</h2>
        </div>
        <Button
          onClick={() => checkAssets(defaultAssets)}
          disabled={isLoading}
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-900/20"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Custom Asset Checker */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={customAssetPath}
          onChange={(e) => setCustomAssetPath(e.target.value)}
          placeholder="Enter asset path to check (e.g. /images/logo.png)..."
          className="flex-1 bg-black border-green-700 text-green-400"
        />
        <Button
          onClick={checkCustomAsset}
          disabled={isLoading || !customAssetPath}
          variant="outline"
          className="border-green-700 text-green-400 hover:bg-green-900/20"
        >
          Check Asset
        </Button>
      </div>

      {/* Asset Statuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map((asset, index) => (
          <Card key={index} className={`bg-black ${asset.exists ? "border-green-700" : "border-red-700"}`}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-mono flex items-center justify-between">
                <span className="flex items-center truncate">
                  <span className={`mr-2 ${asset.exists ? "text-green-500" : "text-red-500"}`}>
                    {getAssetIcon(asset.type)}
                  </span>
                  <span className="truncate" title={asset.path}>
                    {asset.path}
                  </span>
                </span>
                {asset.exists ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={asset.exists ? "text-green-500" : "text-red-500"}>
                    {asset.exists ? "Found" : "Missing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-green-400 capitalize">{asset.type}</span>
                </div>
                {asset.size !== undefined && asset.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-green-400">{formatBytes(asset.size)}</span>
                  </div>
                )}
                {asset.error && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Error:</span>
                    <span className="text-red-500 truncate max-w-[200px]" title={asset.error}>
                      {asset.error}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asset Troubleshooting */}
      <Card className="bg-black border-green-700">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-mono">Asset Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-xs space-y-2 text-green-400">
            <p>
              <span className="text-green-500 font-bold">→</span> Missing favicons? Check that the files exist in the{" "}
              <code className="bg-green-900/20 px-1 rounded">public</code> directory.
            </p>
            <p>
              <span className="text-green-500 font-bold">→</span> 404 for Vercel Analytics script? Make sure Web
              Analytics is enabled in your Vercel project settings.
            </p>
            <p>
              <span className="text-green-500 font-bold">→</span> For custom favicons, ensure{" "}
              <code className="bg-green-900/20 px-1 rounded">DynamicFavicons</code> component is working correctly.
            </p>
            <p>
              <span className="text-green-500 font-bold">→</span> Check that static assets are properly included in your
              deployment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
