const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "../uploads/college");
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["application/pdf", ".pdf"]
]);

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, uploadDirectory),
        filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${allowedTypes.get(file.mimetype)}`)
    }),
    fileFilter: (_req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) return callback(new Error("Only JPEG, PNG, WEBP, and PDF files are allowed"));
        callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

module.exports = upload;