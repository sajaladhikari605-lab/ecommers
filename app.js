const express = require('express');
const app = express();
// dns
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);





// import database connection
const connectDB = require('./database/connection');


// middleware for passing json data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// connect to database
connectDB();



// routes heres
const authRoutes = require("./routes/auth/authRoutes")
app.use("/api/auth", authRoutes)


app.get("/", (req, res) => {
    res.send('<h1>Project chalirako xa</h1>')
})








// Start the server
app.listen(3000, () => {
    console.log("server is running on port 3000");
})