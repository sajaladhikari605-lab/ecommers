//  database/connection.js
const mongoose = require('mongoose');



const connectDB = async () => {
    try{
        await mongoose.connect("mongodb+srv://sajaladhikari605_db_user:nalFkPSkKPK6R6Gk@cluster0.6bvc8pl.mongodb.net/?appName=Cluster0")
        console.log("connected to database successfully");
    }catch(error){
        console.error("error connecting to database", error);   
    }
}

module.exports = connectDB;