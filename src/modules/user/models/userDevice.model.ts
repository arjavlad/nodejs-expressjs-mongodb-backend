import { Schema, model, Document, Types } from 'mongoose';
import crypto from 'crypto';

import { jwtExpirationInterval } from '../../../config/vars';

import { AuthRole, DeviceType } from '../../../types/enum';

import { JwtUtil } from '../../../utils/jwt.util';

export interface UserDeviceDocument extends Document {
  userId: Types.ObjectId;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  deviceToken?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  jwtToken?: string;
  jwtTokenExpiresAt?: Date;
  isActive: boolean;
  lastActiveAt: Date;
  createTokens(): { refreshToken: string; accessToken: string };
  deactivate(): void;
  updateDeviceToken(deviceToken: string): void;
  updateJwtToken(accessToken: string): void;
}

const userDeviceSchema = new Schema<UserDeviceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true, default: () => crypto.randomUUID(), unique: true },
    deviceType: { type: String, enum: Object.values(DeviceType), required: true },
    deviceName: { type: String, required: true },
    deviceToken: String,
    refreshToken: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
    jwtToken: { type: String, select: false },
    jwtTokenExpiresAt: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Create compound index for efficient queries
userDeviceSchema.index({ userId: 1, deviceId: 1 });

userDeviceSchema.methods = {
  createTokens(): { refreshToken: string; accessToken: string } {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const accessToken = JwtUtil.generateAccessToken(this['userId'].toString(), AuthRole.USER);
    const hashedAccessToken = crypto.createHash('sha256').update(accessToken).digest('hex');

    this['refreshToken'] = hashedRefreshToken;
    this['refreshTokenExpiresAt'] = new Date(Date.now() + (jwtExpirationInterval + 4) * 24 * 60 * 60 * 1000); // 4 days more than jwtExpirationInterval
    this['jwtToken'] = hashedAccessToken;
    this['jwtTokenExpiresAt'] = new Date(Date.now() + jwtExpirationInterval * 24 * 60 * 60 * 1000); // in days
    this['lastActiveAt'] = new Date();

    return {
      refreshToken,
      accessToken,
    };
  },

  deactivate(): void {
    this['isActive'] = false;
    this['refreshToken'] = undefined;
    this['refreshTokenExpiresAt'] = undefined;
    this['jwtToken'] = undefined;
    this['jwtTokenExpiresAt'] = undefined;
  },

  updateDeviceToken(deviceToken: string): void {
    this['deviceToken'] = deviceToken;
    this['lastActiveAt'] = new Date();
  },

  updateJwtToken(accessToken: string): void {
    const hashedAccessToken = crypto.createHash('sha256').update(accessToken).digest('hex');
    this['jwtToken'] = hashedAccessToken;
    this['jwtTokenExpiresAt'] = new Date(Date.now() + jwtExpirationInterval * 24 * 60 * 60 * 1000); // in days
    this['lastActiveAt'] = new Date();
  },
};

export const UserDevice = model<UserDeviceDocument>('UserDevice', userDeviceSchema);
