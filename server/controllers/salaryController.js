import Salary from "../models/Salary.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import { createNotification } from "./notificationController.js";
import { toKey, holidayMap, monthKeyOf, weekendDays } from "../utils/workdays.js";
import { WORK_DAYS_PER_MONTH, countableAbsents, deductionFor } from "../utils/hrRules.js";


// Everything the system deducts by itself for one pay month:
//   1. unpaid leave days (amount already worked out when the leave was approved)
//   2. Absent days from attendance, at basic / 26 per day
// Used both for the salary-form preview and when the salary is saved,
// so the two can never disagree.
const computeAutoDeductions = async (employeeId, payDate, basic) => {
    const month      = monthKeyOf(payDate);                       // 'YYYY-MM'
    const [y, m]     = month.split('-').map(Number);
    const monthStart = new Date(Date.UTC(y, m - 1, 1));
    const monthEnd   = new Date(Date.UTC(y, m, 0));

    // 1. Unpaid leave starting this month, not yet taken in a salary
    const unpaidLeaves = await Leave.find({
        employeeId,
        status: 'Approved',
        unpaidDays: { $gt: 0 },
        deductionApplied: false,
        startDate: { $gte: monthStart, $lte: monthEnd },
    });
    const leaveDeduction = unpaidLeaves.reduce((sum, l) => sum + (l.salaryDeduction || 0), 0);

    // 2. Absent days this month, not yet deducted.
    // Never deduct an "absent" day that was really a weekend, a holiday or an
    // approved leave day (older records could have been marked that way).
    const absents = await Attendance.find({
        employeeId,
        status: 'Absent',
        salaryDeducted: { $ne: true },
        date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    const holidays = await holidayMap(`${month}-01`, `${month}-31`);
    const weekends = weekendDays();
    const approvedLeaves = await Leave.find({
        employeeId, status: 'Approved',
        startDate: { $lte: monthEnd }, endDate: { $gte: monthStart },
    });
    const leaveRanges = approvedLeaves.map(l => ({ start: toKey(l.startDate), end: toKey(l.endDate) }));

    const countedAbsents  = countableAbsents(absents, { holidays, weekends, leaveRanges });
    const absentDays      = countedAbsents.length;
    const absentDeduction = deductionFor(basic, absentDays);

    return { unpaidLeaves, leaveDeduction, countedAbsents, absentDays, absentDeduction };
};

// GET /api/salary/preview/:employeeId?payDate=YYYY-MM-DD&basic=30000  (admin)
const previewDeductions = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { payDate, basic } = req.query;
        const d = await computeAutoDeductions(employeeId, payDate, basic);
        return res.status(200).json({
            success: true,
            leaveDeduction:  d.leaveDeduction,
            leaves:          d.unpaidLeaves.map(l => ({ _id: l._id, leaveType: l.leaveType, unpaidDays: l.unpaidDays, salaryDeduction: l.salaryDeduction })),
            absentDays:      d.absentDays,
            absentDates:     d.countedAbsents.map(a => a.date),
            absentDeduction: d.absentDeduction,
            dailyRate:       Math.round((Number(basic) || 0) / WORK_DAYS_PER_MONTH),
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'salary preview server error' });
    }
};

const addSalary = async (req, res) => {
    try {
        const { employeeId, basicSalary, allowances, deductions, payDate } = req.body;
        const basic  = parseInt(basicSalary)  || 0;
        const allow  = parseInt(allowances)   || 0;
        const other  = parseInt(deductions)   || 0;   // tax, advance... typed by the admin

        const { unpaidLeaves, leaveDeduction, countedAbsents, absentDays, absentDeduction } =
            await computeAutoDeductions(employeeId, payDate, basic);

        const deduct = other + leaveDeduction + absentDeduction;
        if (deduct > basic + allow) {
            return res.status(400).json({ success: false, error: 'Deductions (including unpaid leave and absent days) cannot exceed Basic Salary + Allowances.' });
        }

        const totalSalary = basic + allow - deduct;
        const newSalary = new Salary({
            employeeId, basicSalary: basic, allowances: allow, deductions: deduct, netSalary: totalSalary, payDate,
            otherDeductions: other, leaveDeduction, absentDays, absentDeduction,
        });
        await newSalary.save();

        // Mark what was used so it is never deducted twice
        if (unpaidLeaves.length) {
            await Leave.updateMany(
                { _id: { $in: unpaidLeaves.map(l => l._id) } },
                { $set: { deductionApplied: true } }
            );
        }
        if (countedAbsents.length) {
            await Attendance.updateMany(
                { _id: { $in: countedAbsents.map(a => a._id) } },
                { $set: { salaryDeducted: true } }
            );
        }

        // Find employee to get userId for notification
        const employee = await Employee.findById(employeeId).populate('userId', 'name');
        if (employee?.userId) {
            const payDateStr = payDate ? new Date(payDate).toLocaleDateString('en-NP') : 'today';
            const notes = [];
            if (leaveDeduction > 0)  notes.push(`Rs. ${leaveDeduction.toLocaleString()} for unpaid leave`);
            if (absentDeduction > 0) notes.push(`Rs. ${absentDeduction.toLocaleString()} for ${absentDays} absent day${absentDays > 1 ? 's' : ''}`);
            const deductionNote = notes.length ? ` (after deducting ${notes.join(' and ')})` : '';
            await createNotification(
                'salary_paid',
                `Your salary of Rs. ${totalSalary.toLocaleString()} has been credited for ${payDateStr}${deductionNote}.`,
                `/employee-dashboard/salary/${employee.userId._id}`,
                'employee',
                employee.userId._id
            );
        }

        return res.status(200).json({ success: true, leaveDeduction, absentDays, absentDeduction });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'salary add server error' });
    }
}

const getSalary = async (req, res) => {
    try {
        const { id } = req.params
        const role = req.user.role;  // take role from the login token, not the URL
        let salary;
        if (role === 'admin') {
            salary = await Salary.find({ employeeId: id }).populate('employeeId', 'employeeId');
        } else {
            const employee = await Employee.findOne({ userId: req.user._id });  // employees: own salary only
            if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
            salary = await Salary.find({ employeeId: employee._id }).populate('employeeId', 'employeeId');
        }
        return res.status(200).json({ success: true, salary });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'salary get server error' });
    }
}

export { addSalary, getSalary, previewDeductions };
