import mongoose, { Schema } from 'mongoose';

const WorkerSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true }, // e.g., 'Foreman', 'Welder'
  status: { type: String, enum: ['Active', 'On Leave', 'Terminated'], default: 'Active' },
  skills: [String],
  rating: { type: Number, default: 5 },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  assignedProject: { type: Schema.Types.ObjectId, ref: 'Project' },
  // ── Contact + pay (Workforce module) ──────────────────────────────────────
  phone: { type: String },
  email: { type: String },
  payType: { type: String, enum: ['hourly', 'daily', 'monthly'], default: 'daily' },
  payRate: { type: Number, default: 0 },
  // ── Worker portal auth ────────────────────────────────────────────────────
  pin: { type: String, select: false }, // bcrypt-hashed PIN for worker portal login
  portalEnabled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Worker', WorkerSchema);