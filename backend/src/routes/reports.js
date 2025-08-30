import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { Session } from '../models/Session.js';
import { Mark } from '../models/Mark.js';
import { ClassModel } from '../models/Class.js';

const router = Router();

// Attendance percentage per student in a class
router.get('/attendance/:classId', authenticate(['teacher','management','admin']), async (req,res)=>{
  const classId = req.params.classId;
  const sessions = await Session.find({ class: classId });
  const total = sessions.length;
  const counts = {};
  sessions.forEach(s => {
    s.attendance.forEach(a => {
      counts[a.student] ||= { present:0, total:0 };
      counts[a.student].total += 1;
      if (a.status === 'present') counts[a.student].present += 1;
    });
  });
  const report = Object.entries(counts).map(([student, data]) => ({ student, percentage: total ? (data.present/total*100).toFixed(2) : '0.00' }));
  res.json({ totalSessions: total, report });
});

// Exam performance aggregate per student per class
router.get('/exam-performance/:classId', authenticate(['teacher','management','admin']), async (req,res)=>{
  const classId = req.params.classId;
  const marks = await Mark.find().populate({ path:'exam', match:{ class: classId } });
  const filtered = marks.filter(m => m.exam);
  const byStudent = {};
  filtered.forEach(m => {
    const key = m.student.toString();
    byStudent[key] ||= { totalScore:0, totalPossible:0, exams:0 };
    byStudent[key].totalScore += m.score;
    byStudent[key].totalPossible += m.exam.totalMarks;
    byStudent[key].exams += 1;
  });
  const report = Object.entries(byStudent).map(([student, r]) => ({ student, avgPercent: r.totalPossible ? (r.totalScore/r.totalPossible*100).toFixed(2) : '0.00', exams: r.exams }));
  res.json({ count: report.length, report });
});

// Class size & enrollment summary
router.get('/class-summary/:classId', authenticate(['teacher','management','admin']), async (req,res)=>{
  const cls = await ClassModel.findById(req.params.classId).populate('students');
  if (!cls) return res.status(404).json({ message: 'Class not found' });
  res.json({ class: cls.id, name: cls.name, studentCount: cls.students.length });
});

export default router;