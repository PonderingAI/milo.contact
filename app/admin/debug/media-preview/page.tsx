import MediaPreviewDebugger from "@/components/admin/debug/media-preview-debugger"

export default function MediaPreviewDebugPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Media Preview Debugging</h1>
      <p className="text-gray-400 mb-8">Use this tool to debug issues with media previews and image loading.</p>

      <MediaPreviewDebugger />
    </div>
  )
}
