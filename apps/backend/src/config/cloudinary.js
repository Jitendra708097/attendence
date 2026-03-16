/**
 * @module cloudinary
 * @description Cloudinary API configuration for image/video storage and processing.
 */
const cloudinary = require('cloudinary');

const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

// Validate required credentials
if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret) {
  console.warn('⚠️  Cloudinary credentials not configured. Image upload and processing will fail.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path or buffer of file to upload
 * @param {object} options - Cloudinary upload options
 * @returns {Promise} Upload result with secure_url, public_id, etc.
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'attendease',
      resource_type: 'auto',
      quality: 'auto',
      ...options,
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

module.exports.uploadImage = uploadImage;

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of uploaded resource
 * @returns {Promise} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports.deleteImage = deleteImage;
module.exports.uploadImage = uploadImage;
module.exports = cloudinaryConfig;
