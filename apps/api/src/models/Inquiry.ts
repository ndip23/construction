import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  company: mongoose.Types.ObjectId;
  clientName: string;
  clientPhone: string;
  message: string;
  source: 'public_profile' | 'public_directory';
  status: 'new' | 'contacted' | 'closed';
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiry>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    clientPhone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: ['public_profile', 'public_directory'],
      default: 'public_profile',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
      index: true,
    },
    lastContactedAt: { type: Date },
  },
  { timestamps: true }
);

InquirySchema.index({ company: 1, createdAt: -1 });

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);
