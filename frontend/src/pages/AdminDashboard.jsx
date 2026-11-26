import React from 'react'
import { useAuth } from '../context/authContext'
import AdminSidebar from '../components/dashboard/AdminSidebar'
import NavBar from '../components/dashboard/Navbar'
import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import PageLoader from '../components/PageLoader'
const AdminDashboard = () => {
  const {user} = useAuth();



  return (
   <div className='flex'>
    <AdminSidebar/>
    <div className='flex-1 ml-64 bg-gray-100 h-screen'>
<NavBar/>
<Suspense fallback={<PageLoader />}><Outlet/></Suspense>
    </div>
   </div>
  )
}

export default AdminDashboard