import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectMongoDb = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `MONGODB Connected. DB host : ${connectMongoDb.connection.host}`
    );
  } catch (error) {
    console.error(`MONGODB FAILED TO CONNECT :  ${error}`);
    process.exit(1);
  }
};

export default connectDB;
