import '../config/env.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import argon2 from 'argon2';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const adminEmail = 'admin@center.test';
  if (!await User.findOne({ email: adminEmail })) {
    const passwordHash = await argon2.hash('AdminPass123!');
    await User.create({ firstName:'System', lastName:'Admin', email: adminEmail, passwordHash, role:'admin' });
    console.log('Admin user created: admin@center.test / AdminPass123!');
  } else {
    console.log('Admin user already exists');
  }
  await mongoose.disconnect();
}
run().then(()=>process.exit(0));
