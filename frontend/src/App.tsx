import React, { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { Server, User, DirectMessage, FriendRequest } from "./types";
import * as api from "./services/api";
import socketService from "./services/socket";
import "./App.css";

const AppContent: React.FC = () => {
    const { state } = useAuth();
    const [servers, setServers] = useState<Server[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [selectedDM, setSelectedDM] = useState<DirectMessage | null>(null);
    const [loadingServers, setLoadingServers] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (state.user && state.token) {
            socketService.connect(state.token);
            loadData();
        } else {
            socketService.disconnect();
        }

        return () => {
            socketService.disconnect();
        };
    }, [state.user, state.token]);

    const loadData = async () => {
        try {
            setLoadingServers(true);
            const [serversData, friendsData, dmsData] = await Promise.all([
                api.getServers(),
                api.getFriends(),
                api.getDirectMessages(),
            ]);
            setServers(serversData);
            setFriends(friendsData.friends);
            setFriendRequests(friendsData.friendRequests || []);
            setDirectMessages(dmsData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoadingServers(false);
        }
    };

    const handleCreateServer = async () => {
        const name = prompt("Enter server name:");
        if (name?.trim()) {
            try {
                const newServer = await api.createServer(name.trim());
                setServers((prev) => [...prev, newServer]);
            } catch (error) {
                console.error("Error creating server:", error);
            }
        }
    };

    const handleJoinServer = async () => {
        const inviteCode = prompt("Enter invite code:");
        if (inviteCode?.trim()) {
            try {
                const server = await api.joinServer(inviteCode.trim());
                setServers((prev) => [...prev, server]);
            } catch (error) {
                console.error("Error joining server:", error);
                alert("Invalid invite code");
            }
        }
    };

    const handleGetInviteLink = async (serverId: string) => {
        try {
            const result = await api.getInviteLink(serverId);
            await navigator.clipboard.writeText(result.inviteLink);
            alert("Invite link copied to clipboard");
        } catch (error) {
            console.error("Error fetching invite link:", error);
            alert("Could not get invite link");
        }
    };

    const handleServerSelect = (server: Server) => {
        setSelectedServer(server);
        setSelectedDM(null);
        if (server.channels.length > 0) {
            setSelectedChannel(server.channels[0]._id);
        } else {
            setSelectedChannel(null);
        }
    };

    const handleChannelSelect = (channelId: string) => {
        setSelectedChannel(channelId);
        setSelectedDM(null);
    };

    const handleDMSelect = (dm: DirectMessage) => {
        setSelectedDM(dm);
        setSelectedServer(null);
        setSelectedChannel(null);
    };

    const handleCreateOrOpenDM = async (friendId: string) => {
        try {
            const existingDM = directMessages.find((dm) => {
                return dm.participants.some((p) => p._id === friendId);
            });

            if (existingDM) {
                handleDMSelect(existingDM);
            } else {
                const newDM = await api.createDirectMessage(friendId);
                setDirectMessages((prev) => [...prev, newDM]);
                handleDMSelect(newDM);
            }
        } catch (error) {
            console.error("Error creating/opening DM:", error);
            alert("Failed to open direct message");
        }
    };

    const handleSendFriendRequest = async (username: string) => {
        if (!username.trim()) return;
        try {
            await api.sendFriendRequest(username.trim());
            await loadData();
            alert("Friend request sent");
        } catch (error) {
            console.error("Error sending friend request:", error);
            alert("Failed to send friend request");
        }
    };

    const handleAcceptFriendRequest = async (requestId: string) => {
        try {
            await api.acceptFriendRequest(requestId);
            await loadData();
        } catch (error) {
            console.error("Error accepting friend request:", error);
            alert("Failed to accept request");
        }
    };

    const handleRejectFriendRequest = async (requestId: string) => {
        try {
            await api.rejectFriendRequest(requestId);
            await loadData();
        } catch (error) {
            console.error("Error rejecting friend request:", error);
            alert("Failed to reject request");
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        try {
            await api.removeFriend(friendId);
            await loadData();
        } catch (error) {
            console.error("Error removing friend:", error);
            alert("Failed to remove friend");
        }
    };

    if (!state.user) {
        return <Login />;
    }

    return (
        <div className="app kitty-theme">
            <Sidebar
                servers={servers}
                friends={friends}
                friendRequests={friendRequests}
                directMessages={directMessages}
                selectedServer={selectedServer}
                selectedChannel={selectedChannel}
                selectedDM={selectedDM}
                onServerSelect={handleServerSelect}
                onChannelSelect={handleChannelSelect}
                onDMSelect={handleDMSelect}
                onCreateOrOpenDM={handleCreateOrOpenDM}
                onCreateServer={handleCreateServer}
                onJoinServer={handleJoinServer}
                onGetInviteLink={handleGetInviteLink}
                onSendFriendRequest={handleSendFriendRequest}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                onRejectFriendRequest={handleRejectFriendRequest}
                onRemoveFriend={handleRemoveFriend}
                loadingServers={loadingServers}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <Chat
                selectedServer={selectedServer}
                selectedChannel={selectedChannel}
                selectedDM={selectedDM}
            />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
