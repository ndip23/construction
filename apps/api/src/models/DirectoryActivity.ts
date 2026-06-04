import mongoose, { Schema, Document } from 'mongoose';

export interface IDirectoryActivity extends Document {
  action: 'impression' | 'whatsapp_click';
  companyId: mongoose.Types.ObjectId;
  metadata?: any;
  createdAt: Date;
}

const DirectoryActivitySchema = new Schema({
  action: { 
    type: String, 
    enum: ['impression', 'whatsapp_click', 'click'],
    required: true 
  },
  companyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Company',
    required: true
  },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model<IDirectoryActivity>('DirectoryActivity', DirectoryActivitySchema);
