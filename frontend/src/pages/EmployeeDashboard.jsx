import React from 'react'
import Sidebar from '../components/EmployeeDashboard/Sidebar'
import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import PageLoader from '../components/PageLoader'
import NavBar from '../components/dashboard/Navbar'

const EmployeeDashboard = () => {
  return (
      <div className='flex'>
    <Sidebar/>
    <div className='flex-1 ml-64 bg-gray-100 h-screen'>
<NavBar/>
<Suspense fallback={<PageLoader />}><Outlet/></Suspense>
    </div>
   </div>
  )
}

export default EmployeeDashboard