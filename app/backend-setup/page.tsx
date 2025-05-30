import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function BackendSetupPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif mb-8">Backend Setup Guide</h1>

        <p className="text-xl text-gray-300 mb-12 max-w-3xl">
          Follow this step-by-step guide to set up the backend for your portfolio website using Vercel and Supabase.
        </p>

        <div className="backend-guide">
          <div className="step-container">
            <h2 className="text-2xl font-serif mb-4">
              <span className="step-number">1</span>
              Set Up Vercel for Hosting
            </h2>
            <p className="mb-4">
              Vercel provides an excellent platform for hosting your Next.js portfolio with seamless deployment and
              global CDN.
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-300">
              <li>
                Create a{" "}
                <a href="https://vercel.com/signup" className="text-blue-400 hover:underline">
                  Vercel account
                </a>{" "}
                if you don't have one
              </li>
              <li>Connect your GitHub repository to Vercel</li>
              <li>Configure your project settings (environment variables, build commands)</li>
              <li>Deploy your project</li>
            </ol>
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300">
                <strong>Pro Tip:</strong> Enable automatic deployments so your site updates whenever you push changes to
                your repository.
              </p>
            </div>
          </div>

          <div className="step-container">
            <h2 className="text-2xl font-serif mb-4">
              <span className="step-number">2</span>
              Set Up Supabase for Database
            </h2>
            <p className="mb-4">
              Supabase provides a PostgreSQL database with authentication, storage, and API features that are perfect
              for your portfolio.
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-300">
              <li>
                Create a{" "}
                <a href="https://supabase.com/" className="text-blue-400 hover:underline">
                  Supabase account
                </a>
              </li>
              <li>Create a new project</li>
              <li>Set up your database tables for projects, categories, and media</li>
            </ol>
            <div className="code-block">
              <pre>{`-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create BTS images table
CREATE TABLE bts_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}</pre>
            </div>
          </div>

          <div className="step-container">
            <h2 className="text-2xl font-serif mb-4">
              <span className="step-number">3</span>
              Set Up Media Storage
            </h2>
            <p className="mb-4">For your portfolio's images and videos, you'll need reliable storage solutions.</p>
            <h3 className="text-xl font-medium mb-2">Option A: Supabase Storage</h3>
            <p className="mb-4">
              Supabase includes a storage solution that's perfect for your project images and BTS photos.
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-300 mb-6">
              <li>Create storage buckets in Supabase for "projects" and "bts-images"</li>
              <li>Set up appropriate permissions (public read, authenticated write)</li>
              <li>Use the Supabase client to upload and manage images</li>
            </ol>

            <h3 className="text-xl font-medium mb-2">Option B: Vimeo for Videos</h3>
            <p className="mb-4">For videos, Vimeo offers professional hosting with customizable players.</p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-300">
              <li>
                Sign up for a{" "}
                <a href="https://vimeo.com/upgrade" className="text-blue-400 hover:underline">
                  Vimeo Pro account
                </a>
              </li>
              <li>Upload your videos</li>
              <li>Customize player appearance to match your portfolio</li>
              <li>Store video IDs in your Supabase database</li>
            </ol>
          </div>

          <div className="step-container">
            <h2 className="text-2xl font-serif mb-4">
              <span className="step-number">4</span>
              Connect Your Frontend to Supabase
            </h2>
            <p className="mb-4">Now let's connect your Next.js frontend to your Supabase backend.</p>
            <div className="code-block">
              <pre>{`// Install Supabase client
npm install @supabase/supabase-js

// In your lib/supabase.ts file
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`}</pre>
            </div>
            <p className="mt-4 mb-2">Create a data fetching function:</p>
            <div className="code-block">
              <pre>{`// In your lib/project-data.ts
import { supabase } from './supabase'

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  
  return data || []
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, bts_images(*)')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching project:', error)
    return null
  }
  
  return data
}`}</pre>
            </div>
          </div>

          <div className="step-container">
            <h2 className="text-2xl font-serif mb-4">
              <span className="step-number">5</span>
              Set Up Environment Variables
            </h2>
            <p className="mb-4">Add your environment variables to your Vercel project:</p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-300">
              <li>Go to your Vercel project settings</li>
              <li>Navigate to the Environment Variables section</li>
              <li>Add the following variables:</li>
            </ol>
            <div className="code-block">
              <pre>{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for server-side operations)`}</pre>
            </div>
            <p className="mt-4">
              Also create a local <code>.env.local</code> file with the same variables for development.
            </p>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl mb-4">Ready to deploy your portfolio?</p>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
            >
              Deploy to Vercel
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
