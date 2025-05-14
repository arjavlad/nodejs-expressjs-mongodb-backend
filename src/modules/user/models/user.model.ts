import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { jwtExpirationInterval } from '../../../config/vars';

import { UserStatus } from '../types/enum.type';
import { ProcessedImage, ProcessedImageSchema } from '../../../types/image';

export interface UserImage extends Document {
  _id: Types.ObjectId;
  image: ProcessedImage;
  isApproved: boolean;
  isProfileImage: boolean;
}

export const UserImageSchema = new Schema<UserImage>({
  image: { type: ProcessedImageSchema, required: true },
  isApproved: { type: Boolean, default: false },
  isProfileImage: { type: Boolean, default: false },
});

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  profileImage: ProcessedImage | null;
  images: UserImage[];
  password: string;
  email: string;
  status: UserStatus;
  isActive: boolean;
  isDeleted: boolean;
  isEmailVerified: boolean;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: Date | null;
  blockedBy: Types.ObjectId | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createRefreshToken(): string;
  createPasswordResetToken(): string;
}

const userSchema = new Schema<UserDocument>(
  {
    profileImage: { type: ProcessedImageSchema, required: false, default: null },
    images: { type: [UserImageSchema], required: false, default: [] },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    status: { type: String, required: true, enum: Object.values(UserStatus), default: UserStatus.ACTIVE },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String, required: false, default: null },
    blockedAt: { type: Date, required: false, default: null },
    blockedBy: { type: Schema.Types.ObjectId, required: false, default: null, ref: 'Admin' },
  },
  { timestamps: true },
);

userSchema.index({
  isActive: 1,
  isDeleted: 1,
  isBlocked: 1,
  email: 1,
  status: 1,
});

// Instance methods
userSchema.methods = {
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this['password']);
  },

  createPasswordResetToken(): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this['passwordResetToken'] = crypto.createHash('sha256').update(resetToken).digest('hex');
    this['passwordResetExpiresAt'] = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return resetToken;
  },

  createRefreshToken(): string {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    this['refreshToken'] = crypto.createHash('sha256').update(refreshToken).digest('hex');
    // JWT expiration + 15 days
    const refreshTokenExpiresAt = new Date(Date.now() + jwtExpirationInterval + 15 * 24 * 60 * 60 * 1000);
    this['refreshTokenExpiresAt'] = refreshTokenExpiresAt;
    return refreshToken;
  },
};

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const User = model<UserDocument>('User', userSchema);

const publicFields = ['_id', 'createdAt', 'profileImage', 'images'];
export const USER_PUBLIC_FIELDS_SELECT = publicFields.join(' ');
export const USER_PUBLIC_FIELDS_PROJECT = publicFields.reduce((acc, field) => {
  acc[field] = 1;
  return acc;
}, {} as Record<string, number>);

export const USER_PRIVATE_FIELDS_SELECT = [
  ...publicFields,
  'email',
  'password',
  'isEmailVerified',
  'passwordResetToken',
  'passwordResetExpiresAt',
  'isBlocked',
  'blockedReason',
  'blockedAt',
  'blockedBy',
].join(' ');

export const USER_DETAILS_PUBLIC_FIELDS_SELECT = [...publicFields].join(' ');

export const USER_DETAILS_PRIVATE_FIELDS_SELECT = [
  ...USER_DETAILS_PUBLIC_FIELDS_SELECT.split(' '),
  'email',
  'status',
  'isBlocked',
  'blockedReason',
].join(' ');

const MINI_FIELDS_ADMIN = [
  '_id',
  'profileImage',
  'email',
  'status',
  'isBlocked',
  'blockedReason',
  'blockedBy',
  'createdAt',
];

export const MINI_FIELDS_ADMIN_SELECT = MINI_FIELDS_ADMIN.join(' ');

export const USER_DETAILS_ADMIN_SELECT = [...MINI_FIELDS_ADMIN, 'profileImage', 'createdAt'].join(' ');
