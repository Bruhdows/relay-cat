import express from 'express';
import Server from '../models/Server.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { generateInviteCode } from '../utils/generateToken.js';
import { Types } from 'mongoose';

const router = express.Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Server name is required' });
    }

    if (name.length > 50) {
      return res.status(400).json({ message: 'Server name too long' });
    }

    const inviteCode = generateInviteCode();

    const server = new Server({
      name: name.trim(),
      owner: req.user!._id,
      members: [req.user!._id],
      channels: [
        { name: 'general', type: 'text', position: 0 },
        { name: 'General', type: 'voice', position: 1 }
      ],
      inviteCode
    });

    await server.save();

    await User.findByIdAndUpdate(req.user!._id, {
      $push: { servers: server._id }
    });

    const populatedServer = await Server.findById(server._id)
      .populate('members', 'username avatar status')
      .populate('owner', 'username avatar');

    res.status(201).json(populatedServer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const servers = await Server.find({ members: req.user!._id })
      .populate('members', 'username avatar status')
      .populate('owner', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(servers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:serverId', authenticate, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findById(req.params.serverId)
      .populate('members', 'username avatar status')
      .populate('owner', 'username avatar');

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (!server.members.some(member => member._id.toString() === req.user!._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(server);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const server = await Server.findOne({ inviteCode });
    if (!server) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    if (server.members.includes(req.user!._id)) {
      return res.status(400).json({ message: 'Already a member of this server' });
    }

    server.members.push(req.user!._id);
    await server.save();

    await User.findByIdAndUpdate(req.user!._id, {
      $push: { servers: server._id }
    });

    const populatedServer = await Server.findById(server._id)
      .populate('members', 'username avatar status')
      .populate('owner', 'username avatar');

    res.json(populatedServer);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:serverId/channels', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Channel name and type are required' });
    }

    if (!['text', 'voice'].includes(type)) {
      return res.status(400).json({ message: 'Invalid channel type' });
    }

    const server = await Server.findById(req.params.serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.owner.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Only server owner can create channels' });
    }

    const position = server.channels.length;
    const newChannel = {
      _id: new Types.ObjectId(),
      name: name.trim(),
      type,
      position
    };

    server.channels.push(newChannel);
    await server.save();

    res.json(newChannel);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:serverId/channels/:channelId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { serverId, channelId } = req.params;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.owner.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Only server owner can delete channels' });
    }

    server.channels = server.channels.filter(
      channel => channel._id?.toString() !== channelId
    );

    await server.save();
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:serverId/leave', authenticate, async (req: AuthRequest, res) => {
  try {
    const server = await Server.findById(req.params.serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    if (server.owner.toString() === req.user!._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave server' });
    }

    server.members = server.members.filter(
      member => member.toString() !== req.user!._id.toString()
    );

    await server.save();

    await User.findByIdAndUpdate(req.user!._id, {
      $pull: { servers: server._id }
    });

    res.json({ message: 'Left server successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;