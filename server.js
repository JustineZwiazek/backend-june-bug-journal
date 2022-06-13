import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { readFile } from "fs/promises";

const veggies = JSON.parse(
  await readFile(new URL("../data(/seeds.json)", import.meta.url))
);

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

// --------------- MODELS ----------------- //
const User = mongoose.model("User", UserSchema);
const Plant = mongoose.model("Plant", PlantSchema);
const Task = mongoose.model("Task", TaskSchema);
const Note = mongoose.model("Note", NoteSchema);
const Journal = mongoose.model("Journal", JournalSchema);

// ----- Reset Seeds database finction ----- //
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await Seeds.deleteMany({});

    veggies.forEach((item) => {
      const newSeed = new Seed(item);
      newSeed.save();
    });
  };
  seedDatabase();
}

// ----- Port ----- //
const port = process.env.PORT || 8080;
const app = express();

// ----- Middlewares ----- //
app.use(cors());
app.use(express.json());

// --------------- AUTHENTICATION ----------------- //
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");

  try {
    const user = await User.findOne({ accessToken });
    if (user) {
      next();
    } else {
      res.status(401).json({
        response: {
          message: "Login to access the page",
        },
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

// --------------- ENDPOINTS ----------------- //
//////// LANDING ////////
app.get("/", (req, res) => {
  res.send("Welcome to the June Bug Journal API. A project by Justine Z.");
});

//////// ACCOUNT ////////
// -- 1: Sign up -- //
const signUp = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const salt = bcrypt.genSaltSync();
    if (password.length < 5) {
      throw "password and must be at least 5 characters long";
    }
    const newUser = await new User({
      name,
      username,
      password: bcrypt.hashSync(password, salt),
    }).save();

    if (newUser) {
      res.status(201).json({
        response: {
          userId: newUser._id,
          name: newUser.name,
          username: newUser.username,
          accessToken: newUser.accessToken,
        },
        success: true,
      });
    } else {
      res.status(404).json({
        response: "Can not register user",
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json({
      response: error,
      message: "Something went wrong",
      success: false,
    });
  }
};

// -- 2: Sign in -- //
const signIn = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        response: {
          userId: user._id,
          username: user.username,
          name: user.name,
          accessToken: user.accessToken,
        },
        success: true,
      });
    } else {
      res.status(404).json({
        response: "User or password does not match",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

//////// PLANTS ////////
// -- 1: Add plant -- //
const addPlant = async (req, res) => {
  const { Plant, userId } = req.body;

  try {
    const queriedId = await User.findById(userId);
    const newPlant = await new Plant({ plant, user: queriedId }).save();

    if (newPlant) {
      res.status(201).json({
        response: {
          plant: newPlant.plant,
          creationDay: newPlant.createdAt,
          owner: newPlant.user.username,
        },
        success: true,
      });
    } else {
      res.status(404).json({
        message: "Could not find plant",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

// -- 2: Get all user plants -- //
const getPlant = async (req, res) => {
  const { userId } = req.params;

  try {
    const queriedPlants = await Plant.find({
      user: userId,
    });

    if (queriedPlants) {
      res
        .status(200)
        .json({ response: queriedPlants, user: userId, success: true });
    } else {
      res.status(404).json({
        message: "Could not find plants",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ messe: "Invalid request", response: error, success: false });
  }
};

// -- 3: Delete plant -- //
const deletePlant = async (req, res) => {
  const { plantId } = req.params;

  try {
    const deletePlant = await Plant.findOneAndDelete({ _id: plantId });
    if (deletePlant) {
      res.status(200).json({ response: deletePlant, success: true });
    } else {
      res
        .status(404)
        .json({ response: "Could not find plant", success: false });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

//////// TASKS ////////
// -- 1: Add task -- //
const addTask = async (req, res) => {
  const { task, userId } = req.body;

  try {
    const queriedId = await User.findById(userId);
    const newTask = await new Task({ task, user: queriedId }).save();

    if (newTask) {
      res.status(201).json({
        response: {
          task: newTask.task,
          creationDay: newTask.createdAt,
          done: newTask.done,
          author: newTask.user.username,
        },
        success: true,
      });
    } else {
      res.status(404).json({
        message: "Could not find task",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

// -- 2: Get user tasks -- //
const getTask = async (req, res) => {
  const { userId } = req.params;

  try {
    const queriedTasks = await Task.find({
      user: userId,
    });

    if (queriedTasks) {
      res
        .status(200)
        .json({ response: queriedTasks, user: userId, success: true });
    } else {
      res.status(404).json({
        message: "Could not find tasks",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ messe: "Invalid request", response: error, success: false });
  }
};

// -- 3: Edit a task -- //
const editTask = async (req, res) => {
  const { taskId } = req.params;
  const { task } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { task },
      { new: true }
    );
    if (updatedTask) {
      res.status(200).json({ response: updatedTask, success: true });
    } else {
      res.status(404).json({
        message: "Could not find task",
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Invalid request",
      error: error,
      success: false,
    });
  }
};

// -- 4: Delete a task -- //
const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const deleteTask = await Task.findOneAndDelete({ _id: taskId });
    if (deleteTask) {
      res.status(200).json({ response: deleteTask, success: true });
    } else {
      res.status(404).json({ response: "Could not find task", success: false });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

// -- 5: Complete a task -- //
const completeTask = async (req, res) => {
  const { taskId } = req.params;
  const { done } = req.body;

  try {
    const updatedDone = await Task.findByIdAndUpdate(
      taskId,
      { done },
      { new: true }
    );
    res.status(200).json({ response: updatedDone, success: true });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

//////// NOTES ////////
// -- 1: Add note -- //
const addNote = async (req, res) => {
  const { note, userId } = req.body;

  try {
    const queriedId = await User.findById(userId);
    const newNote = await new Note({ note, user: queriedId }).save();

    if (newNote) {
      res.status(201).json({
        response: {
          note: newNote.note,
          creationDay: newNote.createdAt,
        },
        success: true,
      });
    } else {
      res.status(404).json({
        message: "Could not find note",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

// -- 2: Get all user notes -- //
const getNote = async (req, res) => {
  const { userId } = req.params;

  try {
    const queriedNotes = await Note.find({
      user: userId,
    });

    if (queriedNotes) {
      res
        .status(200)
        .json({ response: queriedNotes, user: userId, success: true });
    } else {
      res.status(404).json({
        message: "Could not find notes",
        success: false,
      });
    }
  } catch (error) {
    res
      .status(400)
      .json({ messe: "Invalid request", response: error, success: false });
  }
};

// -- 3: Edit a note -- //
export const editNote = async (req, res) => {
  const { NoteId } = req.params;
  const { note } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { Note },
      { new: true }
    );
    if (updatedNote) {
      res.status(200).json({ response: updatedNote, success: true });
    } else {
      res.status(404).json({
        message: "Could not find note",
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Invalid request",
      error: error,
      success: false,
    });
  }
};

// -- 4: Delete a note -- //
export const deleteNote = async (req, res) => {
  const { noteId } = req.params;

  try {
    const deleteNote = await Note.findOneAndDelete({ _id: NoteId });
    if (deleteNote) {
      res.status(200).json({ response: deleteNote, success: true });
    } else {
      res.status(404).json({ response: "Could not find note", success: false });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid request", response: error, success: false });
  }
};

//////// USER JOURNAL ////////
// -- 1: Access journal page - do I need this? -- //
const accessJournal = async (req, res) => {
  const journal = await Journal.find({});
  res.status(200).json({ response: journal, success: true });
};

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
