# Project System TODO List

## High Priority

### Fix Project Creation/Edit Flow
- [ ] Review `handleSubmit` function in project editor components
- [ ] Modify redirect behavior after project creation to return to projects list
- [ ] Add confirmation message when project is saved instead of redirecting

### Fix Video Player Issues
- [ ] Update VideoPlayer component to handle YouTube API changes
- [ ] Add proper error handling and fallbacks for video loading failures
- [ ] Ensure all video embeds include `muted=1` parameter for autoplay
- [ ] Update iframe `allow` attributes to include all required features
- [ ] Implement a more robust timeout and retry mechanism for video loading
- [ ] Add client-side detection of browser autoplay policies

### Fix BTS Content Display
- [ ] Debug BTS image loading in project detail pages
- [ ] Verify BTS images are being correctly saved to the database
- [ ] Check the query that fetches BTS images for projects
- [ ] Ensure BTS section is not conditionally hidden by CSS or JS logic

## Medium Priority

### Code Cleanup
- [ ] Find and fix "unreachable code after return statement" issues
- [ ] Review all components for proper error handling
- [ ] Add logging to track the flow of data through the application
- [ ] Implement better console debugging for video loading process

### Performance Improvements
- [ ] Optimize video loading to prevent layout shifts
- [ ] Add proper loading states for all media content
- [ ] Consider implementing lazy loading for BTS images
- [ ] Add image optimization for all project images

## Low Priority

### User Experience Enhancements
- [ ] Improve error messages for video loading failures
- [ ] Add retry button for failed video loads
- [ ] Implement better visual feedback during project saving
- [ ] Consider adding a preview mode before saving projects

## Testing Tasks
- [ ] Test project creation and editing on multiple browsers
- [ ] Verify BTS image upload and display across devices
- [ ] Test video playback on mobile and desktop browsers
- [ ] Verify all redirects and navigation flows work as expected
