import { io, Socket } from "socket.io-client";
import { Message } from "../types";

class SocketService {
    private socket: Socket | null = null;
    private listeners = new Map<string, (...args: unknown[]) => void>();

    connect(token: string) {
        if (this.socket?.connected) return;

        this.socket = io(
            import.meta.env.VITE_SOCKET_URL || "http://localhost:3001",
            {
                auth: { token },
            },
        );

        this.socket.on("connect", () => {
            console.log("Connected to server");
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from server");
        });

        this.socket.on("connect_error", (error: Error) => {
            console.error("Connection error:", error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(data: {
        content: string;
        channelId: string;
        channelType: string;
        serverId?: string;
    }) {
        this.socket?.emit("sendMessage", data);
    }

    joinVoiceChannel(data: { serverId: string; channelId: string }) {
        this.socket?.emit("joinVoiceChannel", data);
    }

    leaveVoiceChannel(data: { channelId: string }) {
        this.socket?.emit("leaveVoiceChannel", data);
    }

    startTyping(data: {
        channelId: string;
        channelType: string;
        serverId?: string;
    }) {
        this.socket?.emit("typing", data);
    }

    stopTyping(data: {
        channelId: string;
        channelType: string;
        serverId?: string;
    }) {
        this.socket?.emit("stopTyping", data);
    }

    onUserStatusUpdate(
        callback: (data: { userId: string; status: string }) => void,
    ) {
        this.socket?.on("userStatusUpdate", callback);
    }

    onError(callback: (error: { message: string }) => void) {
        this.socket?.on("error", callback);
    }

    off(event: string) {
        const listener = this.listeners.get(event);
        if (listener) {
            this.socket?.off(event, listener);
            this.listeners.delete(event);
        }
    }

    onNewMessage(callback: (message: Message) => void) {
        const listener = (data: unknown) => callback(data as Message);
        this.listeners.set("newMessage", listener);
        this.socket?.on("newMessage", listener);
    }

    onUserTyping(
        callback: (data: {
            userId: string;
            username: string;
            channelId: string;
        }) => void,
    ) {
        const listener = (data: unknown) =>
            callback(
                data as { userId: string; username: string; channelId: string },
            );
        this.listeners.set("userTyping", listener);
        this.socket?.on("userTyping", listener);
    }

    onUserStoppedTyping(
        callback: (data: { userId: string; channelId: string }) => void,
    ) {
        const listener = (data: unknown) =>
            callback(data as { userId: string; channelId: string });
        this.listeners.set("userStoppedTyping", listener);
        this.socket?.on("userStoppedTyping", listener);
    }
}

export default new SocketService();
