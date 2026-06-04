import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityComment extends Document {
  post: mongoose.Types.ObjectId;
  author?: mongoose.Types.ObjectId; // Optional because AI can reply
  content: string;
  isAi: boolean;
  isAcceptedSolution: boolean;
  upvotes: number;
  images: string[];
  voiceNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityCommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  isAi: { type: Boolean, default: false },
  isAcceptedSolution: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
  images: [{ type: String }],
  voiceNote: { type: String },
}, { timestamps: true });

export default mongoose.model<ICommunityComment>('CommunityComment', CommunityCommentSchema);
