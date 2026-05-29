require("dotenv").config();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "uploads";
    let resource_type = "auto";

    // Image
    if (file.mimetype.startsWith("image")) {
      folder = "uploads/images";
      resource_type = "image";
    }

    // Video
    else if (file.mimetype.startsWith("video")) {
      folder = "uploads/videos";
      resource_type = "video";
    }

    // PDF
    else if (file.mimetype === "application/pdf") {
      folder = "uploads/pdfs";
      resource_type = "raw"; // IMPORTANT
    }

    // File name
    const baseName =
      file.originalname.split(".")[0];

    const ext = file.originalname.includes(".")
      ? file.originalname.substring(
          file.originalname.lastIndexOf(".")
        )
      : "";

    // Keep extension only for raw files (PDF)
    const publicId =
      resource_type === "raw"
        ? `${Date.now()}-${baseName}${ext}`
        : `${Date.now()}-${baseName}`;

    return {
      folder,
      resource_type,
      type: "upload",
      public_id: publicId,
    };
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "video/mp4",
    "video/mkv",
    "video/webm",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only Image, Video and PDF files are allowed"
      ),
      false
    );
  }
};

// Multer Upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 50, // 50MB
  },
});

module.exports = { upload, cloudinary };