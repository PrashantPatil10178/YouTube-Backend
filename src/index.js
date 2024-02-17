import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import Express from "express";

dotenv.config({});

const app = Express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERRR: ", error);
      throw error;
    });
  } catch (error) {
    console.log(error);
    throw err;
    return;
  }
})();
