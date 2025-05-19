# Project Creation and BTS Content Issues

## Project Creation Page Issues

### Deep Dive into Project Creation Flow

#### Form Submission Flow
In `components/admin/project-editor.tsx`, the form submission process is:

1. User fills out form and clicks submit
2. `handleSubmit` function is called
3. Form data is validated
4. API request is made to create the project
5. If successful, BTS images are saved in a separate request
6. User is redirected to the edit page with `router.push()`

#### BTS Image Handling
BTS images are handled separately from the main project data:

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

**Key Issues**:
1. There's no waiting for the BTS image save to complete before redirecting
2. Errors in saving BTS images are logged but not shown to the user
3. The redirect happens regardless of whether BTS images were saved successfully

### API Endpoint for BTS Images

Let's examine the API endpoint that handles BTS images in `app/api/projects/bts-images/route.ts`:

This endpoint should:
1. Receive a project ID and array of image URLs
2. Save these to the `bts_images` table in the database
3. Return success or error

**Potential Issues**:
1. The endpoint might not be properly handling the array of images
2. There could be database constraints or permission issues
3. The response might not include enough information for proper error handling

## Missing BTS Content

### Data Flow for BTS Content

1. **Creation**: BTS images are uploaded and saved during project creation/editing
2. **Storage**: They should be stored in the `bts_images` table with a reference to the project
3. **Retrieval**: When viewing a project, `getProjectById` fetches the project and its BTS images
4. **Display**: The project detail page should render these images

### Fetching BTS Images

In `lib/project-data.ts`, the `getProjectById` function fetches BTS images:

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

**Potential Issues**:
1. If there's a database error, it's logged but an empty array is returned
2. The `bts_images` table might not exist or have the expected schema
3. The project ID might not be correctly formatted or matched

### Displaying BTS Images

In `app/projects/[id]/project-detail-content.tsx`, there should be code to display BTS images:

The component should:
1. Receive the project with its `bts_images` array
2. Check if the array exists and has items
3. Render the images in a gallery or similar component

**Potential Issues**:
1. The component might not be checking for the existence of BTS images
2. There might be conditional rendering that's incorrectly hiding the BTS section
3. The BTS images might be passed incorrectly from the parent component

## Upload Component UI Issues

### Current Implementation vs. Desired Implementation

#### Current Implementation
The upload component appears to be implemented as a tabbed interface where only one section is visible at a time:
- "Upload" tab shows drag & drop
- "Media Library" tab shows the library browser
- "Video URL" tab shows the URL input

This is controlled by the `Tabs` component from shadcn/ui:

\`\`\`jsx
<Tabs defaultValue="upload">
  <TabsList className="bg-gray-800">
    <TabsTrigger value="upload">Upload</TabsTrigger>
    <TabsTrigger value="library">Media Library</TabsTrigger>
    {mediaType !== "image" && <TabsTrigger value="video">Video URL</TabsTrigger>}
  </TabsList>

  <TabsContent value="upload">
    {/* Upload content */}
  </TabsContent>

  <TabsContent value="library">
    {/* Library content */}
  </TabsContent>

  <TabsContent value="video">
    {/* Video URL content */}
  </TabsContent>
</Tabs>
\`\`\`

#### Desired Implementation
The desired implementation is a single component with all elements visible at once:
1. Media Library button at the top
2. Video URL input in the middle
3. Browse Device button at the bottom
4. When dragging, the entire area becomes a drop zone

### Why the Change Didn't Work

The changes made to `components/admin/upload-widget.tsx` appear to have been implemented correctly, but there are two possible issues:

1. **Component Not Being Used**: The updated `UploadWidget` component might not be used in the project creation page. Instead, the page might be using `ProjectMediaUploader` which still uses the tabbed interface.

2. **CSS/Layout Issues**: The layout might be correct but CSS issues could be preventing it from displaying as intended.

Let's examine how `ProjectMediaUploader` uses `UploadWidget`:

In `components/admin/project-media-uploader.tsx`, it should be importing and using `UploadWidget`, but it might be implementing its own UI instead.

**Key Finding**: The `ProjectMediaUploader` component appears to be implementing its own tabbed interface rather than using the updated `UploadWidget` component. This explains why the UI hasn't changed despite updates to `UploadWidget`.
