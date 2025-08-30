import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true },
  userAgent: String,
  ip: String,
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: Date,
  replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'RefreshToken' }
}, { timestamps: true });

refreshTokenSchema.index({ user:1, createdAt:-1 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);