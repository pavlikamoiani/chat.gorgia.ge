import React, { useState, useEffect, useRef } from 'react'
import style from '../assets/css/ChatWindow.module.css'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import Sidebar, { sidebarIcons } from './Sidebar'
import ChatMain from './pages/chat/ChatMain'
import ChatListPanel from './ChatListPanel'
import logo from '/logo.jpg'
import { useSelector } from 'react-redux'
import defaultInstance from '../api/defaultInstance'

const ChatWindow = () => {
    const user = useSelector(state => state.auth.user)

    const [input, setInput] = useState('')
    const [chatList, setChatList] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [activeSidebar, setActiveSidebar] = useState(0)
    const [messages, setMessages] = useState([])
    const [myId, setMyId] = useState(null)
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
                    setChatList(response.data.contacts);
                    // if (response.data.contacts.length > 0) {
                    //     setSelectedChat(response.data.contacts[0]);
                    // }
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
                            unread: !isChatOpen && msg.senderDbId !== user?.id // mark unread if not open and not from me
                        };
                        return updatedChats.sort((a, b) =>
                            (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
                    }

                    if (msg.senderDbId !== user?.id) {
                        defaultInstance.get(`/user/chat-contacts/${user.id}`)
                            .then(response => {
                                if (response.data.contacts) {
                                    // Add unread property for new chats
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
        return () => {
            socketRef.current.disconnect()
        }
    }, [user?.id, selectedChat?.id]);

    useEffect(() => {
        window.clearMessagesForNewChat = () => setMessages([])
        return () => { window.clearMessagesForNewChat = null }
    }, [])

    useEffect(() => {
        if (!selectedChat || !user?.id || !selectedChat.id) return
        const fetchMessages = async () => {
            try {
                const res = await defaultInstance.get(`/user/messages/${user.id}/${selectedChat.id}`)
                const msgs = (res.data.messages || []).map(msg => ({
                    id: msg.id,
                    text: msg.text,
                    senderId: msg.sender_id,
                    time: msg.time,
                    fromMe: msg.sender_id === user.id
                }))
                setMessages(msgs)
            } catch (err) {
                setMessages([])
            }
        }
        fetchMessages()
    }, [selectedChat?.id, user?.id])

    const handleSend = async e => {
        e.preventDefault()
        if (!input.trim() || !myId || !user?.id || !selectedChat?.id) return
        const now = Date.now()
        const msg = {
            id: now,
            text: input,
            senderId: myId,
            senderDbId: user.id,
            receiverDbId: selectedChat.id,
            time: now
        }
        try {
            await defaultInstance.post('/user/messages/send', {
                senderId: user.id,
                receiverId: selectedChat.id,
                text: input,
                time: now
            })

            const response = await defaultInstance.get(`/user/chat-contacts/${user.id}`);
            if (response.data.contacts) {
                setChatList(response.data.contacts);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        }

        socketRef.current.emit('send-message', msg)
        setInput('')
    }

    // Mark chat as read when selected
    const handleSelectChat = chat => {
        setSelectedChat(chat)
        setChatList(prev =>
            prev.map(c =>
                c.id === chat.id ? { ...c, unread: false } : c
            )
        )
    }

    return (
        <div className={style.appBg}>
            <Sidebar
                active={activeSidebar}
                setActive={idx => {
                    setActiveSidebar(idx)
                    const item = sidebarIcons[idx]
                    if (item.route && item.route !== '#') navigate(item.route)
                }}
                sidebarIcons={sidebarIcons}
                logo={logo}
                onLogoClick={() => window.location.reload()}
            />
            <ChatListPanel
                style={style}
                chatList={chatList}
                selectedChat={selectedChat || {}}
                setSelectedChat={handleSelectChat}
                setChatList={setChatList}
            />
            {selectedChat ? (
                <ChatMain
                    style={style}
                    selectedChat={selectedChat}
                    input={input}
                    setInput={setInput}
                    messages={messages}
                    onSend={handleSend}
                />
            ) : (
                <div className={style.chatMain} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#888', fontSize: '1.3rem' }}>
                        აირჩიერთ ჩათი.
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatWindow