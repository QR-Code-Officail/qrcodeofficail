import { Schema, model, Document } from 'mongoose';

export interface IScanAnalytics extends Document {
  qrCodeId: Schema.Types.ObjectId;
  uniqueScan: boolean;
  country: string;
  browser: string;
  device: string;
  os: string;
  ip: string;
  scannedAt: Date;
}

const ScanAnalyticsSchema = new Schema<IScanAnalytics>(
  {
    qrCodeId: { type: Schema.Types.ObjectId, ref: 'QRCode', required: true },
    uniqueScan: { type: Boolean, default: false },
    country: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    ip: { type: String, required: true },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ScanAnalyticsSchema.index({ qrCodeId: 1 });
ScanAnalyticsSchema.index({ scannedAt: 1 });

export const ScanAnalytics = model<IScanAnalytics>('ScanAnalytics', ScanAnalyticsSchema);
