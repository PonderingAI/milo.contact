"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  AlertCircle, 
  Check, 
  Loader2, 
  Package, 
  Plus, 
  RefreshCw, 
  Search, 
  Shield 
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

// Popular packages for auto-suggestions
const POPULAR_PACKAGES = [
  { name: "svix", description: "Webhook signature verification and management" },
  { name: "zod", description: "TypeScript-first schema validation" },
  { name: "axios", description: "Promise based HTTP client" },
  { name: "lodash", description: "Utility library for JavaScript" },
  { name: "date-fns", description: "Modern JavaScript date utility library" },
  { name: "react-query", description: "Hooks for fetching, caching and updating data" },
  { name: "uuid", description: "RFC-compliant UUID generator" },
  { name: "nanoid", description: "Tiny, secure, URL-friendly unique string ID generator" },
  { name: "react-hook-form", description: "Performant, flexible forms with validation" }
]

interface AddPackageDialogProps {
  onPackageAdded?: () => void
  defaultPackage?: string
  triggerButton?: React.ReactNode
}

export function AddPackageDialog({ 
  onPackageAdded, 
  defaultPackage = "", 
  triggerButton 
}: AddPackageDialogProps) {
  // State for the dialog
  const [open, setOpen] = useState(false)
  
  // Form state
  const [packageName, setPackageName] = useState(defaultPackage)
  const [packageVersion, setPackageVersion] = useState("")
  const [isDevDependency, setIsDevDependency] = useState(false)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{name: string, description: string}>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setPackageName(defaultPackage)
      setPackageVersion("")
      setIsDevDependency(false)
      setError(null)
      setSuccess(null)
      setIsValid(null)
    }
  }, [open, defaultPackage])
  
  // Filter suggestions when package name changes
  useEffect(() => {
    if (packageName.trim() === "") {
      setSuggestions(POPULAR_PACKAGES)
      return
    }
    
    const filtered = POPULAR_PACKAGES.filter(pkg => 
      pkg.name.toLowerCase().includes(packageName.toLowerCase())
    )
    setSuggestions(filtered)
    
    // Validate package after typing stops
    const debounceTimer = setTimeout(() => {
      if (packageName.trim().length > 1) {
        validatePackage(packageName)
      } else {
        setIsValid(null)
      }
    }, 500)
    
    return () => clearTimeout(debounceTimer)
  }, [packageName])
  
  // Validate package name against npm registry
  const validatePackage = async (name: string) => {
    if (!name || name.trim() === "") return
    
    setValidating(true)
    setIsValid(null)
    
    try {
      const response = await fetch(`https://registry.npmjs.org/${name.trim()}`, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      setIsValid(response.ok)
    } catch (error) {
      console.error("Error validating package:", error)
      setIsValid(false)
    } finally {
      setValidating(false)
    }
  }
  
  // Handle form submission
  const handleAddPackage = async () => {
    if (!packageName || packageName.trim() === "") {
      setError("Package name is required")
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch("/api/dependencies/add-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          packageName: packageName.trim(),
          version: packageVersion.trim() || "latest",
          isDev: isDevDependency
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to add package")
      }
      
      setSuccess(`Successfully added ${packageName}@${data.package.version}`)
      toast({
        title: "Package Added",
        description: `Successfully added ${packageName}@${data.package.version}`,
      })
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpen(false)
        if (onPackageAdded) {
          onPackageAdded()
        }
      }, 2000)
    } catch (error) {
      console.error("Error adding package:", error)
      setError(error instanceof Error ? error.message : "Failed to add package")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add package",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Quick-add svix package
  const handleAddSvix = () => {
    setPackageName("svix")
    setPackageVersion("latest")
    setIsDevDependency(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Add Package to Project
          </DialogTitle>
          <DialogDescription>
            Add a new npm package to your project through the dependency management system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="packageName">
              Package Name
              {validating && <Loader2 className="h-3 w-3 ml-2 inline animate-spin" />}
              {isValid === true && <Check className="h-3 w-3 ml-2 inline text-green-500" />}
              {isValid === false && <AlertCircle className="h-3 w-3 ml-2 inline text-red-500" />}
            </Label>
            <div className="relative">
              <Input
                id="packageName"
                value={packageName}
                onChange={(e) => {
                  setPackageName(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="e.g., svix, axios, react-query"
                className="pr-8"
              />
              <Search className="h-4 w-4 absolute right-3 top-3 text-gray-400" />
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                  {suggestions.map((pkg) => (
                    <div
                      key={pkg.name}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setPackageName(pkg.name)
                        setShowSuggestions(false)
                        setIsValid(true)
                      }}
                    >
                      <div className="font-medium">{pkg.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{pkg.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="packageVersion">Version (optional)</Label>
            <Input
              id="packageVersion"
              value={packageVersion}
              onChange={(e) => setPackageVersion(e.target.value)}
              placeholder="latest, ^1.0.0, ~2.3.4"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave empty for latest version
            </p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isDevDependency"
              checked={isDevDependency}
              onCheckedChange={(checked) => setIsDevDependency(checked === true)}
            />
            <Label htmlFor="isDevDependency" className="cursor-pointer">
              Install as dev dependency
            </Label>
          </div>
          
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSvix}
              className="flex items-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              Add Svix for Webhook Security
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Svix provides secure webhook signature verification
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleAddPackage}
            disabled={loading || isValid === false}
            className="flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Default export for backward compatibility
export default AddPackageDialog
