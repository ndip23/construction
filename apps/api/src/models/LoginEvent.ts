import mongoose, { Schema } from 'mongoose';

/**
 * One row per authentication attempt (manager login + worker PIN login),
 * success or failure. Powers the superadmin login/session monitor so the
 * platform owner can spot brute-force attempts, unusual IPs, etc.
 */
const LoginEventSchema = new Schema({
  identifier: { type: String },                 // email (manager) or phone (worker)
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  company: { type: Schema.Types.ObjectId, ref: 'Company' },
  role: { type: String },                       // owner|admin|staff|superadmin|worker
  kind: { type: String, enum: ['manager', 'worker'], default: 'manager' },
  success: { type: Boolean, default: false },
  reason: { type: String },                     // why it failed (for failures)
  ip: { type: String },
  userAgent: { type: String },
}, { timestamps: true });

LoginEventSchema.index({ createdAt: -1 });
LoginEventSchema.index({ success: 1 });

export default mongoose.model('LoginEvent', LoginEventSchema);
