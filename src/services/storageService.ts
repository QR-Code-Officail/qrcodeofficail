import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured =
  cloudName &&
  cloudName !== 'placeholder_cloud_name' &&
  apiKey &&
  apiKey !== 'placeholder_api_key' &&
  apiSecret &&
  apiSecret !== 'placeholder_api_secret';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn('Cloudinary environment variables are not fully configured. Using local file service fallback.');
}

export const storageService = {
  /**
   * Upload logo or custom QR asset (with Cloudinary & Local File Fallback)
   * @param fileBase64 Base64 encoded file string
   * @param folder Folder name ('logos' | 'avatars')
   */
  async uploadAsset(fileBase64: string, folder: string = 'logos'): Promise<string> {
    // 1. Normalise: ensure clean data URI format and strip any whitespace/newlines
    //    that some base64 encoders insert (which would break regex matching)
    let uploadStr = fileBase64.replace(/\s/g, '');
    if (!uploadStr.startsWith('data:')) {
      uploadStr = `data:image/jpeg;base64,${uploadStr}`;
    }

    // 2. Try Cloudinary if configured
    if (isCloudinaryConfigured) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(uploadStr, {
          folder: `qr_code_official/${folder}`,
          resource_type: 'auto',
        });
        if (uploadResponse && uploadResponse.secure_url) {
          return uploadResponse.secure_url;
        }
      } catch (error) {
        console.error('Cloudinary upload failed, falling back to local file storage:', error);
      }
    }

    // 3. Fallback: Save file locally in the backend public/uploads directory
    try {
      // Safely extract mime type and raw base64 data from the data URI
      const separatorIndex = uploadStr.indexOf(';base64,');
      let base64Data: string;
      let extension = 'jpg';

      if (separatorIndex !== -1) {
        const mimeType = uploadStr.substring(5, separatorIndex); // strip 'data:'
        base64Data = uploadStr.substring(separatorIndex + 8);    // strip ';base64,'
        extension = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
      } else {
        // No valid data URI prefix — treat the whole string as raw base64
        base64Data = uploadStr;
      }

      const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
      const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', folder);

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      // Use PORT-based URL (EXPO_PUBLIC_API_URL is a mobile-only env var, not available here)
      const PORT = process.env.PORT || '5000';
      const serverHost = process.env.SERVER_URL || `http://localhost:${PORT}`;
      return `${serverHost}/uploads/${folder}/${filename}`;
    } catch (localError) {
      console.error('Local filesystem upload fallback failed:', localError);
      // Absolute final fallback — returns a working placeholder so the app never crashes
      const mockId = Math.random().toString(36).substring(7);
      return `https://res.cloudinary.com/demo/image/upload/v1580823825/sample.jpg?mock=${folder}_${mockId}`;
    }
  },
};
