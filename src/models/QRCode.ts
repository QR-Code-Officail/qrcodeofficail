import { Schema, model, Document } from 'mongoose';

export interface IQRCode extends Document {
  name: string;
  type: 'static' | 'dynamic';
  dataType: 'url' | 'text' | 'email' | 'sms' | 'phone' | 'wifi' | 'contact' | 'event' | 'location' | 'pdf';
  content: Record<string, any>; // Stores the QR-specific details (e.g., wifi credentials, SMS number/body, URL, etc.)
  style?: {
    foregroundType?: 'color' | 'gradient';
    foregroundColor?: string;
    gradientType?: 'linear' | 'radial';
    gradientColors?: string[];
    backgroundColor?: string;
    dotsPattern?: 'square' | 'dots' | 'rounded' | 'classy' | 'extra-rounded';
    cornersType?: 'square' | 'dot' | 'extra-rounded' | 'out-rounded';
    cornersDotsType?: 'square' | 'dot';
    logoUrl?: string;
    logoMargin?: number;
    logoWidth?: number;
    logoHeight?: number;
    frameType?: string;
    frameText?: string;
    frameTextColor?: string;
    frameColor?: string;
  };
  status: 'draft' | 'active' | 'paused' | 'expired' | 'deleted';
  userId: Schema.Types.ObjectId;
  redirectCode?: string; // Short code for dynamic QR redirection
  createdAt: Date;
  updatedAt: Date;
}

const QRCodeSchema = new Schema<IQRCode>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['static', 'dynamic'], required: true },
    dataType: {
      type: String,
      enum: ['url', 'text', 'email', 'sms', 'phone', 'wifi', 'contact', 'event', 'location', 'pdf'],
      required: true,
    },
    content: { type: Schema.Types.Mixed, required: true },
    style: {
      foregroundType: { type: String, default: 'color' },
      foregroundColor: { type: String, default: '#000000' },
      gradientType: { type: String, default: 'linear' },
      gradientColors: { type: [String], default: ['#2563EB', '#06B6D4'] },
      backgroundColor: { type: String, default: '#FFFFFF' },
      dotsPattern: { type: String, default: 'square' },
      cornersType: { type: String, default: 'square' },
      cornersDotsType: { type: String, default: 'square' },
      logoUrl: { type: String },
      logoMargin: { type: Number, default: 2 },
      logoWidth: { type: Number },
      logoHeight: { type: Number },
      frameType: { type: String, default: 'none' },
      frameText: { type: String },
      frameTextColor: { type: String, default: '#FFFFFF' },
      frameColor: { type: String, default: '#2563EB' },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'expired', 'deleted'],
      default: 'active',
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    redirectCode: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

// Indexing for faster queries and search (handled automatically by mongoose unique constraints where applicable)

export const QRCode = model<IQRCode>('QRCode', QRCodeSchema);
