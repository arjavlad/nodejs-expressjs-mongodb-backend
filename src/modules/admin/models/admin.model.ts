import { Schema, model, Document, Types } from 'mongoose';
import crypto from 'crypto';

import { jwtExpirationInterval } from '../../../config/vars';

import { PasswordUtil } from '../../../utils/password.util';

const adminSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export interface AdminDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createRefreshToken(): string;
  invalidateRefreshToken(): void;
}

// Instance methods
adminSchema.methods = {
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return PasswordUtil.compare(candidatePassword, this['password']);
  },

  createRefreshToken(): string {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    this['refreshToken'] = crypto.createHash('sha256').update(refreshToken).digest('hex');
    this['refreshTokenExpiresAt'] = new Date(Date.now() + jwtExpirationInterval + 7 * 24 * 60 * 60 * 1000); // JWT expiration + 7 days
    return refreshToken;
  },

  invalidateRefreshToken(): void {
    this['refreshToken'] = null;
    this['refreshTokenExpiresAt'] = null;
  },
};

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await PasswordUtil.hash(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Index for search
adminSchema.index({ email: 1 });
adminSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const Admin = model<AdminDocument>('Admin', adminSchema);

const publicFields = ['_id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt'] as const;

export const ADMIN_PUBLIC_FIELDS_SELECT = publicFields.join(' ');
export const ADMIN_PUBLIC_FIELDS_PROJECT = publicFields.reduce((acc, field) => {
  acc[field] = 1;
  return acc;
}, {} as Record<(typeof publicFields)[number], 1>);
