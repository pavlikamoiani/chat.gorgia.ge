import React, { useState, useEffect, useRef } from 'react'
import style from '../assets/css/ChatWindow.module.css'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import ChatMain from './pages/chat/ChatMain'
import ChatListPanel from './ChatListPanel'
import { useSelector } from 'react-redux'
import defaultInstance from '../api/defaultInstance'

const ChatWindow = () => {
    const user = useSelector(state => state.auth.user)

    const [input, setInput] = useState('')
    const [chatList, setChatList] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [myId, setMyId] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const socketRef = useRef(null)
    const navigate = useNavigate()

    const formatTime = date => {
        const d = new Date(date)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    useEffect(() => {
        const fetchChatContacts = async () => {
            if (!user?.id) return;

            try {
                const response = await defaultInstance.get(`/user/chat-contacts/${user.id}`);
                if (response.data.contacts) {
                    const contacts = response.data.contacts;
                    setChatList(contacts);
                    localStorage.setItem('chatList', JSON.stringify(contacts));
                }
            } catch (error) {
                console.error("Failed to fetch chat contacts:", error);
            }
        };

        fetchChatContacts();
    }, [user?.id]);

    useEffect(() => {
        socketRef.current = io('http://localhost:3000')

        socketRef.current.on('connect', () => {
            setMyId(socketRef.current.id)

            if (user?.id) {
                console.log("Registering user with socket:", user);
                socketRef.current.emit('user-connected', {
                    userId: parseInt(user.id),
                    userInfo: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            }
        })
        socketRef.current.on('receive-message', msg => {
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev
                return [
                    ...prev,
                    {
                        ...msg,
                        fromMe: msg.senderDbId === user?.id
                    }
                ]
            })

            if (msg.senderDbId === user?.id || msg.receiverDbId === user?.id) {
                const otherUserId = msg.senderDbId === user?.id ? msg.receiverDbId : msg.senderDbId;

                setChatList(prev => {
                    const existingChatIndex = prev.findIndex(chat => chat.id === otherUserId);
                    const isChatOpen = selectedChat && selectedChat.id === otherUserId;
                    if (existingChatIndex >= 0) {
                        const updatedChats = [...prev];
                        updatedChats[existingChatIndex] = {
                            ...updatedChats[existingChatIndex],
                            lastMessage: msg.text,
                            lastMessageTime: msg.time || Date.now(),
                            unread: !isChatOpen && msg.senderDbId !== user?.id
                        };
                        return updatedChats.sort((a, b) =>
                            (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
                    }

                    if (msg.senderDbId !== user?.id) {
                        defaultInstance.get(`/user/chat-contacts/${user.id}`)
                            .then(response => {
                                if (response.data.contacts) {
                                    setChatList(response.data.contacts.map(chat => ({
                                        ...chat,
                                        unread: !selectedChat || selectedChat.id !== chat.id
                                    })));
                                }
                            })
                            .catch(error => console.error("Failed to refresh chat contacts:", error));
                    }

                    return prev;
                });
            }
        })

        socketRef.current.on('online-users', (userIds) => {
            console.log('Received online users:', userIds);
            setOnlineUsers(new Set(userIds));
        });

        socketRef.current.on('user-status-change', ({ userId, isOnline }) => {
            console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (isOnline) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });

        return () => {
            console.log("Disconnecting socket");
            socketRef.current.disconnect();
        }
    }, [user?.id]);

    useEffect(() => {
        window.clearMessagesForNewChat = () => setMessages([])
        return () => { window.clearMessagesForNewChat = null }
    }, [])

    useEffect(() => {
        if (!selectedChat || !user?.id || !selectedChat.id) return
        const fetchMessages = async () => {
            try {
                const res = await defaultInstance.get(`/user/messages/${user.id}/${selectedChat.id}`)
                const msgsRaw = res.data.messages || [];
                // Build a map for fast lookup
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
                    // Добавляем URL изображения в свойство image
                    image: msg.image_url ? `http://localhost:3000${msg.image_url}` : null
                }))
                setMessages(msgs)
            } catch (err) {
                console.error("Error fetching messages:", err);
                setMessages([])
            }
        }
        fetchMessages()
    }, [selectedChat?.id, user?.id])

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
        if (!myId || !user?.id || !selectedChat?.id) return;
        if (!messageData.text && !messageData.image) return;

        const now = Date.now();
        let imageUrl = null;

        try {
            if (messageData.image) {
                const formData = new FormData();
                const imageBlob = base64ToBlob(messageData.image);
                formData.append('image', imageBlob, messageData.imageName || 'image.jpg');

                const uploadResponse = await defaultInstance.post('/user/upload-image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                imageUrl = uploadResponse.data.imageUrl;
            }

            const msg = {
                id: now,
                text: messageData.text || "",
                senderId: myId,
                senderDbId: user.id,
                receiverDbId: selectedChat.id,
                time: now,
                replyTo: messageData.replyTo ? {
                    id: messageData.replyTo.id,
                    text: messageData.replyTo.text,
                    fromMe: messageData.replyTo.fromMe
                } : null,
                parentMessageId: messageData.replyTo ? messageData.replyTo.id : null,
                image: messageData.image,
                imageUrl: imageUrl
            };

            await defaultInstance.post('/user/messages/send', {
                senderId: user.id,
                receiverId: selectedChat.id,
                text: messageData.text || "",
                time: now,
                parentMessageId: messageData.replyTo ? messageData.replyTo.id : null,
                imageUrl: imageUrl
            });

            socketRef.current.emit('send-message', msg);

            const response = await defaultInstance.get(`/user/chat-contacts/${user.id}`);
            if (response.data.contacts) {
                setChatList(response.data.contacts);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleSelectChat = chat => {
        setSelectedChat(chat)
        setChatList(prev =>
            prev.map(c =>
                c.id === chat.id ? { ...c, unread: false } : c
            )
        )
    }

    const handleForward = async (msg, targetChat) => {
        if (!msg || !targetChat || !user?.id) return;
        const now = Date.now();
        const forwardMsg = {
            id: now,
            text: msg.text,
            senderId: myId,
            senderDbId: user.id,
            receiverDbId: targetChat.id,
            time: now,
            forwarded: true,
            replyTo: msg.replyTo || null,
            parentMessageId: msg.replyTo ? msg.replyTo.id : null
        };
        try {
            await defaultInstance.post('/user/messages/send', {
                senderId: user.id,
                receiverId: targetChat.id,
                text: msg.text,
                time: now,
                parentMessageId: msg.replyTo ? msg.replyTo.id : null,
                forwarded: true
            });
        } catch (err) {
            console.error("Failed to forward message:", err);
        }
        socketRef.current.emit('send-message', forwardMsg);
    }

    const chatListWithStatus = chatList.map(chat => ({
        ...chat,
        isOnline: onlineUsers.has(chat.id)
    }));

    const selectedChatWithStatus = selectedChat ? {
        ...selectedChat,
        isOnline: onlineUsers.has(selectedChat.id)
    } : null;

    return (
        <>
            <ChatListPanel
                style={style}
                chatList={chatListWithStatus}
                selectedChat={selectedChatWithStatus || {}}
                setSelectedChat={handleSelectChat}
                setChatList={setChatList}
            />
            {selectedChat ? (
                <ChatMain
                    style={style}
                    selectedChat={selectedChatWithStatus}
                    input={input}
                    setInput={setInput}
                    messages={messages}
                    onSend={handleSend}
                    chatList={chatListWithStatus}
                    onForward={handleForward}
                />
            ) : (
                <div className={style.chatMain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '1.3rem' }}>
                        აირჩიერთ ჩათი.
                    </div>
                </div>
            )}
        </>
    )
}

export default ChatWindow