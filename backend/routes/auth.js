const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../config");

const router = express.Router();

// Signup (register + return token)
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // --- Username validation ---
    const usernameValid = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{4,9}$/.test(username);
    if (!usernameValid) {
      return res
        .status(400)
        .json({ error: "Username must be 4-9 characters, letters or letters+numbers" });
    }

    // --- Email validation ---
    if (role === "hr-admin") {
      if (!/^[a-zA-Z0-9._%+-]+@mmc\.com$/.test(email)) {
        return res.status(400).json({ error: "HR email must end with @mmc.com" });
      }
    } else if (role === "candidate") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid candidate email format" });
      }
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    // --- Password validation ---
    const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{5,9}$/.test(password);
    if (!passwordValid) {
      return res.status(400).json({
        error: "Password must be 5-9 characters, include letters, numbers, and special characters"
      });
    }

    // --- Check duplicate ---
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // --- Save new user ---
    const hashedPass = await bcrypt.hash(password, 10);
    user = new User({ username, email, password: hashedPass, role });
    await user.save();

    // --- Create JWT (with email inside) ---
    const token = jwt.sign(
      {
        user: {
          id: user._id,
          role: user.role,
          username: user.username,
          email: user.email
        }
      },
      jwtSecret,
      { expiresIn: "1d" }
    );

    res.json({
      message: "User registered successfully",
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validate email ---
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // --- Validate password format ---
    const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/.test(password);
    if (!passwordValid) {
      return res.status(400).json({ error: "Invalid password format" });
    }

    // --- Check if user exists ---
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // --- Create JWT (with email inside) ---
    const token = jwt.sign(
      {
        user: {
          id: user._id,
          role: user.role,
          username: user.username,
          email: user.email
        }
      },
      jwtSecret,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
