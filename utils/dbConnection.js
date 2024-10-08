const express  = require('express');
const mongoose = require('mongoose');
const app      = express();

require('dotenv').config();

const uri = process.env.MONGO_ATLAS_URI
// const uri  = 'mongodb://localhost:27017/deliver'; 

const connection = () => {
    // mongoose.connect(uri) 
    mongoose.connect(uri)
    .then(() => {
        console.log("connected to MongoDB");
    }).catch((err) => {
        console.log("Error in connecting to MongoDB",err);
    })
}

module.exports = connection;
