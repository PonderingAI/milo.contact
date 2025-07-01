"use client"

import { useState } from "react"
import ProjectDetailContent from "../projects/[id]/project-detail-content"

// Test project with BTS videos
const testProject = {
  id: "test-project",
  title: "Test Project with BTS Videos",
  category: "Short Film",
  role: "Director",
  image: "/images/project1.jpg",
  thumbnail_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  description: "A test project to verify BTS video functionality works correctly.",
  special_notes: "This project includes BTS videos to test the video playback in lightbox.",
  project_date: "2024-03-15",
  bts_images: [
    // Regular BTS image
    {
      id: "bts-img-1",
      project_id: "test-project",
      image_url: "/images/project1.jpg",
      caption: "Regular BTS image",
      is_video: false,
    },
    // BTS Video - YouTube
    {
      id: "bts-video-1",
      project_id: "test-project",
      image_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      caption: "BTS Video - Behind the scenes footage",
      is_video: true,
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
      video_platform: "youtube",
      video_id: "dQw4w9WgXcQ",
    },
    // Another BTS Video - different YouTube video
    {
      id: "bts-video-2", 
      project_id: "test-project",
      image_url: "https://img.youtube.com/vi/i_HtDNSxCnE/maxresdefault.jpg",
      caption: "Camera operation demonstration",
      is_video: true,
      video_url: "https://www.youtube.com/embed/i_HtDNSxCnE?rel=0&modestbranding=1",
      video_platform: "youtube",
      video_id: "i_HtDNSxCnE",
    },
  ],
}

export default function TestBTSPage() {
  return (
    <main className="min-h-screen bg-black text-white w-full">
      <div className="px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">BTS Video Test Page</h1>
        <div className="bg-gray-900 p-4 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Scroll down to the "Behind the Scenes" section</li>
            <li>Look for items with play button overlays (these are videos)</li>
            <li>Click on BTS videos to open them in the lightbox</li>
            <li>Videos should play in an embedded iframe within the lightbox</li>
            <li>Regular images should display normally without video controls</li>
          </ul>
        </div>
      </div>
      <ProjectDetailContent project={testProject} />
    </main>
  )
}