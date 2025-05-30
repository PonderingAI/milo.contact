import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"

const tools = [
  {
    id: "prompt-studio",
    name: "Prompt Studio",
    description: "Organize, rate, and manage your AI image generation prompts.",
    icon: Sparkles,
    status: "stable",
    tags: ["AI", "Image Generation", "Prompts"],
  },
]

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-800 p-4">
        <div className="container mx-auto flex items-center space-x-4">
          <Link href="/" className="text-neutral-400 hover:text-neutral-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Portfolio</span>
          </Link>
          <h1 className="font-serif text-2xl">Tools</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-colors"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-neutral-800 rounded-md">
                    <tool.icon className="h-6 w-6 text-teal-400" />
                  </div>
                  <div className="px-2 py-1 bg-teal-900/30 border border-teal-900/50 rounded text-xs text-teal-400">
                    {tool.status}
                  </div>
                </div>
                <h2 className="font-serif text-xl mb-2">{tool.name}</h2>
                <p className="text-neutral-400 mb-4">{tool.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/tools/${tool.id}`}
                  className="block w-full py-2 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors"
                >
                  Launch Tool
                </Link>
              </div>
            </div>
          ))}

          {/* Add New Tool Card */}
          <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-colors">
            <div className="p-6 flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 mb-4 rounded-full bg-neutral-800">
                <svg
                  className="h-8 w-8 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="font-serif text-xl mb-2">Add New Tool</h2>
              <p className="text-neutral-400 mb-6">Create a new tool and add it to this collection.</p>
              <Link
                href="#documentation"
                className="block w-full py-2 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>

        {/* Documentation Section */}
        <div id="documentation" className="border-t border-neutral-800 pt-8">
          <h2 className="font-serif text-3xl mb-6">Developer Documentation</h2>

          <div className="prose prose-invert max-w-none">
            <h3>Adding a New Tool</h3>
            <p>To add a new tool to this collection, follow these steps:</p>

            <ol>
              <li>
                <strong>Create a new directory</strong> for your tool under <code>/app/tools/your-tool-name</code>
              </li>
              <li>
                <strong>Create a page.tsx file</strong> in that directory with your tool's main component
              </li>
              <li>
                <strong>Add your tool to the tools array</strong> in <code>/app/tools/page.tsx</code>
              </li>
              <li>
                <strong>Include navigation</strong> back to the tools index page
              </li>
            </ol>

            <h3>Tool Registration Example</h3>
            <pre className="bg-neutral-800 p-4 rounded-md overflow-auto">
              {`{
  id: 'your-tool-name',
  name: 'Your Tool Name',
  description: 'A brief description of what your tool does.',
  icon: YourIconComponent, // Import from lucide-react
  status: 'beta', // 'stable', 'beta', or 'experimental'
  tags: ['Category', 'Another Category']
}`}
            </pre>

            <h3>Styling Guidelines</h3>
            <ul>
              <li>Use the existing dark theme with neutral colors</li>
              <li>
                Use <code>font-serif</code> for headings
              </li>
              <li>Use teal accents sparingly for important UI elements</li>
              <li>Ensure your tool is responsive and works on mobile devices</li>
              <li>Follow accessibility best practices</li>
            </ul>

            <h3>Best Practices</h3>
            <ul>
              <li>Implement keyboard shortcuts for power users</li>
              <li>Include proper error handling</li>
              <li>Add loading states for async operations</li>
              <li>Use client-side storage appropriately</li>
              <li>Document your tool's usage</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
