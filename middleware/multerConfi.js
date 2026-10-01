const multer = require("multer")


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // check file type
        const allowedFileTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"]
        if (!allowedFileTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type. Only JPEG, PNG, JPG, GIF, and WEBP are allowed."))
        }

        cb(null, "uploads/")
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)
    }
})

module.exports = {
multer,
    storage
}