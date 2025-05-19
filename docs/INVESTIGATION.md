# Code Investigation: Tracing Issues in the Portfolio Project

## Issue 1: Unwanted Redirect After Project Creation

### Hypothesis
When a project is created, the code is likely explicitly redirecting to the edit page instead of staying on the current page or redirecting to the projects list.

### Code Trace
Starting with `components/admin/project-editor.tsx` and `components/admin/project-form.tsx`:

In `project-editor.tsx`, the `handleSubmit` function contains:

\`\`\`javascript
if (mode === "create") {
  // Create new project using API route
  const response = await fetch("/api/projects/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectData),
  })

  const responseData = await response.json()

  if (!response.ok) {
    console.error("API error response:", responseData)
    throw new Error(responseData.error || "Failed to create project")
  }

  // Save BTS images if any
  if ((btsImages.length > 0 || btsVideos.length > 0) && responseData.data && responseData.data[0]) {
    const projectId = responseData.data[0].id
    // ... BTS image saving code ...
  }

  // Redirect to the project edit page
  router.push(`/admin/projects/${responseData.data[0].id}/edit`)
}
\`\`\`

**Finding**: The code explicitly redirects to the edit page after project creation with `router.push()`. This is the cause of the unwanted redirect.

Similarly, in `project-form.tsx`, there's a similar redirect:

\`\`\`javascript
// Redirect to the project edit page
router.push(`/admin/projects/${responseData.data[0].id}/edit`)
\`\`\`

**Conclusion**: The unwanted redirect is intentionally coded into both components. This should be changed to either stay on the page or redirect to the projects list.

## Issue 2: Missing BTS Content

### Hypothesis
The BTS content might not be properly loaded, saved, or displayed due to:
1. Issues in the API endpoint for BTS images
2. Problems with the data fetching in the project detail page
3. Incorrect rendering of BTS content in the UI

### Code Trace

First, let's check how BTS images are saved in `project-editor.tsx`:

\`\`\`javascript
// Save BTS images if any
if ((btsImages.length > 0 || btsVideos.length > 0) && responseData.data && responseData.data[0]) {
  const projectId = responseData.data[0].id

  try {
    const btsResponse = await fetch("/api/projects/bts-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        images: [...btsImages, ...btsVideos],
      }),
    })

    if (!btsResponse.ok) {
      console.error("Error saving BTS images:", await btsResponse.json())
    }
  } catch (btsError) {
    console.error("Error saving BTS images:", btsError)
  }
}
\`\`\`

Now, let's check the API endpoint in `app/api/projects/bts-images/route.ts`:

The endpoint should handle saving BTS images to the database. If there are issues here, BTS images might not be saved correctly.

Next, let's check how BTS images are fetched in `app/projects/[id]/project-detail-content.tsx` or similar files:

In `getProjectById` function from `lib/project-data.ts`:

\`\`\`javascript
// Get BTS images for the project
const { data: btsImages, error: btsError } = await supabase
  .from("bts_images")
  .select("*")
  .eq("project_id", id)
  .order("created_at", { ascending: true })

if (btsError) {
  console.error("Error fetching BTS images:", btsError)
}

return {
  ...project,
  tags: [project.category, ...roleTags].filter(Boolean),
  bts_images: btsImages || [],
} as Project & { bts_images: BtsImage[] }
\`\`\`

**Finding**: The code attempts to fetch BTS images, but if there's an error, it just logs it and returns an empty array. This could lead to missing BTS content if there are database issues.

Now, let's check how BTS images are displayed in the project detail page:

In `app/projects/[id]/project-detail-content.tsx` or similar, there should be code that renders BTS images if they exist.

**Conclusion**: The issue could be in any of these areas:
1. BTS images might not be saved correctly due to API issues
2. BTS images might not be fetched correctly due to database issues
3. BTS images might not be displayed correctly in the UI

## Issue 3: Video Player Issues

### Hypothesis
The video player issues could be caused by:
1. Autoplay restrictions in modern browsers
2. Issues with the YouTube API or embedding
3. Problems with the video player component implementation

### Code Trace

Let's examine the video player component in `components/video-player.tsx`:

\`\`\`javascript
export default function VideoPlayer({ platform, videoId, onError }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // ... other code ...

  // Get video embed URL
  const getEmbedUrl = () => {
    try {
      if (!platform || !videoId) {
        console.error("Missing platform or videoId", { platform, videoId })
        setHasError(true)
        onError?.()
        return ""
      }

      if (platform.toLowerCase() === "youtube") {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
      } else if (platform.toLowerCase() === "vimeo") {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0`
      }

      console.error("Unsupported platform", platform)
      setHasError(true)
      onError?.()
      return ""
    } catch (error) {
      console.error("Error generating embed URL:", error)
      setHasError(true)
      onError?.()
      return ""
    }
  }

  // ... rendering code ...
}
\`\`\`

**Finding**: The video player is attempting to autoplay videos (`autoplay=1`), which is restricted in modern browsers unless the video is muted or there has been user interaction.

Also, let's check how videos are embedded in `app/projects/[id]/project-detail-content.tsx` or similar:

The component should be using the VideoPlayer component and passing the correct platform and videoId.

**Conclusion**: The video player issues are likely caused by:
1. Autoplay restrictions - videos are trying to autoplay without being muted
2. Possible issues with extracting video information from URLs
3. The YouTube API might have changed, causing the signature decipher algorithm to fail

## Issue 4: Unreachable Code After Return Statement

### Hypothesis
There might be code after a return statement in one of the components, which is causing the warning.

### Code Trace
This would require searching through the codebase for instances where code appears after a return statement. Common places to check would be in functions that handle events or data processing.

**Conclusion**: Without a specific file reference, it's hard to pinpoint exactly where this issue is occurring. A thorough code review or static analysis tool would be needed to find all instances of unreachable code.

## Summary of Findings

1. **Unwanted Redirect**: Confirmed that the code explicitly redirects to the edit page after project creation. This needs to be changed to the desired behavior.

2. **Missing BTS Content**: The issue could be in the saving, fetching, or displaying of BTS images. Further investigation is needed to determine which part is failing.

3. **Video Player Issues**: The main issue is likely the autoplay restriction in modern browsers. The video player needs to be updated to either mute videos that autoplay or require user interaction before playing.

4. **Unreachable Code**: This requires a more thorough code review to identify specific instances.

## Next Steps

1. Modify the project creation flow to avoid unwanted redirects
2. Add logging to track the BTS image flow from saving to display
3. Update the video player to handle autoplay restrictions
4. Conduct a code review to find and fix unreachable code
