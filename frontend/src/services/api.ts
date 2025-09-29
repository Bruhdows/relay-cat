import axios from "axios";
import {
    User,
    Server,
    Message,
    DirectMessage,
    FriendRequest,
    Channel,
} from "../types";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const login = async (
    email: string,
    password: string,
): Promise<{ user: User; token: string }> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
};

export const register = async (
    username: string,
    email: string,
    password: string,
): Promise<{ user: User; token: string }> => {
    const response = await api.post("/auth/register", {
        username,
        email,
        password,
    });
    return response.data;
};

export const logout = async (): Promise<void> => {
    await api.post("/auth/logout");
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
};

export const updateStatus = async (status: string): Promise<User> => {
    const response = await api.put("/auth/status", { status });
    return response.data;
};

export const getFriends = async (): Promise<{
    friends: User[];
    friendRequests: FriendRequest[];
}> => {
    const response = await api.get("/friends");
    return response.data;
};

export const sendFriendRequest = async (username: string): Promise<void> => {
    await api.post("/friends/request", { username });
};

export const acceptFriendRequest = async (
    requestId: string,
): Promise<{ friends: User[]; friendRequests: FriendRequest[] }> => {
    const response = await api.post("/friends/accept", { requestId });
    return response.data;
};

export const rejectFriendRequest = async (requestId: string): Promise<void> => {
    await api.delete("/friends/reject", { data: { requestId } });
};

export const removeFriend = async (friendId: string): Promise<void> => {
    await api.delete(`/friends/${friendId}`);
};

export const getServers = async (): Promise<Server[]> => {
    const response = await api.get("/servers");
    return response.data;
};

export const createServer = async (name: string): Promise<Server> => {
    const response = await api.post("/servers", { name });
    return response.data;
};

export const joinServer = async (inviteCode: string): Promise<Server> => {
    const response = await api.post("/servers/join", { inviteCode });
    return response.data;
};

export const leaveServer = async (serverId: string): Promise<void> => {
    await api.delete(`/servers/${serverId}/leave`);
};

export const createChannel = async (
    serverId: string,
    name: string,
    type: string,
): Promise<Channel> => {
    const response = await api.post(`/servers/${serverId}/channels`, {
        name,
        type,
    });
    return response.data;
};

export const getMessages = async (
    channelId: string,
    channelType: string,
    serverId?: string,
): Promise<Message[]> => {
    const url =
        channelType === "server"
            ? `/messages/server/${serverId}/${channelId}`
            : `/messages/dm/${channelId}`;
    const response = await api.get(url);
    return response.data;
};

export const getDirectMessages = async (): Promise<DirectMessage[]> => {
    const response = await api.get("/messages/dm");
    return response.data;
};

export const sendDirectMessage = async (
    friendId: string,
    content: string,
): Promise<Message> => {
    const response = await api.post(`/messages/dm/${friendId}`, { content });
    return response.data;
};
