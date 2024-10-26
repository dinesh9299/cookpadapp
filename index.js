const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "*", // Allow all origins, or specify your app's origin
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const connectionString = process.env.Mongo_url;
let db;

// Connect to MongoDB and set the database
MongoClient.connect(connectionString)
  .then((client) => {
    db = client.db("cookpad");
    console.log("Connected to MongoDB");
  })
  .catch((error) => console.error("MongoDB connection error:", error));

// POST login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await db.collection("appusers").findOne({ username });

    if (!existingUser) {
      return res.status(201).json({
        message: "Invalid user",
        success: false,
        error: true,
      });
    }

    const checkPassword = existingUser.password === password;

    if (checkPassword) {
      return res.json({
        message: "Login success",
        success: true,
        error: false,
        data: existingUser,
      });
    } else {
      return res.status(201).json({
        message: "Invalid password",
        success: false,
        error: true,
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      error: true,
    });
  }
});

//Add user

app.post("/register", async (req, res) => {
  const { name, username, mobile, password } = req.body;

  if (!name) {
    return res.json("please provide name");
  }

  const newuser = {
    name,
    username,
    mobile,
    password,
  };

  const existinguser = await db.collection("appusers").findOne({ username });

  if (existinguser) {
    return res.json({
      message: "email already exist",
      success: false,
      error: true,
    });
  } else {
    const user = db.collection("appusers").insertOne(newuser);

    return res.status(200).json({
      message: "user created",
      success: true,
      error: false,
      data: user,
    });
  }
});

//post the saved list
app.post("/save/:id/:mid", async (req, res) => {
  const id = req.params.id;
  const mid = req.params.mid;

  const { image, name } = req.body;

  const existingitem = await db
    .collection("saved")
    .findOne({ id: id, mealid: mid });

  if (existingitem) {
    res.json({
      message: "meal already in favourites",
      success: false,
      error: true,
    });
  } else {
    const newitem = {
      id,
      mealid: mid,
      image,
      name,
    };

    await db
      .collection("saved")
      .insertOne(newitem)
      .then(() => {
        res.json({
          message: "item added to favourites",
          error: false,
          success: true,
        });
      });
  }
});

//delete from saved list
app.delete("/remove/:id/:mid", async (req, res) => {
  const id = req.params.id;
  const mid = req.params.mid;

  await db
    .collection("saved")
    .deleteOne({ id: id, mealid: mid })
    .then(() => {
      res.json({
        message: "item removed from favourites",
        success: true,
        error: false,
      });
    });
});

//get the saved list
app.get("/getsaved/:id", async (req, res) => {
  const id = req.params.id;

  await db
    .collection("saved")
    .find({ id: id })
    .toArray()
    .then((documents) => {
      res.send(documents);
      res.end();
    });
});

// Start the server
app.listen(8000, () => {
  console.log("Server is running on http://127.0.0.1:8000");
});
