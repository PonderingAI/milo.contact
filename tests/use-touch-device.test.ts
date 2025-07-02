import { renderHook } from '@testing-library/react'
import { useTouchDevice } from '../hooks/use-touch-device'

// Mock window and navigator for testing
describe('useTouchDevice', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  it('should return boolean value', () => {
    const { result } = renderHook(() => useTouchDevice())
    
    expect(typeof result.current).toBe('boolean')
  })
})