const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, CURSOR_FLAGS } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("protfolioDB");
    const collection = db.collection("adminUser");
    const skillsCollection = db.collection("skills");
    const projectCollection = db.collection("project");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({ name, email, password: hashedPassword });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // Code starts here
    // ==============================================================

    app.get("/api/v1/skills", async (req, res) => {
      try {
        const skills = await skillsCollection.find({}).toArray();
        const skillsDatq = {
          success: true,
          message: "all skills retrived successfully",
          data: skills,
        };
        res.status(200).json(skillsDatq);
      } catch (err) {
        const errorData = {
          success: false,
          console: err,
          message: "Can't Retrived the skills",
        };
        res.status(500).send(errorData);
      }
    });

    app.post("/api/v1/skills", async (req, res) => {
      const data = req.body;
      try {
        const createSKill = await skillsCollection.insertOne(data);
        const skillsDatq = {
          success: true,
          message: "skills added successfully",
          data: createSKill,
        };
        res.status(200).send(skillsDatq);
      } catch (err) {
        const errorData = {
          success: false,
          message: "Can't Create A skill",
        };
        res.status(500).send(errorData);
      }
    });

    //profile image and description//
    app.get("/api/v1/projects", async (req, res) => {
      try {
        const projects = await projectCollection.find({}).toArray();
        const projectData = {
          success: true,
          message: "all skills retrived successfully",
          data: projects,
        };
        res.status(200).json(projectData);
      } catch (err) {
        const errorData = {
          success: false,
          console: err,
          message: "Can't Retrived the projects",
        };
        res.status(500).send(errorData);
      }
    });

    app.post("/api/v1/projects", async (req, res) => {
      const data = req.body;
      try {
        const project = await projectCollection.insertOne(data);
        const projectData = {
          success: true,
          message: "skills added successfully",
          data: project,
        };
        res.status(200).send(projectData);
      } catch (err) {
        const errorData = {
          success: false,
          message: "Can't Create A skill",
        };
        res.status(500).send(errorData);
      }
    });

    // ==============================================================
    // Code end  here
    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    time: new Date(),
  };
  res.json(serverStatus);
});
