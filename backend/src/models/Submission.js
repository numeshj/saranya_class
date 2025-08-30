import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  homework: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt: { type: Date, default: Date.now },
  content: String,
  grade: Number,
  feedback: String
}, { timestamps: true });

submissionSchema.index({ homework:1, student:1 }, { unique: true });

export const Submission = mongoose.model('Submission', submissionSchema);
