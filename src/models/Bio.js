import mongoose from "mongoose";

const BioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    username: { type: String, required: true, unique: true },
    title: String,
    description: String,
    avatar: String,
    theme: { type:String, default: 'default' },
    components: [{
        id: String,
        type: String,
        order: Number,
        content: mongoose.Schema.Types.Mixed,
        styles: mongoose.Schema.Types.Mixed
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Bio || mongoose.model("Bio", BioSchema);