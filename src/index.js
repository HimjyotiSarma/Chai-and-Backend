// require("dotenv").config({
//   path: "./env",
// });
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is connecting at ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.log(`Error in Listing to PORT :  ${error}`);
      throw new Error(error);
    });
  })
  .catch((error) => {
    console.log(`MONGODB failed to Connect. ERROR: ->> ${error}`);
  });
/* 
import { DB_NAME } from "./constants";

const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log(error);
      throw new Error();
    });

    app.listen(`${process.env.PORT}`, () => {
      console.log(`App is Successfully listening at ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
})();
*/
