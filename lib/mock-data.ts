/**
 * Mock Data
 * 
 * Separated from project-data.ts to avoid import issues with server-only modules
 */

export interface Project {
  id: string
  title: string
  category: string
  role: string
  image: string
  thumbnail_url?: string // This is where video URLs are stored
  video_platform?: string
  video_id?: string
  description?: string
  special_notes?: string
  created_at?: string
  updated_at?: string
  project_date?: string
  is_public?: boolean
  // type is deprecated - use category or tags instead
  type?: string
  // Virtual property for tags - not stored in database
  tags?: string[]
}

/**
 * Behind-the-scenes image interface
 */
export interface BtsImage {
  id: string
  project_id: string
  image_url: string
  caption?: string
  size?: "small" | "medium" | "large"
  aspect_ratio?: "square" | "portrait" | "landscape"
  is_video?: boolean
  video_url?: string
  video_platform?: string
  video_id?: string
  created_at?: string
}

// Mock data for development - will be replaced by Supabase data in production
export const mockProjects: Project[] = [
  // Directed Projects
  {
    id: "directed-1",
    title: "Short Film Title",
    category: "Short Film",
    role: "Director",
    image: "/images/project1.jpg",
    thumbnail_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Changed from video_url to thumbnail_url
    description: "A compelling short film exploring themes of identity and belonging in a post-digital world.",
    special_notes:
      "This project was particularly special because we shot it entirely during golden hour over three consecutive days, creating a consistent and dreamlike visual atmosphere.",
    tags: ["Short Film", "Director"],
    project_date: "2024-03-15",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "directed-2",
    title: "Music Video Project",
    category: "Music Video",
    role: "Director",
    image: "/images/project2.jpg",
    thumbnail_url: "https://vimeo.com/123456789", // Changed from video_url to thumbnail_url
    description: "An experimental music video featuring innovative visual techniques and storytelling.",
    special_notes:
      "Working with the artist to develop a visual language that complemented the music was a rewarding creative challenge.",
    tags: ["Music Video", "Director"],
    project_date: "2024-05-20",
    created_at: "2024-01-02T00:00:00Z",
  },

  // Camera Work Projects
  {
    id: "camera-1",
    title: "Feature Film",
    category: "Feature Film",
    role: "1st AC",
    image: "/images/project5.jpg",
    thumbnail_url: "https://youtube.com/watch?v=i_HtDNSxCnE", // Changed from video_url to thumbnail_url
    description: "Worked as 1st AC on this award-winning feature film, managing focus and camera operations.",
    special_notes:
      "The challenging lighting conditions and complex camera movements made this project particularly rewarding.",
    tags: ["Feature Film", "1st AC"],
    project_date: "2024-07-10",
    created_at: "2024-01-03T00:00:00Z",
  },
  {
    id: "camera-2",
    title: "TV Series",
    category: "Television",
    role: "2nd AC",
    image: "/images/project6.jpg",
    thumbnail_url: "https://www.youtube.com/watch?v=lmnopqrstuv", // Changed from video_url to thumbnail_url
    description: "Served as 2nd AC for this popular TV series, handling equipment and supporting the camera team.",
    special_notes: "Working with a seasoned DP taught me invaluable lessons about lighting and composition.",
    tags: ["Television", "2nd AC"],
    project_date: "2024-01-22",
    created_at: "2024-01-04T00:00:00Z",
  },

  // Production Projects
  {
    id: "production-1",
    title: "Short Film",
    category: "Short Film",
    role: "Production Assistant",
    image: "/images/project2.jpg",
    thumbnail_url: "https://youtube.com/watch?v=-fgtd87ywuw", // Changed from video_url to thumbnail_url
    description: "Provided essential support as a PA on this award-winning short film production.",
    special_notes: "Being part of such a collaborative and creative team was an incredible learning experience.",
    tags: ["Short Film", "Production Assistant"],
    project_date: "2024-04-08",
    created_at: "2024-01-05T00:00:00Z",
  },
  {
    id: "production-2",
    title: "Music Video",
    category: "Music Video",
    role: "Production Assistant",
    image: "/images/project3.jpg",
    thumbnail_url: "https://youtube.com/watch?v=Oix719dXXb8", // Changed from video_url to thumbnail_url
    description: "Assisted with various aspects of production for this innovative music video.",
    special_notes: "The fast-paced production schedule taught me how to work efficiently under pressure.",
    tags: ["Music Video", "Production Assistant"],
    project_date: "2024-02-14",
    created_at: "2024-01-06T00:00:00Z",
  },

  // Photography Projects
  {
    id: "photo-1",
    title: "Landscape Series",
    category: "Landscape",
    role: "Photographer",
    image: "/images/project6.jpg",
    description: "A series of landscape photographs capturing the beauty of natural environments.",
    special_notes:
      "Spending weeks in remote locations to capture these images gave me a deeper appreciation for nature's beauty.",
    tags: ["Landscape", "Photographer"],
    project_date: "2024-06-30",
    created_at: "2024-01-07T00:00:00Z",
  },
  {
    id: "photo-2",
    title: "Portrait Collection",
    category: "Portrait",
    role: "Photographer",
    image: "/images/project7.jpg",
    description: "A collection of portrait photographs exploring human expression and identity.",
    special_notes:
      "Creating an environment where subjects felt comfortable enough to express their authentic selves was the key to these portraits.",
    tags: ["Portrait", "Photographer"],
    project_date: "2024-08-15",
    created_at: "2024-01-08T00:00:00Z",
  },
  {
    id: "ai-1",
    title: "AI Generated Art",
    category: "AI",
    role: "AI Artist",
    image: "/images/project4.jpg",
    description:
      "A collection of AI-generated artwork exploring the intersection of human creativity and machine learning.",
    special_notes:
      "This project uses cutting-edge AI models to create unique visual experiences that challenge our perception of art and creativity.",
    tags: ["AI", "AI Artist"],
    // No project_date to test null handling
    created_at: "2024-01-09T00:00:00Z",
  },
]

