import { z } from 'zod';

export function makeValidator(schema) {
  return (req, res, next) => {
    const data = { body: req.body, params: req.params, query: req.query };
    const result = schema.safeParse(data);
    if (!result.success) {
      return res.status(422).json({ errors: result.error.issues.map(i => ({ path: i.path, message: i.message })) });
    }
    Object.assign(req, result.data); // normalized
    next();
  };
}

export const schemas = {
  register: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1)
    })
  }),
  createSubject: z.object({
    body: z.object({ name: z.string().min(1), code: z.string().min(1).transform(c=>c.toUpperCase()), description: z.string().optional() })
  }),
  createGrade: z.object({ body: z.object({ level: z.string().min(1), description: z.string().optional() }) }),
  createClass: z.object({ body: z.object({ name: z.string(), grade: z.string(), subject: z.string(), teacher: z.string() }) }),
  enroll: z.object({ body: z.object({ classId: z.string(), studentId: z.string() }) }),
  parentLink: z.object({ body: z.object({ parentId: z.string(), studentId: z.string() }) }),
  attendance: z.object({ body: z.object({ sessionId: z.string(), entries: z.array(z.object({ student: z.string(), status: z.enum(['present','absent','late']) })) }) }),
};