"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, ImageIcon, Edit, Trash } from "lucide-react"
import Image from "next/image"

interface BTSImage {
  id: string
  project_id: string
  image_url: string
  caption?: string
  size?: string
  aspect_ratio?: string
  category?: string
  created_at?: string
}

interface BTSImageManagerProps {
  projectId: string
}

export default function BTSImageManager({ projectId }: BTSImageManagerProps) {
  const [images, setImages] = useState<BTSImage[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<BTSImage | null>(null)
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newCaption, setNewCaption] = useState("")
  const [newCategory, setNewCategory] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchImages()
  }, [projectId])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("bts_images")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })

      if (error) throw error

      setImages(data || [])
    } catch (error) {
      console.error("Error fetching BTS images:", error)
      toast({
        title: "Error",
        description: "Failed to load behind-the-scenes images",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddImage = async () => {
    if (!newImageUrl) {
      toast({
        title: "Error",
        description: "Please provide an image URL",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      // Use the API route instead of direct Supabase client
      const response = await fetch("/api/projects/bts-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          images: [newImageUrl],
          caption: newCaption,
          category: newCategory,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add BTS image")
      }

      toast({
        title: "Success",
        description: "Behind-the-scenes image added successfully",
      })

      setNewImageUrl("")
      setNewCaption("")
      setNewCategory("general")
      setIsAddDialogOpen(false)
      fetchImages()
    } catch (error) {
      console.error("Error adding BTS image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add behind-the-scenes image",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditImage = async () => {
    if (!selectedImage) return

    try {
      setIsSaving(true)
      const { error } = await supabase
        .from("bts_images")
        .update({
          caption: newCaption,
          category: newCategory,
        })
        .eq("id", selectedImage.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Behind-the-scenes image updated successfully",
      })

      setIsEditDialogOpen(false)
      fetchImages()
    } catch (error) {
      console.error("Error updating BTS image:", error)
      toast({
        title: "Error",
        description: "Failed to update behind-the-scenes image",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!selectedImage) return

    try {
      setIsSaving(true)
      const { error } = await supabase.from("bts_images").delete().eq("id", selectedImage.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Behind-the-scenes image deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      fetchImages()
    } catch (error) {
      console.error("Error deleting BTS image:", error)
      toast({
        title: "Error",
        description: "Failed to delete behind-the-scenes image",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (image: BTSImage) => {
    setSelectedImage(image)
    setNewCaption(image.caption || "")
    setNewCategory(image.category || "general")
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (image: BTSImage) => {
    setSelectedImage(image)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Behind the Scenes Images</h3>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">No behind-the-scenes images yet</p>
          <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="mt-4">
            Add your first BTS image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.caption || "Behind the scenes image"}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-black/50 hover:bg-black/70"
                    onClick={() => openEditDialog(image)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 bg-black/50 hover:bg-red-600/70"
                    onClick={() => openDeleteDialog(image)}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm truncate">{image.caption || "No caption"}</p>
                {image.category && (
                  <p className="text-xs text-gray-500 mt-1">
                    Category: {image.category.charAt(0).toUpperCase() + image.category.slice(1)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Image Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Behind the Scenes Image</DialogTitle>
            <DialogDescription>Add a new behind-the-scenes image to this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Describe this behind-the-scenes moment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="general">General</option>
                <option value="setup">Setup</option>
                <option value="filming">Filming</option>
                <option value="crew">Crew</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddImage} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Image Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
            <DialogDescription>Update the details for this behind-the-scenes image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative aspect-video rounded-md overflow-hidden mb-4">
              {selectedImage && (
                <Image
                  src={selectedImage.image_url || "/placeholder.svg"}
                  alt={selectedImage.caption || "Behind the scenes image"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCaption">Caption</Label>
              <Textarea
                id="editCaption"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Describe this behind-the-scenes moment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">Category</Label>
              <select
                id="editCategory"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="general">General</option>
                <option value="setup">Setup</option>
                <option value="filming">Filming</option>
                <option value="crew">Crew</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditImage} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Image</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this behind-the-scenes image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video rounded-md overflow-hidden my-4">
            {selectedImage && (
              <Image
                src={selectedImage.image_url || "/placeholder.svg"}
                alt={selectedImage.caption || "Behind the scenes image"}
                fill
                className="object-cover"
                unoptimized
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteImage} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
