import { Request } from "express";
import { Document, Types } from "mongoose";

export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password: string;
    avatar: string;
    status: "online" | "away" | "busy" | "offline";
    friends: Types.ObjectId[];
    friendRequests: Array<{
        from: Types.ObjectId;
        createdAt: Date;
        _id?: Types.ObjectId;
    }>;
    servers: Types.ObjectId[];
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthRequest extends Request {
    user?: IUser;
}

export interface IServer extends Document {
    _id: Types.ObjectId;
    name: string;
    owner: Types.ObjectId;
    members: Types.ObjectId[];
    channels: Array<{
        _id?: Types.ObjectId;
        name: string;
        type: "text" | "voice";
        position: number;
    }>;
    inviteCode: string;
    icon: string;
}

export interface IMessage extends Document {
    _id: Types.ObjectId;
    content: string;
    author: Types.ObjectId;
    channel: Types.ObjectId;
    channelType: "server" | "dm";
    server?: Types.ObjectId;
    edited: boolean;
    editedAt?: Date;
}

export interface IDirectMessage extends Document {
    _id: Types.ObjectId;
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    lastActivity: Date;
}
