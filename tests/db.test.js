const mongoose = require("mongoose");
const connectDB = require("../config/db");

jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

describe("Database Connection", () => {
  test("should connect to the database successfully", async () => {
    mongoose.connect.mockResolvedValueOnce({});
    console.log = jest.fn();

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb+srv://ericmarkcarlson:node123@cluster0.j4cyafb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    expect(console.log).toHaveBeenCalledWith("DB Connected Successfully ✅");
  });

  test("should fail to connect to the database", async () => {
    mongoose.connect.mockRejectedValueOnce(new Error("Failed to connect"));
    console.log = jest.fn();
    process.exit = jest.fn();

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb+srv://ericmarkcarlson:node123@cluster0.j4cyafb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    expect(console.log).toHaveBeenCalledWith("Authentication to database failed ❗");
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
