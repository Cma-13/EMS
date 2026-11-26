import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from './components/PageLoader';
import Login from './pages/Login';
import PrivateRoutes from './utils/PrivateRoutes';
import RoleBaseRoutes from './utils/RoleBaseRoutes';
import { AlertHost } from './components/AlertPopup';

// Pages load only when opened (smaller first download)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const AdminSummary = lazy(() => import('./components/dashboard/AdminSummary'));
const DepartmentList = lazy(() => import('./components/department/DepartmentList'));
const AddDepartment = lazy(() => import('./components/department/AddDepartment'));
const EditDepartment = lazy(() => import('./components/department/EditDepartment'));
const List = lazy(() => import('./components/employee/List'));
const Add = lazy(() => import('./components/employee/Add'));
const View = lazy(() => import('./components/employee/View'));
const Edit = lazy(() => import('./components/employee/Edit'));
const AddSalary = lazy(() => import('./components/salary/Add'));
const ViewSalary = lazy(() => import('./components/salary/View'));
const Summary = lazy(() => import('./components/EmployeeDashboard/Summary'));
const LeaveList = lazy(() => import('./components/leave/List'));
const AddLeave = lazy(() => import('./components/leave/Add'));
const Setting = lazy(() => import('./components/EmployeeDashboard/Setting'));
const Table = lazy(() => import('./components/leave/Table'));
const Detail = lazy(() => import('./components/leave/Detail'));
const RegisterFace = lazy(() => import('./components/attendance/RegisterFace'));
const AttendanceAdmin = lazy(() => import('./components/attendance/AttendanceAdmin'));
const AttendanceEmployee = lazy(() => import('./components/attendance/AttendanceEmployee'));
const HolidayManager = lazy(() => import('./components/attendance/HolidayManager'));
const ForcePasswordChange = lazy(() => import('./pages/ForcePasswordChange'));
const EmailSettings = lazy(() => import('./components/dashboard/EmailSettings'));
const SalaryBreakdown = lazy(() => import('./components/dashboard/SalaryBreakdown'));
const LeaveBalanceAdmin = lazy(() => import('./components/leave/LeaveBalanceAdmin'));
const NotificationsPage = lazy(() => import('./components/notifications/NotificationsPage'));

function App() {
  return (
    <BrowserRouter>
      <AlertHost />
      <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        {/* ── Public routes — no login needed ── */}
        <Route path='/login' element={<Login />} />
        <Route path='/attendance' element={<AttendancePage />} />
        <Route path='/unauthorized' element={<Unauthorized />} />
        <Route path='/change-password' element={<ForcePasswordChange />} />
        <Route path='/' element={<Navigate to="/login" replace />} />

        {/* ── Admin Dashboard ── */}
        <Route path='/admin-dashboard' element={
          <PrivateRoutes><RoleBaseRoutes requiredRole={['admin']}><AdminDashboard /></RoleBaseRoutes></PrivateRoutes>
        }>
          <Route index element={<AdminSummary />} />
          <Route path="departments" element={<DepartmentList />} />
          <Route path="add-department" element={<AddDepartment />} />
          <Route path="department/:id" element={<EditDepartment />} />
          <Route path="employees" element={<List />} />
          <Route path="add-employee" element={<Add />} />
          <Route path="employees/:id" element={<View />} />
          <Route path="employees/edit/:id" element={<Edit />} />
          <Route path="employees/salary/:id" element={<ViewSalary />} />
          <Route path="salary/add" element={<AddSalary />} />
          <Route path="leaves" element={<Table />} />
          <Route path="leaves/:id" element={<Detail />} />
          <Route path="employees/leaves/:id" element={<LeaveList />} />
          <Route path="setting" element={<Setting />} />
          <Route path="attendance" element={<AttendanceAdmin />} />
          <Route path="attendance/register-face" element={<RegisterFace />} />
          <Route path="holidays" element={<HolidayManager />} />
          <Route path="email-settings" element={<EmailSettings />} />
          <Route path="salary-breakdown" element={<SalaryBreakdown />} />
          <Route path="leave-balances" element={<LeaveBalanceAdmin />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* ── Employee Dashboard ── */}
        <Route path='/employee-dashboard' element={
          <PrivateRoutes><RoleBaseRoutes requiredRole={['admin','employee']}><EmployeeDashboard /></RoleBaseRoutes></PrivateRoutes>
        }>
          <Route index element={<Summary />} />
          <Route path="profile/:id" element={<View />} />
          <Route path="leaves/:id" element={<LeaveList />} />
          <Route path="add-leave" element={<AddLeave />} />
          <Route path="salary/:id" element={<ViewSalary />} />
          <Route path="setting" element={<Setting />} />
          <Route path="attendance" element={<AttendanceEmployee />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path='*' element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
export default App;
