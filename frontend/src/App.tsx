import React, { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import { Server, User, DirectMessage } from "./types";
import * as api from "./services/api";
import socketService from "./services/socket";
import "./App.css";

const AppContent: React.FC = () => {
    const { state } = useAuth();
    const [servers, setServers] = useState<Server[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [selectedDM, setSelectedDM] = useState<DirectMessage | null>(null);

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
            const [serversData, friendsData, dmsData] = await Promise.all([
                api.getServers(),
                api.getFriends(),
                api.getDirectMessages(),
            ]);

            setServers(serversData);
            setFriends(friendsData.friends);
            setDirectMessages(dmsData);
        } catch (error) {
            console.error("Error loading data:", error);
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

    const handleServerSelect = (server: Server) => {
        setSelectedServer(server);
        setSelectedDM(null);
        if (server.channels.length > 0) {
            setSelectedChannel(server.channels[0]._id);
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

    if (!state.user) {
        return <Login />;
    }

    return (
        <div className="app">
            <Sidebar
                servers={servers}
                friends={friends}
                directMessages={directMessages}
                selectedServer={selectedServer}
                selectedChannel={selectedChannel}
                selectedDM={selectedDM}
                onServerSelect={handleServerSelect}
                onChannelSelect={handleChannelSelect}
                onDMSelect={handleDMSelect}
                onCreateServer={handleCreateServer}
                onJoinServer={handleJoinServer}
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
