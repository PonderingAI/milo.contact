import ProjectMediaDebugger from "@/components/admin/debug/project-media-debugger"

export default function ProjectMediaDebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Project Media Debugger</h1>
      <p className="mb-6 text-gray-500">
        Use this tool to diagnose issues with project videos and BTS images. Enter a project ID to see detailed
        information about its media fields and content.
      </p>

      <ProjectMediaDebugger />
    </div>
  )
}
