const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  date: { type: Date, default: Date.now },
  clockIn: Date,
  clockOut: Date,
  note: String
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
