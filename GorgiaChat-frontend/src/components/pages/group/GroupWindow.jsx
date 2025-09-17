import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import ChatListPanel from "../../ChatListPanel";
import defaultInstance from "../../../api/defaultInstance";
import style from "../../../assets/css/ChatWindow.module.css";
import CreateGroupModal from "./CreateGroupModal";
import ChatMain from "../chat/ChatMain";
import { io } from "socket.io-client";

const GroupWindow = () => {
    const [groupList, setGroupList] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const user = useSelector(state => state.auth.user);
    const socketRef = useRef(null);
    const selectedGroupRef = useRef(null);

    useEffect(() => {
        selectedGroupRef.current = selectedGroup;
    }, [selectedGroup]);

    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        socketRef.current.on('connect', () => {
            if (user?.id) {
                socketRef.current.emit('user-connected', {
                    userId: parseInt(user.id),
                    userInfo: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            }
        });

        socketRef.current.on('receive-group-message', (msg) => {
            const currentGroup = selectedGroupRef.current;
            if (!currentGroup || msg.groupId !== currentGroup.id) return;
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [
                    ...prev,
                    {
                        id: msg.id,
                        text: msg.text,
                        senderId: msg.senderId,
                        time: msg.time,
                        fromMe: msg.senderId === user?.id,
                        replyTo: msg.replyTo || null,
                        image: msg.imageUrl ? `http://localhost:3000${msg.imageUrl}` : null
                    }
                ];
            });
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [user?.id]);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await defaultInstance.get("/user/group/list", {
                    params: { userId: user?.id }
                });
                setGroupList(res.data.groups || []);
            } catch {
                setGroupList([]);
            }
        };
        fetchGroups();
    }, [user?.id, showCreateModal]);

    useEffect(() => {
        if (!selectedGroup) return;
        setMessages([]); // Очищаем сообщения при смене группы
        const fetchMessages = async () => {
            try {
                const res = await defaultInstance.get(`/user/group/messages/${selectedGroup.id}`);
                const msgsRaw = res.data.messages || [];
                const msgMap = {};
                msgsRaw.forEach(msg => { msgMap[msg.id] = msg; });
                const msgs = msgsRaw.map(msg => ({
                    id: msg.id,
                    text: msg.text,
                    senderId: msg.sender_id,
                    time: msg.time,
                    fromMe: msg.sender_id === user.id,
                    replyTo: msg.parent_message_id ? {
                        id: msg.parent_message_id,
                        text: msgMap[msg.parent_message_id]?.text || '',
                        fromMe: msgMap[msg.parent_message_id]?.sender_id === user.id
                    } : null,
                    image: msg.image_url ? `http://localhost:3000${msg.image_url}` : null
                }));
                setMessages(msgs);
            } catch {
                setMessages([]);
            }
        };
        fetchMessages();
    }, [selectedGroup, user?.id]);

    const base64ToBlob = (base64String, contentType) => {
        const byteCharacters = atob(base64String.split(',')[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType || 'image/jpeg' });
    };

    const handleSend = async (messageData) => {
        if (!selectedGroup || !user?.id) return;
        if (!messageData.text && !messageData.image) return;
        let imageUrl = null;
        const now = Date.now();
        try {
            if (messageData.image) {
                const formData = new FormData();
                const imageBlob = base64ToBlob(messageData.image);
                formData.append('image', imageBlob, messageData.imageName || 'image.jpg');
                const uploadResponse = await defaultInstance.post('/user/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadResponse.data.imageUrl;
            }
            // Сохраняем в базу (для истории)
            await defaultInstance.post('/user/group/send-message', {
                groupId: selectedGroup.id,
                senderId: user.id,
                text: messageData.text || "",
                time: now,
                parentMessageId: messageData.replyTo ? messageData.replyTo.id : null,
                imageUrl
            });

            // Отправляем live сообщение через socket.io
            socketRef.current.emit('send-group-message', {
                id: now,
                groupId: selectedGroup.id,
                text: messageData.text || "",
                senderId: user.id,
                time: now,
                replyTo: messageData.replyTo ? {
                    id: messageData.replyTo.id,
                    text: messageData.replyTo.text,
                    fromMe: messageData.replyTo.fromMe
                } : null,
                parentMessageId: messageData.replyTo ? messageData.replyTo.id : null,
                imageUrl: imageUrl
            });

            setMessages(prev => [
                ...prev,
                {
                    id: now,
                    text: messageData.text || "",
                    senderId: user.id,
                    time: now,
                    fromMe: true,
                    replyTo: messageData.replyTo ? {
                        id: messageData.replyTo.id,
                        text: messageData.replyTo.text,
                        fromMe: messageData.replyTo.fromMe
                    } : null,
                    image: imageUrl ? `http://localhost:3000${imageUrl}` : null
                }
            ]);
            setInput("");
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleOpenCreateModal = () => setShowCreateModal(true);
    const handleCloseCreateModal = () => setShowCreateModal(false);

    return (
        <div style={{ display: "flex", height: "100%", width: "100%" }}>
            <ChatListPanel
                style={style}
                chatList={groupList}
                selectedChat={selectedGroup}
                setSelectedChat={setSelectedGroup}
                setChatList={setGroupList}
                isGroupList={true}
                onNewGroup={handleOpenCreateModal}
            />
            {selectedGroup ? (
                <ChatMain
                    style={style}
                    selectedChat={selectedGroup}
                    input={input}
                    setInput={setInput}
                    messages={messages}
                    onSend={handleSend}
                    chatList={groupList}
                    onForward={() => { }}
                />
            ) : (
                <div className={style.chatMain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '1.3rem' }}>
                        Select a group.
                    </div>
                </div>
            )}
            {showCreateModal && (
                <CreateGroupModal onClose={handleCloseCreateModal} />
            )}
        </div>
    );
};

export default GroupWindow;
