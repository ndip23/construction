import mongoose, { Schema } from 'mongoose';

const PayslipSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  periodFrom: { type: Date },
  periodTo: { type: Date },
  hoursWorked: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  payType: { type: String }, // 'hourly' | 'daily' | 'monthly'
  payRate: { type: Number },
  gross: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deduction: { type: Number, default: 0 },
  net: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date }
}, { timestamps: true });

PayslipSchema.index({ company: 1, worker: 1, periodFrom: 1, periodTo: 1 });

export default mongoose.model('Payslip', PayslipSchema);
