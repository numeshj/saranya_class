import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: [{
    dayOfWeek: { type: Number, min:0, max:6 },
    startTime: String,
    endTime: String,
    location: String
  }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export const ClassModel = mongoose.model('Class', classSchema);
