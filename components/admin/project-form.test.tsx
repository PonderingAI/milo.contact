// components/admin/project-form.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectForm from './project-form'; // Adjust path as necessary
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock UnifiedMediaInput to control its behavior and spy on its props
let mockMainOnMediaAddedCallback: (urls: string[]) => void;
let mockMainOnVideoUrlSubmitCallback: (url: string) => void;
let mockBtsOnMediaAddedCallback: (urls: string[]) => void;
let mockBtsOnVideoUrlSubmitCallback: (url: string) => void;

jest.mock('./unified-media-input', () => {
  return jest.fn(({ identifier, onMediaAdded, onVideoUrlSubmit }) => {
    if (identifier === 'main') {
      mockMainOnMediaAddedCallback = onMediaAdded;
      mockMainOnVideoUrlSubmitCallback = onVideoUrlSubmit;
    } else if (identifier === 'bts') {
      mockBtsOnMediaAddedCallback = onMediaAdded;
      mockBtsOnVideoUrlSubmitCallback = onVideoUrlSubmit;
    }
    return <div data-testid={`mocked-umi-${identifier}`}>Mocked UnifiedMediaInput: {identifier}</div>;
  });
});

// Mock fetch for API calls made by ProjectForm (e.g., schema, initial BTS images, process-video-url)
global.fetch = jest.fn();

// Default mock project for edit mode
const mockProject = {
  id: 'project-123',
  title: 'Test Project',
  category: 'Test Category',
  role: 'Test Role',
  image: '', // Start with no image
  thumbnail_url: '',
  description: 'Test Description',
  is_public: true,
  publish_date: null,
  project_date: '2023-01-01',
};

