// components/admin/unified-media-input.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnifiedMediaInput from './unified-media-input'; // Adjust path as necessary
import '@testing-library/jest-dom';

// Mock child components and external dependencies
jest.mock('./unified-media-library', () => {
  // Mock the UnifiedMediaLibrary component
  // It needs to call its onSelect prop when we want to simulate media selection
  return jest.fn(({ onSelect, selectionMode, mediaTypeFilter }) => (
    <div data-testid="mocked-unified-media-library">
      <button onClick={() => onSelect([{ id: 'mock-media-1', public_url: 'http://example.com/mock-image.jpg', filename: 'mock-image.jpg' }])}>
        Select Mock Media
      </button>
    </div>
  ));
});

// Mock fetch
global.fetch = jest.fn();

describe('UnifiedMediaInput Component', () => {
  const mockOnMediaAdded = jest.fn();
  const mockOnVideoUrlSubmit = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockOnMediaAdded.mockClear();
    mockOnVideoUrlSubmit.mockClear();
    (fetch as jest.Mock).mockClear();
  });

  test('renders initial state with three sections', () => {
    render(
      <UnifiedMediaInput
        identifier="test-uploader"
        onMediaAdded={mockOnMediaAdded}
        onVideoUrlSubmit={mockOnVideoUrlSubmit}
      />
    );

    expect(screen.getByText(/Browse Media Library/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste YouTube, Vimeo, etc. links/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Device Files/i)).toBeInTheDocument();
  });

  test('opens media library dialog and handles selection', async () => {
    render(
      <UnifiedMediaInput
        identifier="test-uploader"
        onMediaAdded={mockOnMediaAdded}
        onVideoUrlSubmit={mockOnVideoUrlSubmit}
      />
    );

    // Click the "Browse Media Library" button
    fireEvent.click(screen.getByText(/Browse Media Library/i));

    // The dialog should be open, containing the mocked UnifiedMediaLibrary
    // Check if the mocked component is visible (or a button inside it)
    const mockMediaLibrary = screen.getByTestId('mocked-unified-media-library');
    expect(mockMediaLibrary).toBeVisible();

    // Find the button inside the mocked component and click it to simulate selection
    const selectMediaButton = screen.getByText('Select Mock Media');
    fireEvent.click(selectMediaButton);

    // Verify onMediaAdded was called with the expected URL
    expect(mockOnMediaAdded).toHaveBeenCalledTimes(1);
    expect(mockOnMediaAdded).toHaveBeenCalledWith(['http://example.com/mock-image.jpg']);

    // Dialog should close (or check that mockMediaLibrary is no longer visible if Dialog unmounts it)
    // This depends on how the Dialog's open state is managed.
    // For now, we assume it closes. If not, this part of the test needs adjustment.
    // await waitFor(() => {
    //   expect(screen.queryByTestId('mocked-unified-media-library')).not.toBeInTheDocument();
    // });
  });

  test('handles video URL input and submission', async () => {
    const user = userEvent.setup();
    render(
      <UnifiedMediaInput
        identifier="test-uploader"
        onMediaAdded={mockOnMediaAdded}
        onVideoUrlSubmit={mockOnVideoUrlSubmit}
      />
    );

    const videoUrlTextarea = screen.getByPlaceholderText(/Paste YouTube, Vimeo, etc. links/i);
    const addLinkButton = screen.getByRole('button', { name: /Add Link/i });

    // Single URL
    await user.type(videoUrlTextarea, 'http://youtube.com/watch?v=123');
    await user.click(addLinkButton);
    expect(mockOnVideoUrlSubmit).toHaveBeenCalledWith('http://youtube.com/watch?v=123');
    expect(videoUrlTextarea).toHaveValue(''); // Input should clear

    // Multiple URLs (newline separated)
    await user.type(videoUrlTextarea, 'http://vimeo.com/456\nhttp://linkedin.com/feed/123');
    await user.click(addLinkButton);
    expect(mockOnVideoUrlSubmit).toHaveBeenCalledWith('http://vimeo.com/456');
    expect(mockOnVideoUrlSubmit).toHaveBeenCalledWith('http://linkedin.com/feed/123');
    expect(mockOnVideoUrlSubmit).toHaveBeenCalledTimes(3); // 1 from before + 2 new
    expect(videoUrlTextarea).toHaveValue('');
  });

  test('handles device file selection and upload', async () => {
    const user = userEvent.setup();
    (fetch as jest.Mock)
      // Mock for check-media-duplicate for file1 (not a duplicate)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isDuplicate: false }),
      })
      // Mock for bulk-upload for file1
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, publicUrl: 'http://example.com/uploaded-file1.jpg' }),
      })
      // Mock for check-media-duplicate for file2 (is a duplicate)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          isDuplicate: true, 
          existingItem: { public_url: 'http://example.com/existing-file2.png' } 
        }),
      });

    render(
      <UnifiedMediaInput
        identifier="test-device-upload"
        onMediaAdded={mockOnMediaAdded}
        onVideoUrlSubmit={mockOnVideoUrlSubmit}
        folder="test-folder"
      />
    );

    const file1 = new File(['content1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'document2.png', { type: 'image/png' });

    const hiddenFileInput = screen.getByTestId('hidden-device-file-input'); // Assuming you add data-testid="hidden-device-file-input" to the <input type="file" .../> in UnifiedMediaInput

    // Simulate file selection
    await user.upload(hiddenFileInput, [file1, file2]);
    
    // Wait for all promises (uploads, state updates) to resolve
    await waitFor(() => {
      expect(mockOnMediaAdded).toHaveBeenCalledTimes(1);
    });

    expect(mockOnMediaAdded).toHaveBeenCalledWith([
      'http://example.com/uploaded-file1.jpg', // from new upload
      'http://example.com/existing-file2.png', // from duplicate check
    ]);

    // Verify fetch calls
    // 1st call: check-media-duplicate for file1
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/check-media-duplicate', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ fileHash: expect.any(String), filename: 'photo1.jpg', folder: 'test-folder' }) 
    }));
    // 2nd call: bulk-upload for file1
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/bulk-upload', expect.any(Object)); // FormData is complex to match exactly
    // 3rd call: check-media-duplicate for file2
    expect(fetch).toHaveBeenNthCalledWith(3, '/api/check-media-duplicate', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ fileHash: expect.any(String), filename: 'document2.png', folder: 'test-folder' })
    }));
     expect(fetch).toHaveBeenCalledTimes(3); // Only 3 calls, file2 was a duplicate so no upload
  });

  test('handles drag and drop file upload', async () => {
    (fetch as jest.Mock)
      // Mock for check-media-duplicate for dropped-file.jpg (not a duplicate)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isDuplicate: false }),
      })
      // Mock for bulk-upload for dropped-file.jpg
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, publicUrl: 'http://example.com/dropped-file.jpg' }),
      });

    render(
      <UnifiedMediaInput
        identifier="test-dnd-upload"
        onMediaAdded={mockOnMediaAdded}
        onVideoUrlSubmit={mockOnVideoUrlSubmit}
        folder="dnd-folder"
      />
    );

    const dropZone = screen.getByText(/Browse Media Library/i).closest('div.border-dashed'); 
    expect(dropZone).toBeInTheDocument();

    const file = new File(['dnd-content'], 'dropped-file.jpg', { type: 'image/jpeg' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, { dataTransfer });
    await waitFor(() => {
      // Check for UI change, e.g., text "Drop files to upload"
      expect(screen.getByText(/Drop files to upload/i)).toBeInTheDocument();
    });
    
    // Simulate drag over (needed for drop to work)
    fireEvent.dragOver(dropZone!, { dataTransfer });

    // Simulate drop
    fireEvent.drop(dropZone!, { dataTransfer });

    await waitFor(() => {
      expect(mockOnMediaAdded).toHaveBeenCalledTimes(1);
    });
    expect(mockOnMediaAdded).toHaveBeenCalledWith(['http://example.com/dropped-file.jpg']);
    
    // Check UI reverts
    await waitFor(() => {
      expect(screen.queryByText(/Drop files to upload/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Browse Media Library/i)).toBeInTheDocument();
    });

    // Verify fetch calls
    expect(fetch).toHaveBeenCalledTimes(2); // 1 for duplicate check, 1 for upload
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/check-media-duplicate', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ fileHash: expect.any(String), filename: 'dropped-file.jpg', folder: 'dnd-folder' })
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/bulk-upload', expect.any(Object));
  });
});
