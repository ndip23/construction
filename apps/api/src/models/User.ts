import mongoose, { Schema, Document } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'owner', 'staff'], default: 'owner' },
  company: { type: Schema.Types.ObjectId, ref: 'Company' }, // Link to their business
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);