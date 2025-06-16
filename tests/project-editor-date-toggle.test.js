/**
 * Test for project editor date mismatch issue when toggling private/public
 * 
 * Issue: When a past date is selected and user toggles to private, 
 * the date gets overridden and oscillates between two different dates.
 */

describe('Project Editor Date Toggle Issue', () => {
  // Mock the handlePrivateToggle function behavior
  const mockHandlePrivateToggle = (isPrivate, currentFormData) => {
    if (isPrivate) {
      // If toggling to private, set project_date to tomorrow if not already set to a future date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const currentProjectDate = currentFormData.project_date ? new Date(currentFormData.project_date) : null
      
      return { 
        ...currentFormData, 
        is_public: false,
        project_date: (currentProjectDate && currentProjectDate > new Date()) ? currentFormData.project_date : tomorrow.toISOString().split("T")[0]
      }
    } else {
      // If toggling to public, set project_date to today and set is_public to true
      return { 
        ...currentFormData, 
        is_public: true,
        project_date: new Date().toISOString().split("T")[0]
      }
    }
  }

  test('should reproduce the date mismatch issue', () => {
    // Start with a past date
    const pastDate = '2024-01-15'
    const initialFormData = {
      title: 'Test Project',
      project_date: pastDate,
      is_public: true
    }

    // Toggle to private - should change the date to tomorrow
    const afterPrivateToggle = mockHandlePrivateToggle(true, initialFormData)
    
    // The date should now be tomorrow (not the original past date)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expectedTomorrow = tomorrow.toISOString().split("T")[0]
    
    expect(afterPrivateToggle.project_date).toBe(expectedTomorrow)
    expect(afterPrivateToggle.is_public).toBe(false)
    expect(afterPrivateToggle.project_date).not.toBe(pastDate) // Original date is lost!

    // Toggle back to public - should change the date to today
    const afterPublicToggle = mockHandlePrivateToggle(false, afterPrivateToggle)
    
    const today = new Date().toISOString().split("T")[0]
    expect(afterPublicToggle.project_date).toBe(today)
    expect(afterPublicToggle.is_public).toBe(true)
    expect(afterPublicToggle.project_date).not.toBe(pastDate) // Original date still lost!

    // Toggle back to private again - should go back to tomorrow
    const afterSecondPrivateToggle = mockHandlePrivateToggle(true, afterPublicToggle)
    expect(afterSecondPrivateToggle.project_date).toBe(expectedTomorrow)
    
    // Demonstrate the oscillation - it never returns to the original date
    expect(afterSecondPrivateToggle.project_date).not.toBe(pastDate)
  })

  test('should demonstrate expected behavior with fix', () => {
    // This test shows what the expected behavior should be with the minimal fix
    const pastDate = '2024-01-15'
    const initialFormData = {
      title: 'Test Project',
      project_date: pastDate,
      is_public: true
    }

    // Mock fixed function that preserves user's date when toggling back to public
    const fixedHandlePrivateToggle = (isPrivate, currentFormData) => {
      if (isPrivate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const currentProjectDate = currentFormData.project_date ? new Date(currentFormData.project_date) : null
        
        return { 
          ...currentFormData, 
          is_public: false,
          // Only override if date is in the past (business requirement for private projects)
          project_date: (currentProjectDate && currentProjectDate > new Date()) ? currentFormData.project_date : tomorrow.toISOString().split("T")[0]
        }
      } else {
        // When toggling back to public, preserve the current date - don't automatically change it
        return { 
          ...currentFormData, 
          is_public: true
          // No automatic date override - preserve whatever date is there
        }
      }
    }

    // Toggle to private - date should change to tomorrow (business requirement)
    const afterPrivateToggle = fixedHandlePrivateToggle(true, initialFormData)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const expectedTomorrow = tomorrow.toISOString().split("T")[0]
    
    expect(afterPrivateToggle.project_date).toBe(expectedTomorrow)
    expect(afterPrivateToggle.is_public).toBe(false)

    // Toggle back to public - should preserve the current date (tomorrow)
    const afterPublicToggle = fixedHandlePrivateToggle(false, afterPrivateToggle)
    
    expect(afterPublicToggle.project_date).toBe(expectedTomorrow) // Date preserved!
    expect(afterPublicToggle.is_public).toBe(true)

    // Toggle back to private - should keep the same date since it's already in future
    const afterSecondPrivateToggle = fixedHandlePrivateToggle(true, afterPublicToggle)
    expect(afterSecondPrivateToggle.project_date).toBe(expectedTomorrow) // Still same date
    expect(afterSecondPrivateToggle.is_public).toBe(false)

    // No more oscillation - the date remains stable
  })

  test('should handle future dates correctly', () => {
    // Test with a future date that should be preserved in all cases
    // Use a date that's definitely in the future
    const futureDateObj = new Date()
    futureDateObj.setDate(futureDateObj.getDate() + 30) // 30 days from now
    const futureDate = futureDateObj.toISOString().split("T")[0]
    
    const initialFormData = {
      title: 'Test Project',
      project_date: futureDate,
      is_public: true
    }

    const fixedHandlePrivateToggle = (isPrivate, currentFormData) => {
      if (isPrivate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const currentProjectDate = currentFormData.project_date ? new Date(currentFormData.project_date) : null
        const today = new Date()
        
        return { 
          ...currentFormData, 
          is_public: false,
          project_date: (currentProjectDate && currentProjectDate > today) ? currentFormData.project_date : tomorrow.toISOString().split("T")[0]
        }
      } else {
        return { 
          ...currentFormData, 
          is_public: true
        }
      }
    }

    // Toggle to private - future date should be preserved
    const afterPrivateToggle = fixedHandlePrivateToggle(true, initialFormData)
    expect(afterPrivateToggle.project_date).toBe(futureDate) // Future date preserved
    expect(afterPrivateToggle.is_public).toBe(false)

    // Toggle back to public - should still preserve the date
    const afterPublicToggle = fixedHandlePrivateToggle(false, afterPrivateToggle)
    expect(afterPublicToggle.project_date).toBe(futureDate) // Still preserved
    expect(afterPublicToggle.is_public).toBe(true)
  })
})