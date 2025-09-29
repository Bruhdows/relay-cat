import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

directMessageSchema.index({ participants: 1 });

export default mongoose.model('DirectMessage', directMessageSchema);