import mongoose, { Schema } from 'mongoose';

/**
 * Immutable trail of privileged platform actions (who did what, to whom, when).
 * Written by the superadmin controller on every verify/suspend/role-change/
 * wallet-adjustment so the platform owner can monitor and audit activity.
 */
const AuditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorName: { type: String },          // denormalized for fast display
  action: { type: String, required: true }, // e.g. 'company.suspend', 'user.role.change'
  targetType: { type: String },         // 'Company' | 'User' | 'Settings' | ...
  targetId: { type: String },
  targetLabel: { type: String },        // human label (company/user name)
  metadata: { type: Schema.Types.Mixed }, // before/after, amounts, reason, etc.
  ip: { type: String },
}, { timestamps: true });

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });

export default mongoose.model('AuditLog', AuditLogSchema);
