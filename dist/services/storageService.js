"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageService = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const isCloudinaryConfigured = cloudName &&
    cloudName !== 'placeholder_cloud_name' &&
    apiKey &&
    apiKey !== 'placeholder_api_key' &&
    apiSecret &&
    apiSecret !== 'placeholder_api_secret';
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
}
else {
    console.warn('Cloudinary environment variables are not fully configured. Using mock local file service fallback.');
}
exports.storageService = {
    /**
     * Upload logo or custom QR asset
     * @param fileBase64 Base64 encoded file string
     * @param folder Folder name in Cloudinary or virtual mock folder
     */
    async uploadAsset(fileBase64, folder = 'logos') {
        if (!isCloudinaryConfigured) {
            // Simulate slow upload in development
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Return a standard placeholder image URL or mock URL
            const mockId = Math.random().toString(36).substring(7);
            return `https://res.cloudinary.com/demo/image/upload/v1580823825/sample.jpg?mock=${folder}_${mockId}`;
        }
        try {
            const uploadResponse = await cloudinary_1.v2.uploader.upload(fileBase64, {
                folder: `qr_code_official/${folder}`,
                resource_type: 'auto',
            });
            return uploadResponse.secure_url;
        }
        catch (error) {
            console.error('Error uploading asset to Cloudinary:', error);
            throw new Error('Failed to upload asset to cloud storage.');
        }
    },
};
