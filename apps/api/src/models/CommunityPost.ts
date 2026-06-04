import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityPost extends Document {
  title: string;
  description: string;
  location: string;
  category: string;
  budget?: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  author: mongoose.Types.ObjectId;
  images: string[];
  upvotes: number;
  views: number;
  status: 'Open' | 'Solved';
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true },
  budget: { type: String },
  urgency: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  status: { type: String, enum: ['Open', 'Solved'], default: 'Open' },
}, { timestamps: true });

export default mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
