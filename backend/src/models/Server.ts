import mongoose from "mongoose";
import { IServer } from "../types/index.js";

const channelSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ["text", "voice"], required: true },
    position: { type: Number, default: 0 },
});

const serverSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, maxlength: 50 },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        channels: [channelSchema],
        inviteCode: { type: String, unique: true, required: true },
        icon: { type: String, default: "" },
    },
    { timestamps: true },
);

export default mongoose.model<IServer>("Server", serverSchema);
