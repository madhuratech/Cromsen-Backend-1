const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary with ENV credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    return {
      folder: "cromsen",
      resource_type: isVideo ? "video" : "image",
      // Use original name (without extension) as public_id for traceability
      public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
      // For images, auto-optimize format; for videos keep original
      ...(isVideo ? {} : { format: "webp", transformation: [{ quality: "auto" }] }),
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|mp4|webm|ogg|m4v|mov|avi/;
  const isMatch = allowed.test(path.extname(file.originalname).toLowerCase());
  if (isMatch) {
    cb(null, true);
  } else {
    cb(new Error("Special file type not allowed. Please use images or videos."), false);
  }
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
