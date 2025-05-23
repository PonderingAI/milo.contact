"use client"

import dynamic from 'next/dynamic'
import type React from 'react'

// Dynamically import the CustomCursor component with SSR disabled
const DynamicCustomCursor = dynamic(() => import('@/components/custom-cursor'), {
  ssr: false,
})

const CustomCursorLoader: React.FC = () => {
  return <DynamicCustomCursor />
}

export default CustomCursorLoader
