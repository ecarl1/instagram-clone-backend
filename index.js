const express = require("express");
const connectDB = require("./src/configs/db");
const cors = require("cors");
const userRoute = require("./src/routes/userRoute");
const articleRoute = require("./src/routes/articleRoute");
const commentRoute = require("./src/routes/commentRoute");
const PORT = 8000;
const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/user", userRoute);
app.use("/api/article", articleRoute);
app.use("/api/comment", commentRoute);
app.use("/", (req, res) => {
  console.log(`Invalid route access: ${req.method} ${req.path}`);
  res.send("The requested route was not found on this server.");
});
app.listen(PORT, () => {
  console.log(`server run on port ${PORT} ✅`);
});
