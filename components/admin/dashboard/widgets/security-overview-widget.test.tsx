// components/admin/dashboard/widgets/security-overview-widget.test.tsx
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SecurityOverviewWidget } from './security-overview-widget'
import '@testing-library/jest-dom'

// Mock fetch for testing
global.fetch = jest.fn()

describe('SecurityOverviewWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<SecurityOverviewWidget />)
    
    expect(screen.getByText('Scanning security...')).toBeInTheDocument()
  })

  it('renders security overview with good score', async () => {
    const mockDependencyData = {
      dependencies: [
        { hasSecurityIssue: false, hasDependabotAlert: false, outdated: false },
        { hasSecurityIssue: false, hasDependabotAlert: false, outdated: true },
        { hasSecurityIssue: false, hasDependabotAlert: false, outdated: false }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDependencyData
    })

    render(<SecurityOverviewWidget />)

    await waitFor(() => {
      expect(screen.getByText(/\d+%/)).toBeInTheDocument() // Any percentage score
      expect(screen.getAllByText('0')[0]).toBeInTheDocument() // Vulnerabilities (get first occurrence)
      expect(screen.getByText('All Clear')).toBeInTheDocument()
    })
  })

  it('renders security overview with issues', async () => {
    const mockDependencyData = {
      dependencies: [
        { hasSecurityIssue: true, hasDependabotAlert: false, outdated: false },
        { hasSecurityIssue: false, hasDependabotAlert: true, outdated: false },
        { hasSecurityIssue: false, hasDependabotAlert: false, outdated: true }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDependencyData
    })

    render(<SecurityOverviewWidget />)

    await waitFor(() => {
      expect(screen.getByText(/\d+%/)).toBeInTheDocument() // Any percentage score
      expect(screen.getAllByText('1')[0]).toBeInTheDocument() // Vulnerabilities (get first occurrence)
      expect(screen.getByText('View Security Details')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully with fallback data', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<SecurityOverviewWidget />)

    await waitFor(() => {
      expect(screen.getByText('92%')).toBeInTheDocument() // Fallback score
      expect(screen.getByText('All Clear')).toBeInTheDocument()
    })
  })

  it('shows view details button when there are security issues', async () => {
    const mockDependencyData = {
      dependencies: [
        { hasSecurityIssue: true, hasDependabotAlert: false, outdated: false }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDependencyData
    })

    render(<SecurityOverviewWidget />)

    await waitFor(() => {
      const viewDetailsButton = screen.getByText('View Security Details')
      expect(viewDetailsButton).toBeInTheDocument()
      expect(viewDetailsButton).toHaveAttribute('class', expect.stringContaining('w-full'))
    })
  })

  it('displays custom title when provided', async () => {
    const mockDependencyData = { dependencies: [] }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDependencyData
    })

    render(<SecurityOverviewWidget title="Custom Security" />)

    await waitFor(() => {
      expect(screen.getByText('Custom Security')).toBeInTheDocument()
    })
  })

  it('does not show actions when showActions is false', async () => {
    const mockDependencyData = {
      dependencies: [
        { hasSecurityIssue: true, hasDependabotAlert: false, outdated: false }
      ]
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDependencyData
    })

    render(<SecurityOverviewWidget showActions={false} />)

    await waitFor(() => {
      expect(screen.queryByText('View Security Details')).not.toBeInTheDocument()
    })
  })

  it('falls back to mock data when API fails', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    render(<SecurityOverviewWidget />)

    await waitFor(() => {
      // Should show fallback mock data
      expect(screen.getByText(/\d+%/)).toBeInTheDocument()
      expect(screen.getByText('Security Overview')).toBeInTheDocument()
    })
  })
})