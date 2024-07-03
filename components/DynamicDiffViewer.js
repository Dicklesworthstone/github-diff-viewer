import dynamic from 'next/dynamic'
import React from 'react'

const DiffViewer = dynamic(
  () => import('./DiffViewer'),
  { 
    ssr: false,
    loading: () => <p>Loading DiffViewer...</p>
  }
)

const DynamicDiffViewer = () => {
  return <DiffViewer />
}

export default DynamicDiffViewer