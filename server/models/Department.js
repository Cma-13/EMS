import mongoose from "mongoose";
import Employee from "./Employee.js";
import Leave from "./Leave.js";
import Salary from "./Salary.js";
import User from "./User.js";
import Attendance from "./Attendance.js";
import LeaveBalance from "./LeaveBalance.js";
import Notification from "./Notification.js";

const departmentSchema = new mongoose.Schema({
    dep_name:{
        type:String,required:true},
    description:{
        type:String},
        createdAt: {type:Date,default:Date.now},
        updatedAt: {type:Date,default:Date.now}
})

departmentSchema.pre("deleteOne", { document: true, query: false }, async function () {
  try {
      console.log("Deleting Department:", this._id);
      const employees = await Employee.find({ department: this._id });
      const empIds   = employees.map(emp => emp._id);
      const userIds  = employees.map(emp => emp.userId);
      const empCodes = employees.map(emp => emp.employeeId);

      await Employee.deleteMany({ department: this._id });
      await Leave.deleteMany({ employeeId: { $in: empIds } });
      await Salary.deleteMany({ employeeId: { $in: empIds } });
      // Previously missing: these employees' logins, attendance, balances,
      // notifications and face data were left behind ("ghost" accounts
      // that could still log in but had no employee record).
      await Attendance.deleteMany({ employeeId: { $in: empIds } });
      await LeaveBalance.deleteMany({ employeeId: { $in: empIds } });
      await Notification.deleteMany({ forUserId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds }, role: { $ne: "admin" } });
      await mongoose.connection.collection("face_embeddings").deleteMany({ employeeId: { $in: empCodes } });

 
  } catch (error) {
      console.error("Error in deleteOne middleware:", error);
      throw error; 
  }
});


const Department = mongoose.model("Department",departmentSchema);
export default Department;