import dynamic from 'next/dynamic'
import React from 'react'
import { Loader2 } from 'lucide-react'

const DiffViewer = dynamic(
  () => import('./DiffViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading DiffViewer...</p>
        </div>
      </div>
    )
  }
)

const DynamicDiffViewer = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">GitHub Diff Viewer</h1>
            <DiffViewer />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicDiffViewer