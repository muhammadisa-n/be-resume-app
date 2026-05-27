import "dotenv/config";
import mongoose from "mongoose";

const ConnectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.DATABASE_URL);
    if (!connect) {
      console.log("Database Connection Failed");
    }
    console.log("Database Connection Successfully");
  } catch (error) {
    console.log("Database Connection Error: ", error);
  }
};
export default ConnectDB;
