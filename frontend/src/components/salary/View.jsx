import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/authContext'
import { FaMoneyBillWave } from 'react-icons/fa'
import { API_BASE } from '../../utils/apiConfig'
import Pagination from '../Pagination'
import { usePagination } from '../../utils/usePagination'

const rs = (n) => `Rs.${(n || 0).toLocaleString()}`

const View = () => {
    const [salaries, setSalaries] = useState(null)
    const [year, setYear]         = useState('all')
    const { id }   = useParams()
    const { user } = useAuth()

    useEffect(() => {
        axios.get(`${API_BASE}/api/salary/${id}/${user.role}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => { if (r.data.success) setSalaries(r.data.salary) })
          .catch(console.error)
    }, [])

    // Newest first, optionally one year
    const years  = useMemo(() => [...new Set((salaries || []).map(s => new Date(s.payDate).getFullYear()))].sort((a, b) => b - a), [salaries])
    const shown  = useMemo(() => (salaries || [])
        .filter(s => year === 'all' || new Date(s.payDate).getFullYear() === Number(year))
        .sort((a, b) => new Date(b.payDate) - new Date(a.payDate)), [salaries, year])
    const { page, setPage, pages, total, pageItems, offset, pageSize } = usePagination(shown, 12, year)
    const totalNet = shown.reduce((sum, s) => sum + (s.netSalary || 0), 0)

    if (!salaries) return (
        <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
    )

    // What made up the deduction (salaries saved before the breakdown existed show only the total)
    const breakdown = (s) => [
        s.otherDeductions > 0 && `Other ${rs(s.otherDeductions)}`,
        s.leaveDeduction  > 0 && `Unpaid leave ${rs(s.leaveDeduction)}`,
        s.absentDeduction > 0 && `Absent ${s.absentDays}d ${rs(s.absentDeduction)}`,
    ].filter(Boolean).join(' · ')

    return (
        <div className="p-6 bg-stone-50 min-h-full">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                        <FaMoneyBillWave className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-stone-800">Salary Records</h2>
                        <p className="text-stone-500 text-sm">
                            {shown.length} payroll record{shown.length !== 1 ? 's' : ''}
                            {shown.length > 0 && <> · total paid <b className="text-teal-700">{rs(totalNet)}</b></>}
                        </p>
                    </div>
                </div>
                {years.length > 1 && (
                    <select value={year} onChange={e => setYear(e.target.value)}
                        className="px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                        <option value="all">All years</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {shown.length === 0 ? (
                    <div className="text-center py-16 text-stone-400">
                        <FaMoneyBillWave className="text-4xl mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No salary records found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-stone-50 border-b border-stone-100 text-stone-500">
                                    <tr>
                                        <th className="px-5 py-3">#</th>
                                        <th className="px-5 py-3">Employee ID</th>
                                        <th className="px-5 py-3">Basic Salary</th>
                                        <th className="px-5 py-3">Allowances</th>
                                        <th className="px-5 py-3">Deductions</th>
                                        <th className="px-5 py-3">Net Salary</th>
                                        <th className="px-5 py-3">Pay Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {pageItems.map((s, i) => (
                                        <tr key={s._id} className="hover:bg-stone-50 transition">
                                            <td className="px-5 py-3 text-stone-400">{offset + i + 1}</td>
                                            <td className="px-5 py-3 font-medium text-stone-700">{s.employeeId?.employeeId}</td>
                                            <td className="px-5 py-3 text-stone-600">{rs(s.basicSalary)}</td>
                                            <td className="px-5 py-3 text-emerald-600">+{rs(s.allowances)}</td>
                                            <td className="px-5 py-3">
                                                <span className="text-red-500">-{rs(s.deductions)}</span>
                                                {breakdown(s) && <p className="text-[11px] text-stone-400 mt-0.5">{breakdown(s)}</p>}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-bold text-teal-700 text-base">{rs(s.netSalary)}</span>
                                            </td>
                                            <td className="px-5 py-3 text-stone-500">{new Date(s.payDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} pages={pages} total={total} pageSize={pageSize} onChange={setPage} label="records" />
                    </>
                )}
            </div>
        </div>
    )
}
export default View
