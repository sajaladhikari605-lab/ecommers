const express = require('express');
const app = express();
require("dotenv").config()



// dns
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load environment variables
require("dotenv").config()



// import database connection
const connectDB = require('./database/connection');


// middleware for passing json data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// connect to database
connectDB();



// routes heres
const authRoutes = require("./routes/auth/authRoutes")
const productRoutes = require("./routes/admine/productRoutes/productRoute")
const profileRoutes = require("./routes/user/myprofile/profileRoutes")
app.use("/api/admin", productRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/user",profileRoutes)


app.get("/", (req, res) => {
    res.send('<h1>Project chalirako xa</h1>')
})








// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})