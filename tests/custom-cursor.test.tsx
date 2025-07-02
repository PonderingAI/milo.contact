import { render, screen } from '@testing-library/react'
import CustomCursor from '../components/custom-cursor'
import * as useTouchDevice from '../hooks/use-touch-device'

// Mock the touch device hook
jest.mock('../hooks/use-touch-device')
const mockUseTouchDevice = useTouchDevice.useTouchDevice as jest.MockedFunction<typeof useTouchDevice.useTouchDevice>

describe('CustomCursor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render on touch devices', () => {
    mockUseTouchDevice.mockReturnValue(true)
    
    const { container } = render(<CustomCursor />)
    
    expect(container.firstChild).toBeNull()
  })

  it('should render on non-touch devices', () => {
    mockUseTouchDevice.mockReturnValue(false)
    
    const { container } = render(<CustomCursor />)
    
    // Should render the cursor container
    expect(container.querySelector('.cursor-container')).toBeInTheDocument()
  })
})