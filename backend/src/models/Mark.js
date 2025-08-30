import mongoose from 'mongoose';

const markSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  feedback: String
}, { timestamps: true });

markSchema.index({ exam:1, student:1 }, { unique: true });

export const Mark = mongoose.model('Mark', markSchema);
