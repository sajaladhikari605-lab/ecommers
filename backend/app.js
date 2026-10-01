const express = require('express');
const cors = require('cors');
const path = require("path");
const isAuthenticated = require("./middleware/isAuthenticated");
const app = express();
require("dotenv").config()



// dns
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Import DB connection
const connectDB = require("./database/connection")

// Load environment variables
require("dotenv").config()

// Middleware for parsing JSON data
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173" ||"https://scms-ashen.vercel.app/")
    .split(",")
    .map((origin) => origin.trim());
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin))
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Access to uploads folder
app.use("/uploads/college", isAuthenticated, express.static(path.join(__dirname, "uploads/college")));
app.use("/uploads", express.static("uploads"))

// Routes heres
const authRoutes = require("./routes/auth/authRoutes")
const productRoutes = require('./routes/admin/product/productRoutes');
const profileRoutes = require("./routes/user/myprofile/profileRoutes")
const globalRoutes = require("./routes/global/globalRoutes")
const cartRoutes = require("./routes/user/myprofile/cart/cartRoutes")
const orderRoutes = require("./routes/user/myprofile/order/orderRoutes")
const reviewRoutes = require("./routes/user/myprofile/review/reviewRoutes")
const adminOrderRoutes = require("./routes/admin/orderRoutes/orderRoutes")
const collegeRoutes = require("./routes/collegeRoutes")

app.use("/api/admin/product", productRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/user",profileRoutes)
app.use("/api/globals", globalRoutes)
app.use("/api/user/cart", cartRoutes)
app.use("/api/user", orderRoutes)
app.use("/api/user/review", reviewRoutes)
app.use("/api/admin/order", adminOrderRoutes)
app.use("/api/college", collegeRoutes)

app.get("/", (req, res)=>{
    res.send("<h1>Project chalirako xa! Hami backend handai xum! UI paxi banaune ho!</h1>")
})

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        database: require("mongoose").connection.readyState === 1 ? "connected" : "disconnected"
    })
})









const port = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB()
        app.listen(port, ()=>{
            console.log(`Server is running on port ${port}`);
        })
    } catch (error) {
        process.exitCode = 1
    }
}

startServer()