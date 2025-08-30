import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: Date
}, { timestamps: true });

export const Homework = mongoose.model('Homework', homeworkSchema);
