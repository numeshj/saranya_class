import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Subject } from '../models/Subject.js';
import { Grade } from '../models/Grade.js';
import { ClassModel } from '../models/Class.js';
import { Session } from '../models/Session.js';
import { Exam } from '../models/Exam.js';
import { Mark } from '../models/Mark.js';
import { Homework } from '../models/Homework.js';
import { Submission } from '../models/Submission.js';
import { makeValidator, schemas } from '../utils/validate.js';
import { emitEvent } from '../utils/events.js';
import { User } from '../models/User.js';

const router = Router();

// Subjects
router.post('/subjects', authenticate(['admin','management']), makeValidator(schemas.createSubject), async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json(subject);
});
router.get('/subjects', authenticate(['admin','management','teacher']), async (req,res)=>{
  res.json(await Subject.find());
});
router.put('/subjects/:id', authenticate(['admin','management']), async (req,res)=>{
  const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/subjects/:id', authenticate(['admin','management']), async (req,res)=>{
  const deleted = await Subject.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Grades
router.post('/grades', authenticate(['admin','management']), makeValidator(schemas.createGrade), async (req,res)=>{
  const grade = await Grade.create(req.body);
  res.status(201).json(grade);
});
router.get('/grades', authenticate(), async (req,res)=>{
  res.json(await Grade.find());
});
router.put('/grades/:id', authenticate(['admin','management']), async (req,res)=>{
  const updated = await Grade.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/grades/:id', authenticate(['admin','management']), async (req,res)=>{
  const deleted = await Grade.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Classes
router.post('/classes', authenticate(['admin','management']), makeValidator(schemas.createClass), async (req,res)=>{
  const cls = await ClassModel.create(req.body);
  res.status(201).json(cls);
});
router.get('/classes', authenticate(), async (req,res)=>{
  const list = await ClassModel.find().populate('grade subject teacher');
  res.json(list);
});
router.put('/classes/:id', authenticate(['admin','management']), async (req,res)=>{
  const updated = await ClassModel.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/classes/:id', authenticate(['admin','management']), async (req,res)=>{
  const deleted = await ClassModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Enrollment
router.post('/enroll', authenticate(['admin','management']), makeValidator(schemas.enroll), async (req,res)=>{
  const { classId, studentId } = req.body;
  const cls = await ClassModel.findById(classId);
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  if (!cls.students.includes(studentId)) cls.students.push(studentId);
  await cls.save();
  res.json({ message: 'Enrolled' });
});
router.post('/unenroll', authenticate(['admin','management']), makeValidator(schemas.enroll), async (req,res)=>{
  const { classId, studentId } = req.body;
  const cls = await ClassModel.findById(classId);
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  cls.students = cls.students.filter(s => s.toString() !== studentId);
  await cls.save();
  res.json({ message: 'Unenrolled' });
});

// Parent linking
router.post('/parent-link', authenticate(['admin','management']), makeValidator(schemas.parentLink), async (req,res)=>{
  const { parentId, studentId } = req.body;
  const parent = await User.findById(parentId);
  const student = await User.findById(studentId);
  if (!parent || !student) return res.status(404).json({ message: 'User not found' });
  if (parent.role !== 'parent') return res.status(400).json({ message: 'Parent user invalid role' });
  if (student.role !== 'student') return res.status(400).json({ message: 'Student user invalid role' });
  if (!parent.children.includes(student.id)) parent.children.push(student.id);
  student.parent = parent.id;
  await parent.save();
  await student.save();
  res.json({ message: 'Linked' });
});

// Sessions
router.post('/sessions', authenticate(['teacher','admin','management']), async (req,res)=>{
  const session = await Session.create(req.body);
  res.status(201).json(session);
});
router.get('/sessions/:classId', authenticate(), async (req,res)=>{
  const sessions = await Session.find({ class: req.params.classId });
  res.json(sessions);
});
router.put('/sessions/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/sessions/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const deleted = await Session.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Attendance update
router.post('/attendance', authenticate(['teacher','admin','management']), makeValidator(schemas.attendance), async (req,res)=>{
  const { sessionId, entries } = req.body;
  const session = await Session.findById(sessionId);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  const map = new Map(entries.map(e => [e.student, e.status]));
  session.attendance = session.attendance.map(a => ({ ...a.toObject(), status: map.get(a.student.toString()) || a.status }));
  // Add new entries
  entries.forEach(e => {
    if (!session.attendance.find(a => a.student.toString() === e.student)) {
      session.attendance.push({ student: e.student, status: e.status });
    }
  });
  await session.save();
  res.json({ message: 'Attendance updated' });
});

// Exams
router.post('/exams', authenticate(['teacher','admin','management']), async (req,res)=>{
  const exam = await Exam.create(req.body);
  emitEvent('exam.created', { id: exam.id, class: exam.class, title: exam.title });
  res.status(201).json(exam);
});
router.get('/exams/:classId', authenticate(), async (req,res)=>{
  res.json(await Exam.find({ class: req.params.classId }));
});
router.put('/exams/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/exams/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const deleted = await Exam.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Marks
router.post('/marks', authenticate(['teacher','admin','management']), async (req,res)=>{
  const mark = await Mark.create(req.body);
  emitEvent('mark.recorded', { id: mark.id, exam: mark.exam, student: mark.student, score: mark.score });
  res.status(201).json(mark);
});
router.get('/marks/:examId', authenticate(), async (req,res)=>{
  res.json(await Mark.find({ exam: req.params.examId }).populate('student'));
});
router.put('/marks/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const updated = await Mark.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/marks/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const deleted = await Mark.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Homework
router.post('/homework', authenticate(['teacher','admin','management']), async (req,res)=>{
  const hw = await Homework.create(req.body);
  emitEvent('homework.created', { id: hw.id, class: hw.class, title: hw.title, dueDate: hw.dueDate });
  res.status(201).json(hw);
});
router.get('/homework/:classId', authenticate(), async (req,res)=>{
  res.json(await Homework.find({ class: req.params.classId }));
});
router.put('/homework/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const updated = await Homework.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/homework/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const deleted = await Homework.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Submission
router.post('/submissions', authenticate(['student']), async (req,res)=>{
  const sub = await Submission.create({ ...req.body, student: req.user.id });
  res.status(201).json(sub);
});
router.get('/submissions/:homeworkId', authenticate(), async (req,res)=>{
  const filter = { homework: req.params.homeworkId };
  if (req.user.role === 'student') filter.student = req.user.id;
  res.json(await Submission.find(filter));
});
router.put('/submissions/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const updated = await Submission.findByIdAndUpdate(req.params.id, req.body, { new:true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
});
router.delete('/submissions/:id', authenticate(['teacher','admin','management']), async (req,res)=>{
  const deleted = await Submission.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// NOTE: Current implementation uses Mongo models. Prisma adaptation pending for MySQL mode.

export default router;
