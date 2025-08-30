import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  weight: { type: Number, default: 1 }
}, { timestamps: true });

export const Exam = mongoose.model('Exam', examSchema);
