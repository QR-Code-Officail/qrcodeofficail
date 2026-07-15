import { Schema, model, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: Schema.Types.ObjectId;
  status: 'trial' | 'active' | 'grace' | 'expired' | 'paused';
  planType: 'starter' | 'professional' | 'yearly';
  trialEndsAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  gracePeriodEndsAt?: Date;
  googlePlayPurchaseToken?: string;
  googlePlayProductId?: string;
  autoRenewing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: {
      type: String,
      enum: ['trial', 'active', 'grace', 'expired', 'paused'],
      default: 'trial',
    },
    planType: {
      type: String,
      enum: ['starter', 'professional', 'yearly'],
      default: 'starter',
    },
    trialEndsAt: { type: Date, required: true },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    gracePeriodEndsAt: { type: Date },
    googlePlayPurchaseToken: { type: String },
    googlePlayProductId: { type: String },
    autoRenewing: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);
