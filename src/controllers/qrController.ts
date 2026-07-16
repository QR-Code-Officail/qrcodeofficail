import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { QRCode } from '../models/QRCode';
import { Subscription } from '../models/Subscription';
import { storageService } from '../services/storageService';

// Simple unique slug generator for dynamic QR code redirects
const generateRedirectCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check user's QR creation limits based on their subscription
const checkQrCodeLimit = async (userId: string, type: string) => {
  if (type === 'static') return; // Static is paid per QR, bypass limits!

  const subscription = await Subscription.findOne({ userId });
  const count = await QRCode.countDocuments({ userId, type: 'dynamic', status: { $ne: 'deleted' } });

  if (!subscription) {
    // Default fallback limits (Guest or expired trial)
    if (count >= 5) {
      throw new Error('Trial QR limit reached. Please verify your email or upgrade.');
    }
    return;
  }

  const { status, planType } = subscription;

  // Enforce status checks
  if (status === 'expired' || status === 'paused') {
    throw new Error('Your subscription is currently inactive or paused. Please renew to create new QR codes.');
  }

  if (status === 'trial') {
    if (count >= 5) {
      throw new Error('Free trial QR limit reached (max 5 QR codes). Please upgrade to Starter or Professional to create more.');
    }
  } else if (planType === 'starter') {
    if (count >= 10) {
      throw new Error('Starter Plan QR limit reached (max 10 QR codes). Please upgrade to Professional for unlimited QRs.');
    }
  }
  // Professional or Yearly plans are unlimited
};

export const createQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const { name, type, dataType, content, style } = req.body;

    // Check plan limits
    try {
      await checkQrCodeLimit(userId.toString(), type);
    } catch (limitErr: any) {
      return res.status(403).json({ error: limitErr.message });
    }

    if (type === 'static') {
      const user = req.user!;
      if ((user.staticCredits ?? 0) <= 0) {
        return res.status(403).json({
          error: 'You need 1 Static QR Credit to generate a Static QR Code. Please purchase a credit.',
          code: 'NO_STATIC_CREDITS'
        });
      }
      // Decrement credit
      user.staticCredits -= 1;
      await user.save();
    }

    let redirectCode: string | undefined = undefined;
    if (type === 'dynamic') {
      // Ensure redirect code is unique
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        redirectCode = generateRedirectCode();
        const existing = await QRCode.findOne({ redirectCode });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        return res.status(500).json({ error: 'Failed to generate a unique redirect code.' });
      }
    }

    const qrCode = new QRCode({
      name,
      type,
      dataType,
      content,
      style,
      status: 'active',
      userId,
      redirectCode,
    });

    await qrCode.save();
    return res.status(201).json(qrCode);
  } catch (error: any) {
    console.error('Error creating QR code:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMyQRCodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    // Exclude deleted QR codes
    const qrCodes = await QRCode.find({ userId, status: { $ne: 'deleted' } }).sort({ createdAt: -1 });
    return res.status(200).json(qrCodes);
  } catch (error) {
    console.error('Error fetching user QR codes:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQRCodeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const qrCode = await QRCode.findOne({ _id: id, userId, status: { $ne: 'deleted' } });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found or has been deleted.' });
    }

    return res.status(200).json(qrCode);
  } catch (error) {
    console.error('Error fetching QR code by ID:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { name, content, style } = req.body;

    const qrCode = await QRCode.findOne({ _id: id, userId, status: { $ne: 'deleted' } });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found.' });
    }

    // Static QRs can be styled, renamed, but updating their destination text/URL in the database
    // doesn't update the already printed static QR code. We still allow editing content for metadata purposes,
    // but warn the user in-app. Dynamic QRs update dynamically.
    if (name) qrCode.name = name;
    if (content) qrCode.content = content;
    if (style) qrCode.style = { ...qrCode.style, ...style };

    await qrCode.save();
    return res.status(200).json(qrCode);
  } catch (error: any) {
    console.error('Error updating QR code:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const toggleQRCodeStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { status } = req.body; // active or paused

    const qrCode = await QRCode.findOne({ _id: id, userId, status: { $ne: 'deleted' } });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found.' });
    }

    if (status !== 'active' && status !== 'paused' && status !== 'draft') {
      return res.status(400).json({ error: 'Invalid status. Status can only be toggled to active, paused or draft.' });
    }

    qrCode.status = status;
    await qrCode.save();
    return res.status(200).json(qrCode);
  } catch (error) {
    console.error('Error toggling QR status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadQRCodeLogo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { logoBase64 } = req.body; // base64 representation of image

    if (!logoBase64) {
      return res.status(400).json({ error: 'Logo base64 data string is required.' });
    }

    const qrCode = await QRCode.findOne({ _id: id, userId, status: { $ne: 'deleted' } });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found.' });
    }

    // Upload to Cloudinary / Storage service
    const uploadedUrl = await storageService.uploadAsset(logoBase64, 'logos');

    qrCode.style = {
      ...qrCode.style,
      logoUrl: uploadedUrl,
    };

    await qrCode.save();
    return res.status(200).json({ logoUrl: uploadedUrl, qrCode });
  } catch (error: any) {
    console.error('Error uploading QR logo:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteQRCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const qrCode = await QRCode.findOne({ _id: id, userId });
    if (!qrCode) {
      return res.status(404).json({ error: 'QR Code not found.' });
    }

    // Soft delete by updating status
    qrCode.status = 'deleted';
    await qrCode.save();

    return res.status(200).json({ message: 'QR Code successfully deleted.' });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
