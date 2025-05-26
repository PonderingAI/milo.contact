"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Will be replaced by Textarea for video URLs but keep for file input styling if needed elsewhere
import { Textarea } from "@/components/ui/textarea"; // Added for multi-URL input
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UploadCloud, Search, ImagePlus, LinkIcon, ListVideo } from "lucide-react"; // Film, ListVideo can be used as needed
import { toast } from "@/components/ui/use-toast";
import UnifiedMediaLibrary from "./unified-media-library"; // Assuming this is the correct path
// import { supabase } from "@/lib/supabase-browser"; // Or appropriate client
// import { calculateFileHash } from "@/lib/media-utils"; // If we move it there or reuse

// Helper function (can be moved to utils if used elsewhere)
const calculateFileHashClient = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) {
        reject(new Error("Failed to read file for hashing."));
        return;
      }
      try {
        const arrayBuffer = e.target.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        resolve(hashHex);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("File reading error for hashing."));
    reader.readAsArrayBuffer(file);
  });
};


interface MediaItem { // Basic structure, UnifiedMediaLibrary returns more detailed
  id: string;
  public_url: string;
  [key: string]: any; // Allow other properties
}

interface UnifiedMediaInputProps {
  identifier: string;
  onMediaAdded: (urls: string[]) => void;
  onVideoUrlSubmit: (url: string) => void;
  isLoading?: boolean;
  className?: string;
  // Add other necessary props from ProjectMediaUploader if needed, e.g., folder
  folder?: string;
}