describe('ProjectForm Component - Media Handling', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    // Default mock for schema check (called on mount)
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}, {column_name: 'thumbnail_url'}, {column_name: 'image'}] }), // include relevant columns
    });
    // Default mock for fetching existing categories/roles (called on mount)
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ categories: [], roles: [] }) });
     // Default mock for fetching existing BTS images in edit mode (called on mount if project.id exists)
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ images: [] }) });
  });

  test('renders two UnifiedMediaInput components', () => {
    render(<ProjectForm project={mockProject} mode="edit" />);
    expect(screen.getByTestId('mocked-umi-main')).toBeInTheDocument();
    expect(screen.getByText('Mocked UnifiedMediaInput: main')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-umi-bts')).toBeInTheDocument();
    expect(screen.getByText('Mocked UnifiedMediaInput: bts')).toBeInTheDocument();
  });

  test('handles main image addition via UnifiedMediaInput', async () => {
    render(<ProjectForm project={mockProject} mode="edit" />);
    
    const newImageUrls = ['http://example.com/main-image1.jpg'];
    act(() => {
      mockMainOnMediaAddedCallback(newImageUrls);
    });

    // Check if the image is displayed in the "Media Overview"
    // This requires knowing how ProjectForm displays them. Let's assume an img tag with alt text.
    // Wait for the image to appear in the overview section
    await waitFor(() => {
      const displayedImage = screen.getByAltText('Main image 1');
      expect(displayedImage).toHaveAttribute('src', 'http://example.com/main-image1.jpg');
    });
    // Also check if formData.image (cover image) is updated
    // This depends on internal logic of ProjectForm (e.g. first image becomes cover)
    // For now, we focus on the image being in the display list.
  });

  test('handles main video URL submission and processing', async () => {
    // Mock the /api/process-video-url response
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/process-video-url') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            success: true, 
            url: 'http://youtube.com/new-video', 
            thumbnailUrl: 'http://example.com/new-video-thumb.jpg',
            title: 'New Video Title',
            uploadDate: '2023-02-01' 
          }),
        });
      }
      // Fallback for other fetches (schema, bts, etc.)
      return Promise.resolve({ ok: true, json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}, {column_name: 'thumbnail_url'}, {column_name: 'image'}], images: [], categories: [], roles: [] }) });
    });
    
    render(<ProjectForm project={{...mockProject, image: '', title: ''}} mode="edit" />);
    
    act(() => {
      mockMainOnVideoUrlSubmitCallback('http://youtube.com/new-video');
    });

    // Wait for API call and state updates
    await waitFor(() => {
      // Check if the video is displayed (e.g., by its thumbnail)
      const displayedVideoThumbnail = screen.getByAltText('YouTube video 1'); // Assumes ProjectForm uses this alt text
      expect(displayedVideoThumbnail).toHaveAttribute('src', 'https://img.youtube.com/vi/new-video/hqdefault.jpg'); // Or the actual thumbnail from mock
    });
    
    // Check if title was updated from video metadata
    // This requires the title input to be accessible, e.g., by label or placeholder
    const titleInput = screen.getByPlaceholderText('Project Title');
    expect(titleInput).toHaveValue('New Video Title');

    // Check if cover image was updated from video thumbnail (if no image was set)
    const coverImageDisplay = screen.getAllByAltText(/Main image|YouTube video/i).find(img => img.closest('.ring-2.ring-blue-500'));
    expect(coverImageDisplay).toHaveAttribute('src', 'http://example.com/new-video-thumb.jpg');

  });

  test('handles BTS image addition via UnifiedMediaInput', async () => {
    render(<ProjectForm project={mockProject} mode="edit" />);
    
    const newBtsImageUrls = ['http://example.com/bts-image1.jpg'];
    act(() => {
      mockBtsOnMediaAddedCallback(newBtsImageUrls);
    });

    await waitFor(() => {
      const displayedBtsImage = screen.getByAltText('BTS image 1');
      expect(displayedBtsImage).toHaveAttribute('src', 'http://example.com/bts-image1.jpg');
    });
  });
  
  test('handles BTS video URL submission and processing', async () => {
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/process-video-url') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            success: true, 
            url: 'http://youtube.com/new-bts-video', 
            thumbnailUrl: 'http://example.com/new-bts-video-thumb.jpg', // BTS videos might also have thumbnails
            title: 'New BTS Video Title' 
            // No uploadDate for BTS for this test, to differentiate from main video test
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ columns: [{column_name: 'id'}], images: [], categories: [], roles: [] }) });
    });

    render(<ProjectForm project={mockProject} mode="edit" />);
    
    act(() => {
      mockBtsOnVideoUrlSubmitCallback('http://youtube.com/new-bts-video');
    });

    await waitFor(() => {
      // Assuming BTS videos are displayed with a generic "Video" text or their thumbnail if available
      // If ProjectForm uses thumbnails for BTS videos:
      // const displayedBtsVideoThumbnail = screen.getByAltText('YouTube video 1'); // Adjust if alt text differs for BTS
      // expect(displayedBtsVideoThumbnail).toHaveAttribute('src', 'https://img.youtube.com/vi/new-bts-video/hqdefault.jpg');
      
      // For simplicity, let's assume it adds a generic "Video" placeholder if no specific thumbnail logic for BTS videos in overview
      // This part is highly dependent on ProjectForm's rendering logic for BTS videos
      const btsVideoElements = screen.getAllByText("Video"); // This is a placeholder, adjust selector
      expect(btsVideoElements.length).toBeGreaterThanOrEqual(1);

      // Check if the thumbnail from process-video-url (if any) is added to btsImages
      const btsThumb = screen.queryByAltText('BTS image 1'); // If it adds as an image
      if (btsThumb) {
        expect(btsThumb).toHaveAttribute('src', 'http://example.com/new-bts-video-thumb.jpg');
      }
    });
  });

  describe('Media Removal', () => {
    test('removes a main image', async () => {
      render(<ProjectForm project={mockProject} mode="edit" />);
      act(() => { mockMainOnMediaAddedCallback(['http://example.com/main-image-to-remove.jpg']); });
      
      await waitFor(() => expect(screen.getByAltText('Main image 1')).toBeInTheDocument());
      fireEvent.click(screen.getByTitle('Remove image'));
      await waitFor(() => expect(screen.queryByAltText('Main image 1')).not.toBeInTheDocument());
    });

    test('removes a main video', async () => {
       (fetch as jest.Mock).mockImplementation((url) => { // for process-video-url
        if (url === '/api/process-video-url') return Promise.resolve({ ok: true, json: async () => ({ success: true, url: 'http://youtube.com/main-vid-to-remove', thumbnailUrl: 'http://example.com/thumb.jpg' }) });
        return Promise.resolve({ ok: true, json: async () => ({ columns: [{column_name: 'id'}], images: [], categories: [], roles: [] }) });
      });
      render(<ProjectForm project={mockProject} mode="edit" />);
      act(() => { mockMainOnVideoUrlSubmitCallback('http://youtube.com/main-vid-to-remove'); });

      await waitFor(() => expect(screen.getByAltText('YouTube video 1')).toBeInTheDocument());
      fireEvent.click(screen.getByTitle('Remove video'));
      await waitFor(() => expect(screen.queryByAltText('YouTube video 1')).not.toBeInTheDocument());
    });

    test('removes a BTS image', async () => {
      render(<ProjectForm project={mockProject} mode="edit" />);
      act(() => { mockBtsOnMediaAddedCallback(['http://example.com/bts-image-to-remove.jpg']); });

      await waitFor(() => expect(screen.getByAltText('BTS image 1')).toBeInTheDocument());
      fireEvent.click(screen.getByTitle('Remove image')); // Assuming same title for remove button
      await waitFor(() => expect(screen.queryByAltText('BTS image 1')).not.toBeInTheDocument());
    });

    test('removes a BTS video', async () => {
      (fetch as jest.Mock).mockImplementation((url) => { // for process-video-url
        if (url === '/api/process-video-url') return Promise.resolve({ ok: true, json: async () => ({ success: true, url: 'http://youtube.com/bts-vid-to-remove', thumbnailUrl: 'http://example.com/bts-thumb.jpg' }) });
        return Promise.resolve({ ok: true, json: async () => ({ columns: [{column_name: 'id'}], images: [], categories: [], roles: [] }) });
      });
      render(<ProjectForm project={mockProject} mode="edit" />);
      act(() => { mockBtsOnVideoUrlSubmitCallback('http://youtube.com/bts-vid-to-remove'); });
      
      // This relies on how BTS videos are rendered. If they also use thumbnails:
      await waitFor(() => {
        // Check for the video's thumbnail or a generic video placeholder
        const btsVideoThumb = screen.queryByAltText('YouTube video 1'); // Or other identifier used for BTS videos
        const genericVideoPlaceholder = screen.queryAllByText("Video").length > 0;
        expect(btsVideoThumb || genericVideoPlaceholder).toBeTruthy();
      });
      
      // Find the remove button. This selector might need to be very specific if multiple videos exist.
      // For this test, assume it's the only BTS video.
      const removeButton = screen.getAllByTitle('Remove video').find(btn => btn.closest('.relative.group')?.innerHTML.includes('bts-vid-to-remove') || btn.closest('.relative.group')?.innerHTML.includes('BTS'));
      expect(removeButton).toBeInTheDocument();
      fireEvent.click(removeButton!);

      await waitFor(() => {
        const btsVideoThumbAfterRemove = screen.queryByAltText('YouTube video 1'); // Or other identifier
        const genericVideoPlaceholderAfterRemove = screen.queryAllByText("Video").length === 0; // Assuming it was the only one
        expect(btsVideoThumbAfterRemove === null || genericVideoPlaceholderAfterRemove).toBeTruthy();
      });
    });
  });

  describe('Setting Cover Image and Main Video', () => {
    test('sets a main image as cover image', async () => {
      render(<ProjectForm project={mockProject} mode="edit" />);
      act(() => { 
        mockMainOnMediaAddedCallback(['http://example.com/image1.jpg', 'http://example.com/image2.jpg']); 
      });

      await waitFor(() => {
        expect(screen.getByAltText('Main image 1')).toBeInTheDocument();
        expect(screen.getByAltText('Main image 2')).toBeInTheDocument();
      });
      
      // Image 1 should be cover by default
      expect(screen.getByAltText('Main image 1').closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')?.textContent).toBe('Cover');
      
      // Click "Set as cover image" on image 2
      const setCoverButton = screen.getByAltText('Main image 2').closest('div.relative.group')?.querySelector('button[title="Set as cover image"]');
      expect(setCoverButton).toBeInTheDocument();
      fireEvent.click(setCoverButton!);

      await waitFor(() => {
        expect(screen.getByAltText('Main image 2').closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')?.textContent).toBe('Cover');
        expect(screen.getByAltText('Main image 1').closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')).toBeNull();
      });
    });

    test('sets a main video as main video', async () => {
      (fetch as jest.Mock).mockImplementation((url) => { // for process-video-url
        if (url === '/api/process-video-url') {
          const videoId = (JSON.parse(arguments[1].body as string)).url.split('/').pop();
          return Promise.resolve({ ok: true, json: async () => ({ success: true, url: `http://youtube.com/${videoId}`, thumbnailUrl: `http://example.com/${videoId}-thumb.jpg` }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({ columns: [{column_name: 'id'}], images: [], categories: [], roles: [] }) });
      });

      render(<ProjectForm project={mockProject} mode="edit" />);
      act(() => { 
        mockMainOnVideoUrlSubmitCallback('http://youtube.com/video1');
      });
      await waitFor(() => expect(screen.getByAltText('YouTube video 1')).toBeInTheDocument());
      act(() => {
        mockMainOnVideoUrlSubmitCallback('http://youtube.com/video2');
      });
      await waitFor(() => expect(screen.getByAltText('YouTube video 2')).toBeInTheDocument());

      // Video 1 should be main by default (as it was added first and set thumbnail_url)
      expect(screen.getByAltText('YouTube video 1').closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')?.textContent).toBe('Main');
      
      // Click "Set as main video" on video 2
      const setMainVideoButton = screen.getByAltText('YouTube video 2').closest('div.relative.group')?.querySelector('button[title="Set as main video"]');
      expect(setMainVideoButton).toBeInTheDocument();
      fireEvent.click(setMainVideoButton!);

      await waitFor(() => {
        expect(screen.getByAltText('YouTube video 2').closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')?.textContent).toBe('Main');
        expect(screen.getByAltText('YouTube video 1').closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')).toBeNull();
      });
    });
  });

  test('initial loading of existing media in edit mode', async () => {
    const projectWithExistingMedia = {
      ...mockProject,
      image: 'http://example.com/existing-cover.jpg', // Main cover image
      thumbnail_url: 'http://youtube.com/existing-main-video', // Main video
    };

    // Mock for fetching BTS images for this specific project
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url === `/api/projects/bts-images/${projectWithExistingMedia.id}`) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ images: ['http://example.com/existing-bts1.jpg', 'http://youtube.com/existing-bts-vid'] }),
        });
      }
      // Fallback for schema, categories, roles
      return Promise.resolve({ ok: true, json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}, {column_name: 'thumbnail_url'}, {column_name: 'image'}], images: [], categories: [], roles: [] }) });
    });
    
    render(<ProjectForm project={projectWithExistingMedia} mode="edit" />);

    await waitFor(() => {
      // Check main cover image
      const coverImage = screen.getByAltText('Main image 1'); // Assumes it's the first one
      expect(coverImage).toHaveAttribute('src', 'http://example.com/existing-cover.jpg');
      expect(coverImage.closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')?.textContent).toBe('Cover');

      // Check main video
      const mainVideo = screen.getByAltText('YouTube video 1'); // Assumes it's the first one
      expect(mainVideo).toHaveAttribute('src', 'https://img.youtube.com/vi/existing-main-video/hqdefault.jpg');
      expect(mainVideo.closest('div.relative.group')?.querySelector('.absolute.top-1.left-1')?.textContent).toBe('Main');
      
      // Check BTS image
      expect(screen.getByAltText('BTS image 1')).toHaveAttribute('src', 'http://example.com/existing-bts1.jpg');
      
      // Check BTS video (assuming it's displayed similarly to main videos or as a generic placeholder)
      const btsVideoThumb = screen.getByAltText('YouTube video 2'); // Or appropriate alt text if it's different for BTS
      expect(btsVideoThumb).toHaveAttribute('src', 'https://img.youtube.com/vi/existing-bts-vid/hqdefault.jpg');
    });
  });

  test('sends existing BTS media URLs when updating project without changing BTS media', async () => {
    const initialBtsImageUrls = ['http://example.com/bts-existing1.jpg', 'http://example.com/bts-existing2.png'];
    const projectWithBts = {
      ...mockProject, // from your test setup
      id: 'bts-project-id', // ensure it has an id for edit mode
    };

    // Mock initial fetch for schema
    (fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}, {column_name: 'description'}] }),
    }));
    // Mock initial fetch for categories/roles
    (fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    
    // Mock initial fetch for existing BTS media for this specific project ID
    (fetch as jest.Mock).mockImplementationOnce((url) => {
      if (url === `/api/projects/bts-images/${projectWithBts.id}`) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ images: initialBtsImageUrls, success: true }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) }); // Default for other calls
    });

    // Mock the project update API (PUT to /api/projects/update/[id])
    (fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: async () => ({ success: true, data: [{...projectWithBts, title: 'Updated Title'}] }),
    }));

    // This is the crucial mock for the BTS images POST
    let btsApiCallBody: any = null;
    (fetch as jest.Mock).mockImplementationOnce(async (url, options) => {
      if (url === '/api/projects/bts-images' && options?.method === 'POST') {
        btsApiCallBody = JSON.parse(options.body as string);
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) }); // Default for other calls
    });
    
    render(<ProjectForm project={projectWithBts} mode="edit" />);

    // Wait for initial BTS images to be loaded and displayed (optional, but good for sanity)
    await waitFor(() => {
      expect(screen.getByAltText('BTS image 1')).toBeInTheDocument();
      expect(screen.getByAltText('BTS image 2')).toBeInTheDocument();
    });

    // Simulate changing a non-BTS field, e.g., description
    const descriptionTextarea = screen.getByPlaceholderText('Describe the project...');
    await userEvent.type(descriptionTextarea, ' Some new description text.');

    // Simulate form submission
    const submitButton = screen.getByRole('button', { name: /Update Project/i });
    await userEvent.click(submitButton);

    // Wait for the API calls to complete
    await waitFor(() => {
      // Check that the PUT to /api/projects/update/[id] was called
      expect(fetch).toHaveBeenCalledWith(`/api/projects/update/${projectWithBts.id}`, expect.anything());
      // Check that the POST to /api/projects/bts-images was called
      expect(fetch).toHaveBeenCalledWith('/api/projects/bts-images', expect.objectContaining({ method: 'POST' }));
    });
    
    // Assert that the body of the BTS images POST call contains the original BTS URLs
    expect(btsApiCallBody).not.toBeNull();
    expect(btsApiCallBody.projectId).toBe(projectWithBts.id);
    expect(btsApiCallBody.images).toEqual(initialBtsImageUrls); // This is the key assertion
    expect(btsApiCallBody.replaceExisting).toBe(true); // Current behavior
  });

