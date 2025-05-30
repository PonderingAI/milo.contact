"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save, ArrowUp, ArrowDown } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TagOrderManager() {
  const [categories, setCategories] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tableExists, setTableExists] = useState(true)

  useEffect(() => {
    async function checkTableExists() {
      try {
        const response = await fetch("/api/check-table-exists?table=tag_order")
        const data = await response.json()
        setTableExists(data.exists)
      } catch (error) {
        console.error("Error checking if tag_order table exists:", error)
        setTableExists(false)
      }
    }

    async function fetchTags() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get unique categories
        const { data: categoryData, error: categoryError } = await supabase
          .from("projects")
          .select("category")
          .not("category", "is", null)

        // Get unique roles
        const { data: roleData, error: roleError } = await supabase
          .from("projects")
          .select("role")
          .not("role", "is", null)

        if (categoryError || roleError) {
          console.error("Error fetching tags:", categoryError || roleError)
          return
        }

        // Extract unique categories and roles
        const uniqueCategories = new Set<string>()
        const uniqueRoles = new Set<string>()

        categoryData?.forEach((item) => {
          if (item.category) uniqueCategories.add(item.category)
        })

        roleData?.forEach((item) => {
          if (item.role) {
            // Split roles by comma and add each one
            item.role.split(",").forEach((role: string) => {
              const trimmedRole = role.trim()
              if (trimmedRole) uniqueRoles.add(trimmedRole)
            })
          }
        })

        // Fetch existing tag order
        const response = await fetch("/api/tag-order")

        if (response.ok) {
          const orderData = await response.json()

          // Create maps for quick lookup
          const categoryOrderMap = new Map()
          const roleOrderMap = new Map()

          orderData.forEach((item: any) => {
            if (item.tag_type === "category") {
              categoryOrderMap.set(item.tag_name, item.display_order)
            } else if (item.tag_type === "role") {
              roleOrderMap.set(item.tag_name, item.display_order)
            }
          })

          // Sort categories and roles based on saved order
          const sortedCategories = Array.from(uniqueCategories).sort((a, b) => {
            const orderA = categoryOrderMap.has(a) ? categoryOrderMap.get(a) : Number.MAX_SAFE_INTEGER
            const orderB = categoryOrderMap.has(b) ? categoryOrderMap.get(b) : Number.MAX_SAFE_INTEGER
            return orderA - orderB
          })

          const sortedRoles = Array.from(uniqueRoles).sort((a, b) => {
            const orderA = roleOrderMap.has(a) ? roleOrderMap.get(a) : Number.MAX_SAFE_INTEGER
            const orderB = roleOrderMap.has(b) ? roleOrderMap.get(b) : Number.MAX_SAFE_INTEGER
            return orderA - orderB
          })

          setCategories(sortedCategories)
          setRoles(sortedRoles)
        } else {
          // If no order exists yet, just sort alphabetically
          setCategories(Array.from(uniqueCategories).sort())
          setRoles(Array.from(uniqueRoles).sort())
        }
      } catch (error) {
        console.error("Error in fetchTags:", error)
        // If error, just sort alphabetically
        setCategories(Array.from(Array.from(uniqueCategories) || []).sort())
        setRoles(Array.from(Array.from(uniqueRoles) || []).sort())
      } finally {
        setLoading(false)
      }
    }

    checkTableExists()
    fetchTags()
  }, [])

  const moveTag = (tagType: "categories" | "roles", index: number, direction: "up" | "down") => {
    const tags = tagType === "categories" ? [...categories] : [...roles]

    if (direction === "up" && index > 0) {
      // Move tag up
      ;[tags[index], tags[index - 1]] = [tags[index - 1], tags[index]]
    } else if (direction === "down" && index < tags.length - 1) {
      // Move tag down
      ;[tags[index], tags[index + 1]] = [tags[index + 1], tags[index]]
    }

    if (tagType === "categories") {
      setCategories(tags)
    } else {
      setRoles(tags)
    }
  }

  const saveTagOrder = async (tagType: "category" | "role", tags: string[]) => {
    try {
      setSaving(true)

      const response = await fetch("/api/tag-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagType,
          tags,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save tag order")
      }

      toast({
        title: "Tag order saved",
        description: `The ${tagType} order has been updated successfully.`,
      })
    } catch (error: any) {
      console.error(`Error saving ${tagType} order:`, error)
      toast({
        title: "Error saving tag order",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const setupTagOrderTable = async () => {
    try {
      setSaving(true)

      const response = await fetch("/api/setup-tag-order-table")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create tag order table")
      }

      toast({
        title: "Table created",
        description: "The tag order table has been created successfully.",
      })

      setTableExists(true)
    } catch (error: any) {
      console.error("Error creating tag order table:", error)
      toast({
        title: "Error creating table",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (!tableExists) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tag Order Manager</CardTitle>
          <CardDescription>Manage the display order of categories and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Tag order table not found</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                The tag_order table does not exist in your database. You need to create it before you can manage tag
                order.
              </p>
              <Button onClick={setupTagOrderTable} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Tag Order Table
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tag Order Manager</CardTitle>
          <CardDescription>Manage the display order of categories and roles</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Order Manager</CardTitle>
        <CardDescription>Manage the display order of categories and roles</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Drag or use the arrows to reorder categories. This will affect the display order on the frontend.
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {categories.map((category, index) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
                    <span>{category}</span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveTag("categories", index, "up")}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveTag("categories", index, "down")}
                        disabled={index === categories.length - 1}
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => saveTagOrder("category", categories)} disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Category Order
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="roles">
            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-2">
                Drag or use the arrows to reorder roles. This will affect the display order on the frontend.
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {roles.map((role, index) => (
                  <div key={role} className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
                    <span>{role}</span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveTag("roles", index, "up")}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveTag("roles", index, "down")}
                        disabled={index === roles.length - 1}
                        className="h-8 w-8"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => saveTagOrder("role", roles)} disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Role Order
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
