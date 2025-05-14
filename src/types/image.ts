import { Schema, Types, Document } from 'mongoose';

import { AuthRole } from './enum';

/**
 * Represents image paths in the storage system
 * Each string represents the path to the image in the storage bucket
 */
export interface ProcessedImage extends Document {
  _id: false;
  original: string;
  small: string;
  medium: string;
  large: string;
}

/**
 * Mongoose schema for the Image type
 */
export const ProcessedImageSchema = new Schema<ProcessedImage>({
  _id: false,
  original: { type: String, required: true },
  small: { type: String, required: true },
  medium: { type: String, required: true },
  large: { type: String, required: true },
});

/**
 * Represents an image in the database
 * @property _id - The unique identifier for the image
 * @property path - The path to the image in the storage bucket
 * @property createdAt - The date and time the image was created
 * @property createdBy - The user who created the image
 */
export interface Image extends Document {
  _id: Types.ObjectId;
  path: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
}

export const ImageSchema = new Schema<Image, { UploaderType: AuthRole }>({
  path: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'UploaderType', required: true },
  createdAt: { type: Date, default: Date.now },
});

export interface Location extends Document {
  address: string;
  country: { _id: Types.ObjectId; name: string };
  state: { _id: Types.ObjectId; name: string };
  city: { _id: Types.ObjectId; name: string };
  latitude?: number;
  longitude?: number;
}

export const LocationSchema = new Schema<Location>({
  address: { type: String, required: true },
  country: {
    type: {
      _id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },
    required: true,
  },
  state: {
    type: {
      _id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },
    required: true,
  },
  city: {
    type: {
      _id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },
    required: true,
  },
  latitude: { type: Number, required: false, default: null },
  longitude: { type: Number, required: false, default: null },
});
