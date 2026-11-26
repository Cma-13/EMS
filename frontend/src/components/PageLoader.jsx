import React from 'react'

// Shown for a moment while a page's code is being loaded
const PageLoader = ({ fullScreen = false }) => (
    <div className={`flex items-center justify-center ${fullScreen ? 'h-screen' : 'py-24'}`}>
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
)

export default PageLoader
