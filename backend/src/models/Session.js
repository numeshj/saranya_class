import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  startTime: String,
  endTime: String,
  topic: String,
  attendance: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: { type: String, enum:['present','absent','late'], default:'present' } }]
}, { timestamps: true });

export const Session = mongoose.model('Session', sessionSchema);
