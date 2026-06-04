import mongoose, { Schema } from 'mongoose';

const AttendanceSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  date: { type: String }, // YYYY-MM-DD
  clockIn: { type: Date },
  clockOut: { type: Date },
  hours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  note: { type: String }
}, { timestamps: true });

AttendanceSchema.index({ company: 1, worker: 1, date: 1 });

export default mongoose.model('Attendance', AttendanceSchema);
