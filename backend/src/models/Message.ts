import mongoose from "mongoose";
import { IMessage } from "../types/index.js";

const messageSchema = new mongoose.Schema(
    {
        content: { type: String, required: true, maxlength: 2000 },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        channel: { type: mongoose.Schema.Types.ObjectId, required: true },
        channelType: { type: String, enum: ["server", "dm"], required: true },
        server: { type: mongoose.Schema.Types.ObjectId, ref: "Server" },
        edited: { type: Boolean, default: false },
        editedAt: { type: Date },
    },
    { timestamps: true },
);

export default mongoose.model<IMessage>("Message", messageSchema);
