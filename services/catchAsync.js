module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => {
            if (err.name === "ValidationError" || err.name === "CastError") {
                return res.status(400).json({ success: false, message: "Invalid request data" });
            }
            if (err.code === 11000) {
                return res.status(409).json({ success: false, message: "A record with this value already exists" });
            }
            return res.status(500).json({ success: false, message: "An unexpected server error occurred" });
        })
    }
}