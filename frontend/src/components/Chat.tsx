import React, { useState, useEffect, useRef } from "react";
import { Message, Server, DirectMessage } from "../types";
import { useAuth } from "../hooks/useAuth";
import * as api from "../services/api";
import socketService from "../services/socket";

interface ChatProps {
    selectedServer: Server | null;
    selectedChannel: string | null;
    selectedDM: DirectMessage | null;
}

const Chat: React.FC<ChatProps> = ({
    selectedServer,
    selectedChannel,
    selectedDM,
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const { state } = useAuth();

    useEffect(() => {
        const loadMessages = async () => {
            if (!selectedChannel && !selectedDM) return;

            setLoading(true);
            try {
                let fetchedMessages: Message[] = [];

                if (selectedServer && selectedChannel) {
                    fetchedMessages = await api.getMessages(
                        selectedChannel,
                        "server",
                        selectedServer._id,
                    );
                } else if (selectedDM) {
                    fetchedMessages = await api.getMessages(
                        selectedDM._id,
                        "dm",
                    );
                }

                setMessages(fetchedMessages);
            } catch (error) {
                console.error("Error loading messages:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, [selectedServer, selectedChannel, selectedDM]);

    useEffect(() => {
        const handleNewMessage = (message: Message) => {
            const isRelevantMessage =
                (selectedServer &&
                    message.server === selectedServer._id &&
                    message.channel === selectedChannel) ||
                (selectedDM &&
                    message.channel === selectedDM._id &&
                    message.channelType === "dm");

            if (isRelevantMessage) {
                setMessages((prev) => {
                    const messageExists = prev.some(
                        (m) => m._id === message._id,
                    );
                    if (messageExists) {
                        return prev;
                    }
                    return [...prev, message];
                });
            }
        };

        const handleUserTyping = (data: {
            userId: string;
            username: string;
            channelId: string;
        }) => {
            if (
                data.userId !== state.user?._id &&
                data.channelId === (selectedChannel || selectedDM?._id)
            ) {
                setTypingUsers((prev) => [
                    ...prev.filter((u) => u !== data.username),
                    data.username,
                ]);
                setTimeout(() => {
                    setTypingUsers((prev) =>
                        prev.filter((u) => u !== data.username),
                    );
                }, 3000);
            }
        };

        const handleUserStoppedTyping = (data: {
            userId: string;
            channelId: string;
        }) => {
            setTypingUsers((prev) => prev.filter((u) => u !== data.userId));
        };

        socketService.onNewMessage(handleNewMessage);
        socketService.onUserTyping(handleUserTyping);
        socketService.onUserStoppedTyping(handleUserStoppedTyping);

        return () => {
            socketService.off("newMessage");
            socketService.off("userTyping");
            socketService.off("userStoppedTyping");
        };
    }, [selectedServer, selectedChannel, selectedDM, state.user?._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            content: newMessage.trim(),
            channelId: selectedChannel || selectedDM?._id || "",
            channelType: selectedServer ? "server" : "dm",
            ...(selectedServer && { serverId: selectedServer._id }),
        };

        socketService.sendMessage(messageData);
        setNewMessage("");

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            socketService.stopTyping(messageData);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        const messageData = {
            channelId: selectedChannel || selectedDM?._id || "",
            channelType: selectedServer ? "server" : "dm",
            ...(selectedServer && { serverId: selectedServer._id }),
        };

        socketService.startTyping(messageData);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socketService.stopTyping(messageData);
        }, 1000);
    };

    if (!selectedChannel && !selectedDM) {
        return (
            <div className="chat-empty">
                <h2>Select a channel or friend to start chatting</h2>
            </div>
        );
    }

    const chatTitle = selectedServer
        ? `# ${selectedServer.channels.find((c) => c._id === selectedChannel)?.name || "Unknown"}`
        : selectedDM?.participants.find((p) => p._id !== state.user?._id)
              ?.username || "Direct Message";

    return (
        <div className="chat">
            <div className="chat-header">
                <h2>{chatTitle}</h2>
            </div>

            <div className="messages-container">
                {loading ? (
                    <div className="loading">Loading messages...</div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <div key={message._id} className="message">
                                <div className="message-avatar">
                                    {message.author.username
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                                <div className="message-content">
                                    <div className="message-header">
                                        <span className="message-author">
                                            {message.author.username}
                                        </span>
                                        <span className="message-time">
                                            {new Date(
                                                message.createdAt,
                                            ).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="message-text">
                                        {message.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {typingUsers.length > 0 && (
                            <div className="typing-indicator">
                                {typingUsers.join(", ")}{" "}
                                {typingUsers.length === 1 ? "is" : "are"}{" "}
                                typing...
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder={`Message ${chatTitle}`}
                    maxLength={2000}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
