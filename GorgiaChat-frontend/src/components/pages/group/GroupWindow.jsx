import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ChatListPanel from "../../ChatListPanel";
import defaultInstance from "../../../api/defaultInstance";
import style from "../../../assets/css/ChatWindow.module.css";
import CreateGroupModal from "./CreateGroupModal";
import ChatMain from "../chat/ChatMain";

const GroupWindow = () => {
    const [groupList, setGroupList] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const user = useSelector(state => state.auth.user);

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

    const handleSend = async (messageData) => {
        if (!selectedGroup || !user?.id) return;
        if (!messageData.text && !messageData.image) return;
        let imageUrl = null;
        const now = Date.now();
        try {
            if (messageData.image) {
                const formData = new FormData();
                const imageBlob = await (await fetch(messageData.image)).blob();
                formData.append('image', imageBlob, messageData.imageName || 'image.jpg');
                const uploadResponse = await defaultInstance.post('/user/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadResponse.data.imageUrl;
            }
            await defaultInstance.post('/user/group/send-message', {
                groupId: selectedGroup.id,
                senderId: user.id,
                text: messageData.text || "",
                time: now,
                parentMessageId: messageData.replyTo ? messageData.replyTo.id : null,
                imageUrl
            });
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
            setInput("");
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleOpenCreateModal = () => setShowCreateModal(true);
    const handleCloseCreateModal = () => setShowCreateModal(false);

    return (
        <div style={{ display: "flex", height: "100%" }}>
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
