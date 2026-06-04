import mongoose, { Schema, Document } from 'mongoose';

export interface IReceiptItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface IReceipt extends Document {
  receiptNumber: string;
  company: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: IReceiptItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
  qrCodeData?: string;
  barcodeData?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema: Schema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true }
});

const ReceiptSchema: Schema = new Schema({
  receiptNumber: { type: String, required: true, unique: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project' },
  client: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String
  },
  items: [ReceiptItemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft', 'pending', 'paid', 'cancelled'], default: 'draft' },
  paymentMethod: String,
  qrCodeData: String,
  barcodeData: String,
  notes: String
}, {
  timestamps: true
});

export default mongoose.model<IReceipt>('Receipt', ReceiptSchema);
