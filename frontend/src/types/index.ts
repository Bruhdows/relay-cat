export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface Server {
  _id: string;
  name: string;
  owner: User;
  members: User[];
  channels: Channel[];
  inviteCode: string;
  icon: string;
}

export interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice';
  position: number;
}

export interface Message {
  _id: string;
  content: string;
  author: User;
  channel: string;
  channelType: 'server' | 'dm';
  server?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  lastActivity: string;
}

export interface FriendRequest {
  _id: string;
  from: User;
  createdAt: string;
}