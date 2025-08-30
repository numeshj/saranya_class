import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  level: { type: String, required: true },
  description: String
}, { timestamps: true });

export const Grade = mongoose.model('Grade', gradeSchema);
