import express from "express";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { AuthRequest } from "../types/index.js";

const router = express.Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await User.findById(req.user!._id)
            .populate("friends", "username avatar status")
            .populate("friendRequests.from", "username avatar");

        res.json({
            friends: user!.friends,
            friendRequests: user!.friendRequests,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/request", authenticate, async (req: AuthRequest, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const targetUser = await User.findOne({ username });
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (targetUser._id.toString() === req.user!._id.toString()) {
            return res
                .status(400)
                .json({ message: "Cannot add yourself as friend" });
        }

        if (targetUser.friends.includes(req.user!._id)) {
            return res.status(400).json({ message: "Already friends" });
        }

        const existingRequest = targetUser.friendRequests.find(
            (request) => request.from.toString() === req.user!._id.toString(),
        );

        if (existingRequest) {
            return res
                .status(400)
                .json({ message: "Friend request already sent" });
        }

        targetUser.friendRequests.push({
            from: req.user!._id,
            createdAt: new Date(),
        });
        await targetUser.save();

        res.json({ message: "Friend request sent" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/accept", authenticate, async (req: AuthRequest, res) => {
    try {
        const { requestId } = req.body;

        const user = await User.findById(req.user!._id);
        const requestIndex = user!.friendRequests.findIndex(
            (request) => request._id?.toString() === requestId,
        );

        if (requestIndex === -1) {
            return res
                .status(404)
                .json({ message: "Friend request not found" });
        }

        const friendId = user!.friendRequests[requestIndex].from;

        user!.friends.push(friendId);
        user!.friendRequests.splice(requestIndex, 1);
        await user!.save();

        await User.findByIdAndUpdate(friendId, {
            $push: { friends: req.user!._id },
        });

        const updatedUser = await User.findById(req.user!._id)
            .populate("friends", "username avatar status")
            .populate("friendRequests.from", "username avatar");

        res.json({
            friends: updatedUser!.friends,
            friendRequests: updatedUser!.friendRequests,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/reject", authenticate, async (req: AuthRequest, res) => {
    try {
        const { requestId } = req.body;

        await User.findByIdAndUpdate(req.user!._id, {
            $pull: { friendRequests: { _id: requestId } },
        });

        res.json({ message: "Friend request rejected" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.delete("/:friendId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { friendId } = req.params;

        await User.findByIdAndUpdate(req.user!._id, {
            $pull: { friends: friendId },
        });

        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: req.user!._id },
        });

        res.json({ message: "Friend removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
