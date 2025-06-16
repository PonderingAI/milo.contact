/**
 * Test project sorting by release date
 */

import { mockProjects } from '../lib/mock-data'

describe('Project Sorting by Release Date', () => {
  // Mock project data with different project_date values
  const mockProjectsWithDates = [
    {
      id: '1',
      title: 'Project 1',
      project_date: '2024-01-15',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2', 
      title: 'Project 2',
      project_date: '2024-02-15',
      created_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      title: 'Project 3',
      project_date: '2024-03-15',
      created_at: '2024-01-03T00:00:00Z'
    },
    {
      id: '4',
      title: 'Project 4',
      project_date: null,
      created_at: '2024-01-04T00:00:00Z'
    }
  ]

  test('should sort projects by project_date with newest first', () => {
    // Sort projects by project_date (newest first), with null dates at the end
    const sorted = mockProjectsWithDates.sort((a, b) => {
      // Handle null project_date cases - null dates should fall back to created_at
      const aDate = a.project_date || a.created_at.split('T')[0]
      const bDate = b.project_date || b.created_at.split('T')[0]
      
      return new Date(bDate) - new Date(aDate)
    })

    expect(sorted[0].id).toBe('3') // 2024-03-15
    expect(sorted[1].id).toBe('2') // 2024-02-15  
    expect(sorted[2].id).toBe('1') // 2024-01-15
    expect(sorted[3].id).toBe('4') // null project_date, falls back to created_at
  })

  test('should handle null project_date by falling back to created_at', () => {
    const projectWithNullDate = {
      id: '5',
      title: 'Project 5',
      project_date: null,
      created_at: '2024-06-01T00:00:00Z'
    }

    const projects = [...mockProjectsWithDates, projectWithNullDate]
    
    const sorted = projects.sort((a, b) => {
      const aDate = a.project_date || a.created_at.split('T')[0]
      const bDate = b.project_date || b.created_at.split('T')[0]
      
      return new Date(bDate) - new Date(aDate)
    })

    // Project 5 should be first because its created_at date (2024-06-01) is newer than all project_dates
    expect(sorted[0].id).toBe('5')
  })

  test('should verify Supabase query ordering logic', () => {
    // Simulate the Supabase ordering behavior:
    // 1. First order by project_date DESC NULLS LAST
    // 2. Then order by created_at DESC
    const projects = [
      { id: 'a', project_date: '2024-02-01', created_at: '2024-01-01T00:00:00Z' },
      { id: 'b', project_date: '2024-02-01', created_at: '2024-01-02T00:00:00Z' }, // same project_date, different created_at
      { id: 'c', project_date: null, created_at: '2024-01-05T00:00:00Z' },
      { id: 'd', project_date: null, created_at: '2024-01-03T00:00:00Z' },
      { id: 'e', project_date: '2024-03-01', created_at: '2024-01-04T00:00:00Z' }
    ]

    const sorted = projects.sort((a, b) => {
      // Primary sort: project_date DESC (nulls last)
      if (a.project_date && b.project_date) {
        const dateComparison = new Date(b.project_date) - new Date(a.project_date)
        if (dateComparison !== 0) return dateComparison
        
        // Secondary sort: created_at DESC when project_date is the same
        return new Date(b.created_at) - new Date(a.created_at)
      }
      
      // Non-null project_date comes before null
      if (a.project_date && !b.project_date) return -1
      if (!a.project_date && b.project_date) return 1
      
      // Both are null, sort by created_at DESC
      return new Date(b.created_at) - new Date(a.created_at)
    })

    expect(sorted.map(p => p.id)).toEqual(['e', 'b', 'a', 'c', 'd'])
    // e: 2024-03-01 (latest project_date)
    // b: 2024-02-01, created_at 2024-01-02 (same project_date as 'a', but newer created_at)
    // a: 2024-02-01, created_at 2024-01-01
    // c: null project_date, created_at 2024-01-05 (newer created_at among nulls)
    // d: null project_date, created_at 2024-01-03
  })

  test('should verify mock data is sorted correctly by project_date', () => {
    // Create a copy to avoid modifying the original
    const projects = [...mockProjects]
    
    // Sort using the same logic as our implementation
    const sorted = projects.sort((a, b) => {
      // Primary sort: project_date DESC (nulls last)
      if (a.project_date && b.project_date) {
        const dateComparison = new Date(b.project_date) - new Date(a.project_date)
        if (dateComparison !== 0) return dateComparison
        
        // Secondary sort: created_at DESC when project_date is the same
        return new Date(b.created_at) - new Date(a.created_at)
      }
      
      // Non-null project_date comes before null
      if (a.project_date && !b.project_date) return -1
      if (!a.project_date && b.project_date) return 1
      
      // Both are null, sort by created_at DESC
      return new Date(b.created_at) - new Date(a.created_at)
    })

    // Expected order based on project_date (newest first):
    // photo-2: 2024-08-15
    // camera-1: 2024-07-10  
    // photo-1: 2024-06-30
    // directed-2: 2024-05-20
    // production-1: 2024-04-08
    // directed-1: 2024-03-15
    // production-2: 2024-02-14
    // camera-2: 2024-01-22
    // ai-1: null (falls back to created_at)
    expect(sorted[0].id).toBe('photo-2')
    expect(sorted[1].id).toBe('camera-1')
    expect(sorted[2].id).toBe('photo-1')
    expect(sorted[3].id).toBe('directed-2')
    expect(sorted[4].id).toBe('production-1')
    expect(sorted[5].id).toBe('directed-1')
    expect(sorted[6].id).toBe('production-2')
    expect(sorted[7].id).toBe('camera-2')
    expect(sorted[8].id).toBe('ai-1')
  })
})