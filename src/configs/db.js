const mongoose = require("mongoose");

//hello
const URI = "mongodb+srv://ericmarkcarlson:node123@cluster0.j4cyafb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log("DB Connected Successfully ✅");
  } catch (e) {
    console.log(`Authentication to database failed ❗`);
    process.exit(1);
  }
};

module.exports = connectDB;
