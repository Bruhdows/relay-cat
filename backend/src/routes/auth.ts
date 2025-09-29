import express from "express";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { authenticate } from "../middleware/auth.js";
import { AuthRequest } from "../types/index.js";
import validator from "validator";

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = new User({ username, email, password });
        await user.save();

        const token = generateToken(user._id.toString());

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        await User.findByIdAndUpdate(user._id, { status: "online" });

        const token = generateToken(user._id.toString());

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: "online",
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/logout", authenticate, async (req: AuthRequest, res) => {
    try {
        await User.findByIdAndUpdate(req.user!._id, { status: "offline" });
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user!._id)
            .select("-password")
            .populate("friends", "username avatar status")
            .populate("servers", "name icon");

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/status", authenticate, async (req: AuthRequest, res) => {
    try {
        const { status } = req.body;

        if (!["online", "away", "busy", "offline"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const user = await User.findByIdAndUpdate(
            req.user!._id,
            { status },
            { new: true },
        ).select("-password");

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