export default function UnifiedMediaInput({
  identifier,
  onMediaAdded,
  onVideoUrlSubmit,
  isLoading = false,
  className = "",
  folder = "default-folder", // Default folder, ProjectForm should pass 'projects' or 'bts'
}: UnifiedMediaInputProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false); // For direct uploads

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if not dragging over a child element (tricky, might need refinement or rely on drop/end)
    // For simplicity now, this might cause flickering if not handled carefully with pointer-events: none on children
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow dropping
    setIsDraggingOver(true); // Keep it true while dragging over
  };

  const processFilesForUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files); // Convert FileList to Array if necessary
    if (validFiles.length === 0) return;

    setIsUploading(true);
    const processedUrls: string[] = [];
    let filesProcessedCount = 0;
    let filesFailedCount = 0;

    try {
      for (const file of validFiles) {
        try {
          // 1. Calculate SHA-256 hash
          const fileHash = await calculateFileHashClient(file);

          // 2. Check for client-side duplicate
          const checkDupResponse = await fetch("/api/check-media-duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileHash, filename: file.name, folder }),
          });

          if (checkDupResponse.ok) {
            const dupData = await checkDupResponse.json();
            if (dupData.isDuplicate && dupData.existingItem?.public_url) {
              processedUrls.push(dupData.existingItem.public_url);
              toast({
                title: "File Exists",
                description: `${file.name} already exists. Using existing version.`,
              });
              filesProcessedCount++;
              continue; // Skip to next file
            }
          } else {
            // Non-critical error, log it and proceed with upload attempt
            console.warn(`Failed to check duplicate for ${file.name}: ${checkDupResponse.statusText}`);
          }

          // 3. If not a client-detected duplicate, proceed to upload
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const uploadResponse = await fetch("/api/bulk-upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed with no details" }));
            throw new Error(errorData.error || `Failed to upload ${file.name}`);
          }

          const result = await uploadResponse.json();

          if (result.duplicate && result.existingFile?.public_url) {
            processedUrls.push(result.existingFile.public_url);
            toast({ title: "Duplicate File", description: `${file.name} already exists (server check). Using existing.` });
            filesProcessedCount++;
          } else if (result.success && result.publicUrl) {
            processedUrls.push(result.publicUrl);
            filesProcessedCount++;
          } else {
            throw new Error(result.error || `Upload failed for ${file.name}: Unexpected response format.`);
          }
        } catch (fileError) {
          filesFailedCount++;
          console.error(`Error processing file ${file.name}:`, fileError);
          toast({
            title: `Upload Error for ${file.name}`,
            description: fileError instanceof Error ? fileError.message : "An unknown error occurred.",
            variant: "destructive",
          });
          // Continue with other files
        }
      }

      if (processedUrls.length > 0) {
        onMediaAdded(processedUrls);
      }

      if (filesProcessedCount > 0 && filesFailedCount === 0) {
        toast({ title: "Upload Successful", description: `${filesProcessedCount} file(s) processed successfully.` });
      } else if (filesProcessedCount > 0 && filesFailedCount > 0) {
        toast({ title: "Partial Upload", description: `${filesProcessedCount} file(s) processed, ${filesFailedCount} failed.` });
      } else if (filesFailedCount > 0 && filesProcessedCount === 0) {
        toast({ title: "Upload Failed", description: `All ${filesFailedCount} file(s) failed to process.`, variant: "destructive" });
      }
      // If validFiles.length was 0, no toast, already handled.

    } catch (error) { // Catch errors from primary loop structure, though individual file errors are caught above
      console.error("Outer error during file processing:", error);
      toast({
        title: "Overall Upload Error",
        description: "An unexpected error occurred during the upload process.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFilesForUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDeviceFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesForUpload(e.target.files);
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVideoUrlInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { // Changed to HTMLTextAreaElement
    setVideoUrlInput(e.target.value);
  };

  const handleSubmitVideoUrl = () => {
    const urls = videoUrlInput
      .split(/[\n,\s]+/) // Split by newlines, commas, or spaces
      .map(url => url.trim())
      .filter(url => url); // Filter out empty strings

    if (urls.length > 0) {
      urls.forEach(url => onVideoUrlSubmit(url));
      setVideoUrlInput(""); // Clear input after submit
      toast({ title: "Video Links Added", description: `${urls.length} link(s) submitted for processing.` });
    } else {
      toast({ title: "No Links Entered", description: "Please enter valid video URLs.", variant: "default" });
    }
  };

  const handleOpenMediaLibrary = () => setIsMediaLibraryOpen(true);
  const handleCloseMediaLibrary = () => setIsMediaLibraryOpen(false);

  const handleMediaLibrarySelect = (selectedMediaItems: MediaItem[]) => {
    const urls = selectedMediaItems
      .map(item => item.public_url)
      .filter(url => !!url && url.trim() !== ""); // Ensure URL is not null, undefined, or empty string

    if (urls.length > 0) {
      onMediaAdded(urls);
      toast({ title: "Media Selected", description: `${urls.length} item(s) added from library.` });
    }
    handleCloseMediaLibrary();
  };


  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-150 ease-in-out relative ${isDraggingOver ? "border-blue-600/70 bg-slate-800/60 scale-105" : "border-gray-800 hover:border-gray-700/80"} ${className}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {(isUploading || isLoading) && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
          <UploadCloud className="h-12 w-12 text-blue-400 animate-pulse mb-2" />
          <p className="text-lg font-semibold text-white">
            {isUploading ? "Uploading..." : "Processing..."}
          </p>
        </div>
      )}

      {isDraggingOver ? (
        <div className="pointer-events-none flex flex-col items-center justify-center h-48"> {/* Ensure children don't steal drag events */}
          <UploadCloud className="h-16 w-16 text-blue-400 mb-2" />
          <p className="text-xl font-semibold text-blue-300">Drop files to upload</p>
        </div>
      ) : (
        <div className="space-y-6"> {/* Adjusted space-y and removed divide-y */}
          {/* Section 1: Browse Media Library */}
          <div className="pt-2 pb-3">
            <Button variant="outline" onClick={handleOpenMediaLibrary} className="w-full bg-slate-700/50 hover:bg-slate-600/50 border-slate-600/70 text-slate-200 hover:text-white rounded-md">
              <Search className="mr-2 h-5 w-5" /> Browse Media Library
            </Button>
          </div>

          {/* Section 2: Paste Video Links */}
          {/* Consider adding <hr className="border-slate-700/60" /> if needed after visual review */}
          <div className="pt-3 pb-3">
            <label htmlFor={`${identifier}-videoUrlInput`} className="sr-only">Paste Video Links</label>
            <div className="flex items-start space-x-2">
              <ListVideo className="h-6 w-6 text-slate-400 flex-shrink-0 mt-2" />
              <Textarea
                id={`${identifier}-videoUrlInput`}
                value={videoUrlInput}
                onChange={handleVideoUrlInputChange}
                placeholder="Paste YouTube, Vimeo, etc. links. One URL per line, or separated by commas/spaces."
                className="flex-grow bg-slate-800/60 border-slate-700 placeholder-slate-500 min-h-[60px] rounded-md text-slate-200 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <Button onClick={handleSubmitVideoUrl} variant="secondary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold self-start mt-1 px-4 py-2 rounded-md">
                Add Links
              </Button>
            </div>
          </div>

          {/* Section 3: Browse Device */}
          {/* Consider adding <hr className="border-slate-700/60" /> if needed after visual review */}
          <div className="pt-3">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-700/50 hover:bg-slate-600/50 border-slate-600/70 text-slate-200 hover:text-white rounded-md">
              <ImagePlus className="mr-2 h-5 w-5" /> Browse Device Files
            </Button>
            <input
              type="file"
              multiple
              onChange={handleDeviceFileBrowse}
              className="hidden"
              accept="image/*,video/*" // Adjust as needed
              data-testid="hidden-device-file-input" // Added for testing
            />
          </div>
        </div>
      )}

      <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Media from Library</DialogTitle>
            <DialogDescription>Choose one or more items to add.</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
            <UnifiedMediaLibrary
              selectionMode="multiple"
              onSelect={handleMediaLibrarySelect} // Now expects MediaItem[]
              mediaTypeFilter="all"
              // Pass initialSelectedItems if needed, though for an uploader, it's usually empty
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