// Mock BTS images for development
export const mockBtsImages: BtsImage[] = [
  // For directed-1
  {
    id: "bts-1",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-1.jpg",
    caption: "Setting up the camera rig",
    size: "medium",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-2",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-2.jpg",
    caption: "Director discussing the scene",
    size: "large",
    aspect_ratio: "portrait",
  },
  {
    id: "bts-3",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-3.jpg",
    caption: "Lighting setup",
    size: "small",
    aspect_ratio: "square",
  },
  {
    id: "bts-4",
    project_id: "directed-1",
    image_url: "/images/bts/directed-1-4.jpg",
    caption: "Cast and crew",
    size: "medium",
    aspect_ratio: "landscape",
  },

  // For camera-1
  {
    id: "bts-5",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-1.jpg",
    caption: "Camera setup",
    size: "medium",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-6",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-2.jpg",
    caption: "Focus pulling",
    size: "small",
    aspect_ratio: "square",
  },
  {
    id: "bts-7",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-3.jpg",
    caption: "Camera team",
    size: "large",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-8",
    project_id: "camera-1",
    image_url: "/images/bts/camera-1-4.jpg",
    caption: "Equipment preparation",
    size: "medium",
    aspect_ratio: "portrait",
  },

  // BTS Video examples for testing
  {
    id: "bts-video-1",
    project_id: "directed-1",
    image_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    caption: "Behind the scenes video - Director's commentary",
    is_video: true,
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1",
    video_platform: "youtube",
    video_id: "dQw4w9WgXcQ",
    size: "large",
    aspect_ratio: "landscape",
  },
  {
    id: "bts-video-2",
    project_id: "camera-1",
    image_url: "https://img.youtube.com/vi/i_HtDNSxCnE/maxresdefault.jpg",
    caption: "Camera setup and operation footage",
    is_video: true,
    video_url: "https://www.youtube.com/embed/i_HtDNSxCnE?rel=0&modestbranding=1",
    video_platform: "youtube",
    video_id: "i_HtDNSxCnE",
    size: "large",
    aspect_ratio: "landscape",
  },
]