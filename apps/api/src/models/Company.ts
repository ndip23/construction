import mongoose, { Schema, Document } from 'mongoose';
import { ensureUniqueSlug } from '../utils/companySlug';

export interface ICompany extends Document {
  name: string;
  slug: string;
  address?: string;
  city: string;
  country: string;
  website?: string;
  email?: string;
  phone?: string;
  sector?: string;
  logo?: string;
  portfolio?: string[];
  isVerified: boolean;
  status: 'pending' | 'verified' | 'rejected';
  owner: mongoose.Types.ObjectId;
  plan: 'basic' | 'pro' | 'enterprise';
<<<<<<< HEAD
  receiptSettings?: {
    letterhead?: string;
    whatsappNumber?: string;
    taxId?: string;
    defaultTaxRate?: number;
    themeColor?: string;
    signature?: string;
    defaultPaymentTerms?: string;
    format?: 'standard' | 'modern' | 'minimal';
  };
=======
  currency?: string;
  countryCode?: string;
>>>>>>> main
  walletBalance?: number;
  walletHistory?: Array<{
    type: 'credit' | 'debit';
    amount: number;
    amountUSD?: number;
    currency?: string;
    note?: string;
    transactionId?: string;
    date: Date;
  }>;
  receiptSettings?: {
    letterhead?: string;
    whatsappNumber?: string;
    taxId?: string;
    defaultTaxRate?: number;
    themeColor?: string;
    signature?: string;
    defaultPaymentTerms?: string;
    format?: 'standard' | 'modern' | 'minimal';
  };
}

const CompanySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true, lowercase: true },
  address: String,
  city: { type: String, required: true },
  country: { type: String, required: true },
  website: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  sector: { type: String, default: 'General Construction' },
  logo: { type: String, default: '' },
  portfolio: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'pro' },
  receiptSettings: {
    letterhead: String,
    whatsappNumber: String,
    taxId: String,
    defaultTaxRate: { type: Number, default: 0 },
    themeColor: { type: String, default: '#000000' },
    signature: String,
    defaultPaymentTerms: String,
    format: {
      type: String,
      enum: ['standard', 'modern', 'minimal'],
      default: 'standard'
    }
  },
  currency: { type: String, default: 'XAF' },
  countryCode: { type: String, default: 'CM' },
  walletBalance: { type: Number, default: 0 },
  walletHistory: [{
    type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
    amount: Number,
    amountUSD: Number,
    currency: String, 
    note: String,
    transactionId: String,
    date: { type: Date, default: Date.now },
  }],
  receiptSettings: {
    type: new Schema({
      letterhead: { type: String },
      whatsappNumber: { type: String },
      taxId: { type: String },
      defaultTaxRate: { type: Number },
      themeColor: { type: String },
      signature: { type: String },
      defaultPaymentTerms: { type: String },
      format: { type: String, enum: ['standard', 'modern', 'minimal'] },
    }, { _id: false }),
    default: undefined,
  },
}, { timestamps: true });

CompanySchema.pre('save', async function () {
  if (!this.slug && this.name) {
    this.slug = await ensureUniqueSlug(this.name, this._id?.toString());
  } else if (this.isModified('name') && this.name && !this.isNew) {
    this.slug = await ensureUniqueSlug(this.name, this._id?.toString());
  }
});

export default mongoose.model<ICompany>('Company', CompanySchema);