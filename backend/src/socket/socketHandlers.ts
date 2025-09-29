import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Server from "../models/Server.js";
import DirectMessage from "../models/DirectMessage.js";
import { IUser } from "../types/index.js";

interface AuthSocket extends Socket {
    user?: IUser;
}

export const setupSocket = (io: SocketIOServer) => {
    io.use(async (socket: any, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            const user = await User.findById(decoded.userId).select(
                "-password",
            );

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", async (socket: AuthSocket) => {
        console.log(`User ${socket.user!.username} connected`);

        await User.findByIdAndUpdate(socket.user!._id, { status: "online" });

        socket.user!.servers.forEach((serverId) => {
            socket.join(`server:${serverId}`);
        });

        socket.user!.friends.forEach((friendId) => {
            socket.join(`user:${friendId}`);
        });

        socket.join(`user:${socket.user!._id}`);

        socket.broadcast.emit("userStatusUpdate", {
            userId: socket.user!._id,
            status: "online",
        });

        socket.on("sendMessage", async (data) => {
            try {
                const { content, channelId, channelType, serverId } = data;

                if (!content || content.trim().length === 0) {
                    return socket.emit("error", {
                        message: "Message content required",
                    });
                }

                if (channelType === "server") {
                    const server = await Server.findById(serverId);
                    if (!server || !server.members.includes(socket.user!._id)) {
                        return socket.emit("error", {
                            message: "Access denied",
                        });
                    }

                    const message = new Message({
                        content: content.trim(),
                        author: socket.user!._id,
                        channel: channelId,
                        channelType: "server",
                        server: serverId,
                    });

                    await message.save();

                    const populatedMessage = await Message.findById(
                        message._id,
                    ).populate("author", "username avatar");

                    io.to(`server:${serverId}`).emit(
                        "newMessage",
                        populatedMessage,
                    );
                } else if (channelType === "dm") {
                    const dm = await DirectMessage.findById(channelId);
                    if (!dm || !dm.participants.includes(socket.user!._id)) {
                        return socket.emit("error", {
                            message: "Access denied",
                        });
                    }

                    const message = new Message({
                        content: content.trim(),
                        author: socket.user!._id,
                        channel: channelId,
                        channelType: "dm",
                    });

                    await message.save();

                    dm.lastMessage = message._id;
                    dm.lastActivity = new Date();
                    await dm.save();

                    const populatedMessage = await Message.findById(
                        message._id,
                    ).populate("author", "username avatar");

                    dm.participants.forEach((participantId) => {
                        io.to(`user:${participantId}`).emit(
                            "newMessage",
                            populatedMessage,
                        );
                    });
                }
            } catch (error) {
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        socket.on("joinVoiceChannel", async (data) => {
            try {
                const { serverId, channelId } = data;

                const server = await Server.findById(serverId);
                if (!server || !server.members.includes(socket.user!._id)) {
                    return socket.emit("error", { message: "Access denied" });
                }

                const channel = server.channels.find(
                    (ch) => ch._id?.toString() === channelId,
                );
                if (!channel || channel.type !== "voice") {
                    return socket.emit("error", {
                        message: "Voice channel not found",
                    });
                }

                socket.join(`voice:${channelId}`);
                socket.to(`voice:${channelId}`).emit("userJoinedVoice", {
                    userId: socket.user!._id,
                    username: socket.user!.username,
                });

                socket.emit("joinedVoiceChannel", { channelId });
            } catch (error) {
                socket.emit("error", {
                    message: "Failed to join voice channel",
                });
            }
        });

        socket.on("leaveVoiceChannel", (data) => {
            const { channelId } = data;
            socket.leave(`voice:${channelId}`);
            socket.to(`voice:${channelId}`).emit("userLeftVoice", {
                userId: socket.user!._id,
                username: socket.user!.username,
            });
        });

        socket.on("typing", (data) => {
            const { channelId, channelType, serverId } = data;

            if (channelType === "server") {
                socket.to(`server:${serverId}`).emit("userTyping", {
                    userId: socket.user!._id,
                    username: socket.user!.username,
                    channelId,
                });
            } else if (channelType === "dm") {
                socket.to(`user:${channelId}`).emit("userTyping", {
                    userId: socket.user!._id,
                    username: socket.user!.username,
                    channelId,
                });
            }
        });

        socket.on("stopTyping", (data) => {
            const { channelId, channelType, serverId } = data;

            if (channelType === "server") {
                socket.to(`server:${serverId}`).emit("userStoppedTyping", {
                    userId: socket.user!._id,
                    channelId,
                });
            } else if (channelType === "dm") {
                socket.to(`user:${channelId}`).emit("userStoppedTyping", {
                    userId: socket.user!._id,
                    channelId,
                });
            }
        });

        socket.on("disconnect", async () => {
            console.log(`User ${socket.user!.username} disconnected`);

            await User.findByIdAndUpdate(socket.user!._id, {
                status: "offline",
            });

            socket.broadcast.emit("userStatusUpdate", {
                userId: socket.user!._id,
                status: "offline",
            });
        });
    });
};