describe('ProjectForm BTS Media - Detailed Scenarios', () => {
  const btsProjectId = 'bts-scenario-project';
  const mockBtsProject = {
    ...mockProject, // Assuming mockProject is defined in your test setup
    id: btsProjectId,
    title: 'BTS Scenario Test Project',
  };

  // Helper to simulate media addition via the mocked UnifiedMediaInput for BTS
  const addBtsMedia = (urls: string[]) => {
    act(() => {
      if (mockBtsOnMediaAddedCallback) { // Ensure callback is set by UMI mock
        mockBtsOnMediaAddedCallback(urls);
      } else {
        throw new Error("mockBtsOnMediaAddedCallback is not defined. Check UnifiedMediaInput mock.");
      }
    });
  };
  
  // Helper to simulate video URL submission for BTS
   const submitBtsVideoUrl = (url: string) => {
    act(() => {
      if (mockBtsOnVideoUrlSubmitCallback) {
        mockBtsOnVideoUrlSubmitCallback(url);
      } else {
        throw new Error("mockBtsOnVideoUrlSubmitCallback is not defined.");
      }
    });
  };


  beforeEach(() => {
    // Reset fetch mocks for each test in this describe block
    (fetch as jest.Mock).mockReset();
    
    // Default mocks for ProjectForm mount in edit mode
    // 1. Schema
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}, {column_name: 'description'}] }),
    });
    // 2. Categories/Roles
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // 3. Initial BTS media (default to none for these specific tests, can be overridden)
    (fetch as jest.Mock).mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ images: [], success: true }) 
    });
  });

  test('adds a new BTS image and saves', async () => {
    let btsApiCallBody: any = null;
    // Mock project update and BTS media update APIs
    (fetch as jest.Mock)
      // After initial loads, next is Project Update PUT
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockBtsProject] }) })
      // Then BTS POST
      .mockImplementationOnce(async (url, options) => { 
        if (url === '/api/projects/bts-images' && options?.method === 'POST') {
          btsApiCallBody = JSON.parse(options.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [{image_url: 'http://example.com/new-bts.jpg'}] }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) }); // Should not happen if order is right
      });

    render(<ProjectForm project={mockBtsProject} mode="edit" />);
    
    addBtsMedia(['http://example.com/new-bts.jpg']);
    await waitFor(() => {
      expect(screen.getByAltText('BTS image 1')).toHaveAttribute('src', 'http://example.com/new-bts.jpg');
    });

    await userEvent.click(screen.getByRole('button', { name: /Update Project/i }));

    await waitFor(() => {
      expect(btsApiCallBody).not.toBeNull();
      expect(btsApiCallBody.images).toEqual(['http://example.com/new-bts.jpg']);
      expect(btsApiCallBody.replaceExisting).toBe(true);
    });
  });

  test('adds a BTS video and saves', async () => {
    let btsApiCallBody: any = null;
    (fetch as jest.Mock)
      // 1. Initial schema
      // 2. Initial categories/roles
      // 3. Initial BTS GET (empty)
      // 4. process-video-url for the new BTS video
      .mockResolvedValueOnce({ // for process-video-url
        ok: true,
        json: async () => ({ 
          success: true, 
          url: 'http://youtube.com/bts-video', 
          thumbnailUrl: 'http://example.com/bts-video-thumb.jpg', 
          // ... other metadata from process-video-url
        }),
      })
      // 5. Project Update PUT
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockBtsProject] }) })
      // 6. BTS POST
      .mockImplementationOnce(async (url, options) => {
        if (url === '/api/projects/bts-images' && options?.method === 'POST') {
          btsApiCallBody = JSON.parse(options.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [{image_url: 'http://youtube.com/bts-video'}] }) });
        }
        // This mock will also handle the /api/process-video-url call if not mocked earlier in chain
        if (url === '/api/process-video-url') {
             return Promise.resolve({
                ok: true,
                json: async () => ({ 
                success: true, 
                url: 'http://youtube.com/bts-video', 
                thumbnailUrl: 'http://example.com/bts-video-thumb.jpg',
                title: 'BTS Video Title' 
                }),
            });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) }); 
      });
    
    render(<ProjectForm project={mockBtsProject} mode="edit" />);
    
    submitBtsVideoUrl('http://youtube.com/bts-video');

    // Wait for the video to appear in the BTS overview (e.g., by its thumbnail or a generic video icon)
    await waitFor(() => {
      // Assuming videos are displayed with an img tag for thumbnail, or a specific data-testid
      expect(screen.getByAltText('YouTube video 1')).toBeInTheDocument(); // Adjust selector as needed
    });

    await userEvent.click(screen.getByRole('button', { name: /Update Project/i }));

    await waitFor(() => {
      expect(btsApiCallBody).not.toBeNull();
      expect(btsApiCallBody.images).toEqual(['http://youtube.com/bts-video']);
      expect(btsApiCallBody.replaceExisting).toBe(true);
    });
  });

  test('removes an existing BTS image and saves', async () => {
    const initialBts = ['http://example.com/bts-todelete.jpg', 'http://example.com/bts-tokeep.jpg'];
    // Override initial BTS media fetch for this test
    (fetch as jest.Mock).mockReset(); // Reset previous beforeEach mocks
     // 1. Schema
    (fetch as jest.Mock).mockResolvedValueOnce({ok: true,json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}] }),});
    // 2. Categories/Roles
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // 3. Initial BTS GET
    (fetch as jest.Mock).mockResolvedValueOnce({ok: true, json: async () => ({ images: initialBts, success: true })});


    let btsApiCallBody: any = null;
    // Mock project update and BTS media update APIs
    (fetch as jest.Mock)
      // 4. Project Update PUT
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockBtsProject] }) })
      // 5. BTS POST
      .mockImplementationOnce(async (url, options) => {
        if (url === '/api/projects/bts-images' && options?.method === 'POST') {
          btsApiCallBody = JSON.parse(options.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) }); // Response data here is less critical for this test
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

    render(<ProjectForm project={mockBtsProject} mode="edit" />);

    // Wait for both images to be displayed
    await waitFor(() => {
      expect(screen.getByAltText('BTS image 1')).toHaveAttribute('src', initialBts[0]);
      expect(screen.getByAltText('BTS image 2')).toHaveAttribute('src', initialBts[1]);
    });

    // Find and click the remove button for the first BTS image
    // This assumes remove buttons are identifiable, e.g., within the div of the image.
    const btsImage1ToRemove = screen.getByAltText('BTS image 1');
    const removeButton = btsImage1ToRemove.closest('div[class*="relative group"]')?.querySelector('button[title="Remove image"]'); // Adjust selector
    expect(removeButton).toBeInTheDocument();
    await userEvent.click(removeButton!);
    
    // Wait for UI update (image removed)
    await waitFor(() => {
      expect(screen.queryByAltText(initialBts[0])).not.toBeInTheDocument(); // Check by specific src to be sure
      expect(screen.getByAltText('BTS image 1')).toHaveAttribute('src', initialBts[1]); // The second image is now "BTS image 1"
    });

    await userEvent.click(screen.getByRole('button', { name: /Update Project/i }));

    await waitFor(() => {
      expect(btsApiCallBody).not.toBeNull();
      expect(btsApiCallBody.images).toEqual(['http://example.com/bts-tokeep.jpg']);
      expect(btsApiCallBody.replaceExisting).toBe(true);
    });
  });

  test('deletes all BTS media and saves', async () => {
    const initialBts = ['http://example.com/bts-deleteall1.jpg', 'http://example.com/bts-deleteall2.jpg'];
    (fetch as jest.Mock).mockReset();
    (fetch as jest.Mock).mockResolvedValueOnce({ok: true,json: async () => ({ columns: [{column_name: 'id'}, {column_name: 'title'}] }),});
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    (fetch as jest.Mock).mockResolvedValueOnce({ok: true, json: async () => ({ images: initialBts, success: true })});

    let btsApiCallBody: any = null;
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [mockBtsProject] }) })
      .mockImplementationOnce(async (url, options) => {
        if (url === '/api/projects/bts-images' && options?.method === 'POST') {
          btsApiCallBody = JSON.parse(options.body as string);
          return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      
    render(<ProjectForm project={mockBtsProject} mode="edit" />);
    await waitFor(() => {
      expect(screen.getByAltText('BTS image 1')).toBeInTheDocument();
      expect(screen.getByAltText('BTS image 2')).toBeInTheDocument();
    });

    // Remove all BTS images
    const btsMediaSection = screen.getByText('Behind the Scenes').closest('div');
    expect(btsMediaSection).toBeInTheDocument();
    const removeButtons = within(btsMediaSection!).getAllByTitle('Remove image'); // Use within to scope

    for (const button of removeButtons) {
        // The within scope should be enough, but an extra check doesn't hurt if structure is complex
        // if(button.closest('div[class*="relative group"]')?.querySelector('img[alt^="BTS image"]')) {
        await userEvent.click(button);
        // }
    }
    
    await waitFor(() => {
      expect(screen.queryByAltText(/BTS image/i)).not.toBeInTheDocument();
      expect(screen.getByText('No BTS media added yet')).toBeInTheDocument(); // Assuming this text appears
    });
    
    await userEvent.click(screen.getByRole('button', { name: /Update Project/i }));

    await waitFor(() => {
      expect(btsApiCallBody).not.toBeNull();
      expect(btsApiCallBody.images).toEqual([]); // Empty array
      expect(btsApiCallBody.replaceExisting).toBe(true);
    });
  });
});
});
