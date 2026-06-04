import mongoose, { Schema, Document } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'owner', 'staff'], default: 'owner' },
  company: { type: Schema.Types.ObjectId, ref: 'Company' }, // Link to their business
  
  // Community & Reputation features
  reputationScore: { type: Number, default: 0 },
  communityRole: { 
    type: String, 
    enum: ['New Member', 'Contributor', 'Expert', 'Verified Professional'], 
    default: 'New Member' 
  },
  isVerifiedExpert: { type: Boolean, default: false },
  expertTypes: [{ type: String }] // e.g., 'Licensed Engineer', 'Certified Contractor'
}, { timestamps: true });

export default mongoose.model('User', UserSchema);