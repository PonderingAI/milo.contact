// components/admin/dashboard/widgets/project-stats-widget.test.tsx
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ProjectStatsWidget } from './project-stats-widget'
import '@testing-library/jest-dom'

// Mock fetch for testing
global.fetch = jest.fn()

describe('ProjectStatsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    // Mock fetch to return a promise that never resolves
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<ProjectStatsWidget />)
    
    expect(screen.getByText('Loading project stats...')).toBeInTheDocument()
  })

  it('renders project statistics when data is loaded', async () => {
    const mockProjectData = {
      success: true,
      data: [
        {
          id: '1',
          title: 'Test Project 1',
          category: 'Short Film',
          role: 'Director',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Test Project 2',
          category: 'Documentary',
          role: 'Camera',
          created_at: new Date().toISOString()
        }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjectData
    })

    render(<ProjectStatsWidget />)

    await waitFor(() => {
      expect(screen.getAllByText('2')[0]).toBeInTheDocument() // Get the first occurrence (main number)
      expect(screen.getByText('Total projects')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<ProjectStatsWidget />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load project stats')).toBeInTheDocument()
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('displays empty state when no projects exist', async () => {
    const mockEmptyData = {
      success: true,
      data: []
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEmptyData
    })

    render(<ProjectStatsWidget />)

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('Total projects')).toBeInTheDocument()
    })
  })

  it('displays project statistics correctly', async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 15) // Recent project

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 45) // Old project

    const mockProjectData = {
      success: true,
      data: [
        {
          id: '1',
          title: 'Recent Project',
          category: 'Short Film',
          role: 'Director',
          created_at: thirtyDaysAgo.toISOString()
        },
        {
          id: '2',
          title: 'Old Project',
          category: 'Short Film',
          role: 'Director',
          created_at: oldDate.toISOString()
        },
        {
          id: '3',
          title: 'Documentary',
          category: 'Documentary',
          role: 'Camera',
          created_at: oldDate.toISOString()
        }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjectData
    })

    render(<ProjectStatsWidget />)

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Total projects')).toBeInTheDocument()
      expect(screen.getByText('Recent (30 days):')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Top category:')).toBeInTheDocument()
      expect(screen.getByText('Short Film (2)')).toBeInTheDocument()
    })
  })

  it('uses custom title when provided', async () => {
    const mockProjectData = {
      success: true,
      data: []
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjectData
    })

    render(<ProjectStatsWidget title="Custom Project Stats" />)
    
    await waitFor(() => {
      expect(screen.getByText('Custom Project Stats')).toBeInTheDocument()
    })
  })
})