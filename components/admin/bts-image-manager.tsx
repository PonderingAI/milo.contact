"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, X, Edit, Save } from "lucide-react"
import ImageUploader from "@/components/admin/image-uploader"

interface BtsImage {
  id: string
  project_id: string
  image_url: string
  caption?: string
  size?: "small" | "medium" | "large"
  aspect_ratio?: "square" | "portrait" | "landscape"
}

interface BtsImageManagerProps {
  projectId: string
}

export default function BtsImageManager({ projectId }: BtsImageManagerProps) {
  const [images, setImages] = useState<BtsImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  // New image form state
  const [newImage, setNewImage] = useState<Partial<BtsImage>>({
    project_id: projectId,
    image_url: "",
    caption: "",
    size: "medium",
    aspect_ratio: "landscape",
  })

  // Load BTS images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from("bts_images")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true })

        if (error) throw error

        setImages(data || [])
      } catch (error) {
        console.error("Error fetching BTS images:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [projectId, supabase])

  const handleAddImage = async () => {
    if (!newImage.image_url) {
      alert("Please upload an image")
      return
    }

    try {
      const { data, error } = await supabase.from("bts_images").insert([newImage]).select()

      if (error) throw error

      // Add the new image to the list
      setImages([...images, data[0]])

      // Reset the form
      setNewImage({
        project_id: projectId,
        image_url: "",
        caption: "",
        size: "medium",
        aspect_ratio: "landscape",
      })

      // Hide the form
      setShowAddForm(false)
    } catch (error) {
      console.error("Error adding BTS image:", error)
      alert("Failed to add image")
    }
  }

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      const { error } = await supabase.from("bts_images").delete().eq("id", id)

      if (error) throw error

      // Remove the image from the list
      setImages(images.filter((img) => img.id !== id))
    } catch (error) {
      console.error("Error deleting BTS image:", error)
      alert("Failed to delete image")
    }
  }

  const handleUpdateImage = async (id: string) => {
    const imageToUpdate = images.find((img) => img.id === id)
    if (!imageToUpdate) return

    try {
      const { error } = await supabase
        .from("bts_images")
        .update({
          caption: imageToUpdate.caption,
          size: imageToUpdate.size,
          aspect_ratio: imageToUpdate.aspect_ratio,
        })
        .eq("id", id)

      if (error) throw error

      // Exit edit mode
      setEditingId(null)
    } catch (error) {
      console.error("Error updating BTS image:", error)
      alert("Failed to update image")
    }
  }

  const handleImageChange = (id: string, field: string, value: string) => {
    setImages(images.map((img) => (img.id === id ? { ...img, [field]: value } : img)))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl">Images ({images.length})</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline">
          {showAddForm ? (
            <>Cancel</>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" /> Add BTS Image
            </>
          )}
        </Button>
      </div>

      {/* Add new image form */}
      {showAddForm && (
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-medium mb-4">Add New BTS Image</h4>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Image *</Label>
              <ImageUploader
                onImageUploaded={(url) => setNewImage({ ...newImage, image_url: url })}
                folder="bts-images"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={newImage.caption || ""}
                onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })}
                placeholder="Image caption"
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={newImage.size}
                  onValueChange={(value) => setNewImage({ ...newImage, size: value as "small" | "medium" | "large" })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
                <Select
                  value={newImage.aspect_ratio}
                  onValueChange={(value) =>
                    setNewImage({ ...newImage, aspect_ratio: value as "square" | "portrait" | "landscape" })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddImage} className="bg-white text-black hover:bg-gray-200">
                Add Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BTS images list */}
      {loading ? (
        <div className="text-center py-8">Loading images...</div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.caption || "BTS image"}
                  fill
                  className="object-cover"
                />
              </div>

              {editingId === image.id ? (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`caption-${image.id}`}>Caption</Label>
                    <Input
                      id={`caption-${image.id}`}
                      value={image.caption || ""}
                      onChange={(e) => handleImageChange(image.id, "caption", e.target.value)}
                      placeholder="Image caption"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`size-${image.id}`}>Size</Label>
                      <Select
                        value={image.size || "medium"}
                        onValueChange={(value) => handleImageChange(image.id, "size", value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`aspect-${image.id}`}>Aspect Ratio</Label>
                      <Select
                        value={image.aspect_ratio || "landscape"}
                        onValueChange={(value) => handleImageChange(image.id, "aspect_ratio", value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUpdateImage(image.id)}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-300">{image.caption || "No caption"}</p>
                      <p className="text-xs text-gray-500">
                        {image.size || "medium"} • {image.aspect_ratio || "landscape"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingId(image.id)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteImage(image.id)}>
                        <X className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-900 rounded-lg">
          <p className="text-gray-400 mb-4">No BTS images added yet</p>
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First BTS Image
          </Button>
        </div>
      )}
    </div>
  )
}
