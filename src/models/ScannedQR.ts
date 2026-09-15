import { Schema, model, Document } from 'mongoose';

export interface IScannedQR extends Document {
  userId?: Schema.Types.ObjectId;
  deviceId?: string;
  data: string;
  qrType: 'url' | 'wifi' | 'email' | 'sms' | 'call' | 'text' | 'barcode';
  display: string;
  title?: string;
  scannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScannedQRSchema = new Schema<IScannedQR>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deviceId: { type: String, index: true },
    data: { type: String, required: true },
    qrType: {
      type: String,
      enum: ['url', 'wifi', 'email', 'sms', 'call', 'text', 'barcode'],
      default: 'text',
    },
    display: { type: String, required: true },
    title: { type: String, default: '' },
    scannedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

ScannedQRSchema.index({ userId: 1, scannedAt: -1 });
ScannedQRSchema.index({ deviceId: 1, scannedAt: -1 });

export const ScannedQR = model<IScannedQR>('ScannedQR', ScannedQRSchema);
