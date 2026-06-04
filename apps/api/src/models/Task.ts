import mongoose, { Schema, Document } from 'mongoose';

export type TaskPhase =
  | 'Foundation'
  | 'Structure'
  | 'Roofing'
  | 'Electrical'
  | 'Plumbing'
  | 'Finishing'
  | 'Other';

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked';

export interface ITask extends Document {
  company: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  title: string;
  phase: TaskPhase;
  assignedWorkers: mongoose.Types.ObjectId[];
  deadline?: Date;
  costEstimate: number;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    phase: {
      type: String,
      enum: ['Foundation', 'Structure', 'Roofing', 'Electrical', 'Plumbing', 'Finishing', 'Other'],
      default: 'Other',
    },
    assignedWorkers: [{ type: Schema.Types.ObjectId, ref: 'Worker' }],
    deadline: { type: Date },
    costEstimate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done', 'blocked'],
      default: 'todo',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', TaskSchema);
