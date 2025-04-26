"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteProjectButtonProps {
  id: string
}

export default function DeleteProjectButton({ id }: DeleteProjectButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Delete the project
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Failed to delete project")
    } finally {
      setIsDeleting(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
        <span className="sr-only">Delete</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated BTS images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
