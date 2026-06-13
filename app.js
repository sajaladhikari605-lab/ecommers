const express = require('express');
const app= express();
// dns
const dns = require('dns');
dns.setServers(['8.8.8.8','1.1.1.1']);


app.get("/",(req,res)=>{
    res.send("project is processing");
})


// import database connection
const connectDB = require('./database/connection');
// connect to database
connectDB();

















// Start the server
app.listen(3000, ()=>{
    console.log("server is running on port 3000");
})