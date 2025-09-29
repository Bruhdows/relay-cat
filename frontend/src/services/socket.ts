import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: { content: string; channelId: string; channelType: string; serverId?: string }) {
    this.socket?.emit('sendMessage', data);
  }

  joinVoiceChannel(data: { serverId: string; channelId: string }) {
    this.socket?.emit('joinVoiceChannel', data);
  }

  leaveVoiceChannel(data: { channelId: string }) {
    this.socket?.emit('leaveVoiceChannel', data);
  }

  startTyping(data: { channelId: string; channelType: string; serverId?: string }) {
    this.socket?.emit('typing', data);
  }

  stopTyping(data: { channelId: string; channelType: string; serverId?: string }) {
    this.socket?.emit('stopTyping', data);
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('newMessage', callback);
  }

  onUserStatusUpdate(callback: (data: { userId: string; status: string }) => void) {
    this.socket?.on('userStatusUpdate', callback);
  }

  onUserTyping(callback: (data: { userId: string; username: string; channelId: string }) => void) {
    this.socket?.on('userTyping', callback);
  }

  onUserStoppedTyping(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('userStoppedTyping', callback);
  }

  onError(callback: (error: { message: string }) => void) {
    this.socket?.on('error', callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    this.socket?.off(event, callback);
  }
}

export default new SocketService();
