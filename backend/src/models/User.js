import mongoose from 'mongoose';

const roles = ['guest','student','parent','teacher','management','admin'];

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: roles, default: 'guest', index: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for students linking parent user
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // for parents
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  passwordChangedAt: Date,
  refreshTokenVersion: { type: Number, default: 0 },
  twoFactorSecret: { type: String },
}, { timestamps: true });

userSchema.methods.toSafeObject = function() {
  const { passwordHash, __v, refreshTokenVersion, ...rest } = this.toObject();
  return rest;
};

export const User = mongoose.model('User', userSchema);
export const USER_ROLES = roles;
