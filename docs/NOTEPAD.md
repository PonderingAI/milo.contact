# Project System Debugging Notes

## Issues Identified

### 1. Project Creation/Edit Flow Issues
- **Problem**: After saving a project, it automatically redirects to the edit page
- **Analysis**: This is likely happening in the `handleSubmit` function in `project-editor.tsx` or `project-form.tsx`
- **Potential Fix**: Modify the redirect behavior after successful project creation to go back to the projects list instead of the edit page

### 2. Missing BTS (Behind The Scenes) Content
- **Problem**: BTS content is missing on both edit page and landing page
- **Analysis**: 
  - The BTS images might not be properly loaded from the database
  - The array of BTS images might be empty or not properly passed to the components
  - There could be a rendering condition that's preventing BTS content from displaying
- **Potential Fix**: 
  - Verify BTS images are being fetched correctly in `getProjectById` function
  - Check if BTS images are being properly stored in the database
  - Ensure the component that renders BTS images is receiving the data correctly

### 3. Video Playback Issues
- **Problem**: Videos appear briefly and then vanish
- **Analysis**: 
  - Console errors indicate multiple issues:
    - Autoplay restrictions: Browsers restrict autoplay unless video is muted or user has interacted
    - YouTube JS player signature extraction failure: This could be due to YouTube API changes
    - Feature Policy errors: Browser is blocking certain iframe features
  - The video player component might be failing to handle these errors gracefully
- **Potential Fix**:
  - Update the VideoPlayer component to handle errors better
  - Ensure videos are muted when autoplaying
  - Add a more robust fallback mechanism when videos fail to load
  - Update YouTube embed parameters to comply with latest requirements

### 4. Code Issues
- **Problem**: Console reports "unreachable code after return statement"
- **Analysis**: There's likely dead code in one of the components, possibly in the video player
- **Potential Fix**: Review all components, especially VideoPlayer and VideoBackground, for code that appears after return statements

## Detailed Analysis of Video Issues

### Autoplay Restrictions
Modern browsers restrict autoplay of videos with sound unless:
1. User has interacted with the domain (clicked, tapped, etc.)
2. On mobile, the user has added the site to their home screen
3. The video is muted

Our implementation should:
- Always include `muted=1` in YouTube embeds
- Add `&mute=1` to video URLs
- Use the `muted` attribute for HTML5 video elements

### YouTube API Issues
The error "Failed to extract signature decipher algorithm" suggests:
1. YouTube may have changed their API or embed format
2. Our code might be using an outdated method to embed YouTube videos
3. There could be a Content Security Policy blocking script execution

### Feature Policy Warnings
The browser is reporting Feature Policy warnings for:
- picture-in-picture
- accelerometer
- and others

This happens when an iframe tries to use features that are either:
1. Not supported by the browser
2. Blocked by the site's Feature Policy
3. Not properly declared in the `allow` attribute of the iframe

## Next Steps for Investigation

1. Examine the network requests when loading a project page to see if BTS images are being requested
2. Check browser console for CORS or other network errors
3. Verify the database schema and ensure BTS images are properly linked to projects
4. Test video embedding with minimal code to isolate the issue
5. Review the redirect logic in project creation/editing flow
