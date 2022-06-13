import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { readFile } from "fs/promises";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/junebugjournal";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// --------------- SCHEMAS ----------------- //
// ----- User Schema ----- //
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex"),
  },
  location: {
    type: String,
  },
  name: {
    type: String,
    trim: true,
    minlength: 2,
  },
  created: {
    type: Number,
    default: () => Date.now(),
    timestamps: true,
  },
});

// ----- Plant Schema ----- //
const PlantSchema = new mongoose.Schema({
  body: {
    id: "Number",
    name: "String",
    class: "String",
    type: "String",
    years: "String",
    position: "String",
    height: "Number",
    sowing_type: "String",
    sowing_start: "String",
    sowing_end: "String",
    harvest_start: "String",
    harvest_end: "String",
    days_germination: "Number",
    days_harvest: "String",
    description: "String",
    cutivation_info: "String",
  },
  time: {
    type: Date,
  },
  createdAt: {
    type: Number,
    default: () => Date.now(),
  },
  // I am not sure this is the way to go:
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// ----- Task Schema ----- //
const TaskSchema = new mongoose.Schema({
  body: {
    type: String,
    minlength: 3,
    maxlength: 150,
    trim: true,
  },
  time: {
    type: Date,
  },
  createdAt: {
    type: Number,
    default: () => Date.now(),
  },
  // I am not sure this is the way to go:
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// ----- Note Schema ----- //
const NoteSchema = new mongoose.Schema({
  body: {
    type: String,
    minlength: 8,
    maxlength: 600,
    trim: true,
  },
  time: {
    type: Date,
  },
  createdAt: {
    type: Number,
    default: () => Date.now(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

// ----- Journal Schema ----- //
const JournalSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
  },
});

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Technigo!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// --------------- Models ----------------- //
const User = mongoose.model("User", UserSchema);
const Plant = mongoose.model("Plant", PlantSchema);
const Task = mongoose.model("Task", TaskSchema);
const Note = mongoose.model("Note", NoteSchema);
const Journal = mongoose.model("Journal", JournalSchema);

// ----- Reset Veggie database finction ----- //
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await Veggies.deleteMany({});

    thoughts.forEach((item) => {
      const newVeggie = new Veggie(item);
      newVeggie.save();
    });
  };

  seedDatabase();
}
