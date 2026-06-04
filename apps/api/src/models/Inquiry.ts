import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  clientName: string;
  email?: string;
  phone?: string;
  message: string;
  location?: string;
  status: 'New' | 'Contacted' | 'Closed';
  companyId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const InquirySchema = new Schema({
  clientName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  message: { type: String, required: true },
  location: { type: String },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Closed'],
    default: 'New'
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IInquiry>('Inquiry', InquirySchema);
