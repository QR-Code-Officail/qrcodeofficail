import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ScannedQR } from '../models/ScannedQR';

/**
 * Save newly scanned QR code into the database
 */
export const saveScannedQR = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, qrType = 'text', display, title, deviceId: bodyDeviceId } = req.body;

    if (!data || typeof data !== 'string' || !data.trim()) {
      return res.status(400).json({ error: 'Scanned data is required.' });
    }

    const cleanData = data.trim();
    const cleanDisplay = (display || cleanData).trim();
    const userId = req.user?._id;
    const deviceId = bodyDeviceId || (req.headers['x-device-id'] as string) || undefined;

    // Check for rapid duplicate scans within the last 5 seconds to prevent spam
    const query: any = { data: cleanData };
    if (userId) {
      query.userId = userId;
    } else if (deviceId) {
      query.deviceId = deviceId;
    }

    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const existingRecent = await ScannedQR.findOne({
      ...query,
      scannedAt: { $gte: fiveSecondsAgo },
    });

    if (existingRecent) {
      return res.status(200).json({
        success: true,
        message: 'Scan already recorded.',
        item: existingRecent,
      });
    }

    // Create new scan record
    const record = await ScannedQR.create({
      userId: userId || undefined,
      deviceId: deviceId || undefined,
      data: cleanData,
      qrType,
      display: cleanDisplay,
      title: title?.trim() || '',
      scannedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Scanned QR saved successfully.',
      item: record,
    });
  } catch (error: any) {
    console.error('Error saving scanned QR:', error);
    return res.status(500).json({ error: 'Failed to save scan history.' });
  }
};

/**
 * Fetch all scan history for the current user or device
 */
export const getScanHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string) || undefined;

    if (!userId && !deviceId) {
      return res.status(200).json({ success: true, count: 0, history: [] });
    }

    // Seamlessly link any guest scans made on this device before login to the user's account
    if (userId && deviceId) {
      await ScannedQR.updateMany(
        { deviceId, userId: { $exists: false } },
        { $set: { userId } }
      ).catch((err) => console.warn('Could not auto-claim guest scans:', err));
    }

    const query: any = userId ? { userId } : { deviceId };

    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);

    const history = await ScannedQR.find(query)
      .sort({ scannedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching scan history:', error);
    return res.status(500).json({ error: 'Failed to load scan history.' });
  }
};

/**
 * Delete a specific scan history item
 */
export const deleteScanHistoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string);

    const query: any = { _id: id };
    if (userId) {
      query.userId = userId;
    } else if (deviceId) {
      query.deviceId = deviceId;
    }

    const deleted = await ScannedQR.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ error: 'History item not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, message: 'Item deleted from scan history.' });
  } catch (error: any) {
    console.error('Error deleting scan history item:', error);
    return res.status(500).json({ error: 'Failed to delete scan history item.' });
  }
};

/**
 * Clear entire scan history for user or device
 */
export const clearScanHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string);

    if (!userId && !deviceId) {
      return res.status(400).json({ error: 'User or device identification required.' });
    }

    const query: any = userId ? { userId } : { deviceId };

    const result = await ScannedQR.deleteMany(query);

    return res.status(200).json({
      success: true,
      message: 'Scan history cleared successfully.',
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error clearing scan history:', error);
    return res.status(500).json({ error: 'Failed to clear scan history.' });
  }
};
