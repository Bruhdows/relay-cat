import React, { useState } from "react";
import { Server, User, DirectMessage } from "../types";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
    servers: Server[];
    friends: User[];
    directMessages: DirectMessage[];
    selectedServer: Server | null;
    selectedChannel: string | null;
    selectedDM: DirectMessage | null;
    onServerSelect: (server: Server) => void;
    onChannelSelect: (channelId: string) => void;
    onDMSelect: (dm: DirectMessage) => void;
    onCreateServer: () => void;
    onJoinServer: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    servers,
    friends,
    directMessages,
    selectedServer,
    selectedChannel,
    selectedDM,
    onServerSelect,
    onChannelSelect,
    onDMSelect,
    onCreateServer,
    onJoinServer,
}) => {
    const [activeTab, setActiveTab] = useState<"servers" | "friends">(
        "servers",
    );
    const { state, logout } = useAuth();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="user-info">
                    <div className="user-avatar">
                        {state.user?.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <div className="username">{state.user?.username}</div>
                        <div className={`status ${state.user?.status}`}>
                            {state.user?.status}
                        </div>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>

            <div className="sidebar-tabs">
                <button
                    className={activeTab === "servers" ? "active" : ""}
                    onClick={() => setActiveTab("servers")}
                >
                    Servers
                </button>
                <button
                    className={activeTab === "friends" ? "active" : ""}
                    onClick={() => setActiveTab("friends")}
                >
                    Friends
                </button>
            </div>

            {activeTab === "servers" ? (
                <div className="servers-list">
                    <div className="section-header">
                        <span>Servers</span>
                        <div className="server-actions">
                            <button
                                onClick={onCreateServer}
                                title="Create Server"
                            >
                                +
                            </button>
                            <button onClick={onJoinServer} title="Join Server">
                                📥
                            </button>
                        </div>
                    </div>

                    {servers.map((server) => (
                        <div
                            key={server._id}
                            className={`server-item ${selectedServer?._id === server._id ? "active" : ""}`}
                            onClick={() => onServerSelect(server)}
                        >
                            <div className="server-icon">
                                {server.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="server-name">{server.name}</span>
                        </div>
                    ))}

                    {selectedServer && (
                        <div className="channels-list">
                            <div className="section-header">Channels</div>
                            {selectedServer.channels
                                .sort((a, b) => a.position - b.position)
                                .map((channel) => (
                                    <div
                                        key={channel._id}
                                        className={`channel-item ${selectedChannel === channel._id ? "active" : ""}`}
                                        onClick={() =>
                                            onChannelSelect(channel._id)
                                        }
                                    >
                                        <span className="channel-icon">
                                            {channel.type === "text"
                                                ? "#"
                                                : "🔊"}
                                        </span>
                                        <span className="channel-name">
                                            {channel.name}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="friends-list">
                    <div className="section-header">Direct Messages</div>
                    {directMessages.map((dm) => {
                        const friend = dm.participants.find(
                            (p) => p.id !== state.user?.id,
                        );
                        return (
                            <div
                                key={dm._id}
                                className={`dm-item ${selectedDM?._id === dm._id ? "active" : ""}`}
                                onClick={() => onDMSelect(dm)}
                            >
                                <div className="friend-avatar">
                                    {friend?.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="friend-name">
                                    {friend?.username}
                                </span>
                                <div
                                    className={`friend-status ${friend?.status}`}
                                ></div>
                            </div>
                        );
                    })}

                    <div className="section-header">All Friends</div>
                    {friends.map((friend) => (
                        <div key={friend.id} className="friend-item">
                            <div className="friend-avatar">
                                {friend.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="friend-name">
                                {friend.username}
                            </span>
                            <div
                                className={`friend-status ${friend.status}`}
                            ></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
