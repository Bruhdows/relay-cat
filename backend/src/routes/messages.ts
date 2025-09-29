// src/routes/messages.ts
import express from "express";
import Message from "../models/Message.js";
import DirectMessage from "../models/DirectMessage.js";
import Server from "../models/Server.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { AuthRequest } from "../types/index.js";
import { Types } from "mongoose";

const router = express.Router();

router.get(
    "/server/:serverId/:channelId",
    authenticate,
    async (req: AuthRequest, res) => {
        try {
            const { serverId, channelId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const server = await Server.findById(serverId);
            if (!server || !server.members.includes(req.user!._id)) {
                return res.status(403).json({ message: "Access denied" });
            }

            const channel = server.channels.find(
                (ch) => ch._id?.toString() === channelId,
            );
            if (!channel) {
                return res.status(404).json({ message: "Channel not found" });
            }

            const messages = await Message.find({
                channel: channelId,
                channelType: "server",
            })
                .populate("author", "username avatar")
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip((Number(page) - 1) * Number(limit));

            res.json(messages.reverse());
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    },
);

router.get("/dm/:dmId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { dmId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const dm = await DirectMessage.findById(dmId);
        if (!dm || !dm.participants.includes(req.user!._id)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const messages = await Message.find({
            channel: dmId,
            channelType: "dm",
        })
            .populate("author", "username avatar")
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post(
    "/server/:serverId/:channelId",
    authenticate,
    async (req: AuthRequest, res) => {
        try {
            const { serverId, channelId } = req.params;
            const { content } = req.body;

            if (!content || content.trim().length === 0) {
                return res
                    .status(400)
                    .json({ message: "Message content is required" });
            }

            if (content.length > 2000) {
                return res.status(400).json({ message: "Message too long" });
            }

            const server = await Server.findById(serverId);
            if (!server || !server.members.includes(req.user!._id)) {
                return res.status(403).json({ message: "Access denied" });
            }

            const channel = server.channels.find(
                (ch) => ch._id?.toString() === channelId,
            );
            if (!channel) {
                return res.status(404).json({ message: "Channel not found" });
            }

            const message = new Message({
                content: content.trim(),
                author: req.user!._id,
                channel: channelId,
                channelType: "server",
                server: serverId,
            });

            await message.save();

            const populatedMessage = await Message.findById(
                message._id,
            ).populate("author", "username avatar");

            res.status(201).json(populatedMessage);
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    },
);

router.get("/dm", authenticate, async (req: AuthRequest, res) => {
    try {
        const dms = await DirectMessage.find({
            participants: req.user!._id,
        })
            .populate("participants", "username avatar status")
            .populate("lastMessage")
            .sort({ lastActivity: -1 });

        res.json(dms);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/dm/:friendId", authenticate, async (req: AuthRequest, res) => {
    try {
        const { friendId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "Message content is required" });
        }

        const friend = await User.findById(friendId);
        if (
            !friend ||
            !req.user!.friends.includes(new Types.ObjectId(friendId))
        ) {
            return res
                .status(403)
                .json({ message: "Can only message friends" });
        }

        let dm = await DirectMessage.findOne({
            participants: { $all: [req.user!._id, friendId], $size: 2 },
        });

        if (!dm) {
            dm = new DirectMessage({
                participants: [req.user!._id, friendId],
            });
            await dm.save();
        }

        const message = new Message({
            content: content.trim(),
            author: req.user!._id,
            channel: dm._id,
            channelType: "dm",
        });

        await message.save();

        dm.lastMessage = message._id;
        dm.lastActivity = new Date();
        await dm.save();

        const populatedMessage = await Message.findById(message._id).populate(
            "author",
            "username avatar",
        );

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
