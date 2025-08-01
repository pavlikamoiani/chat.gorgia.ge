import React, { useState, useEffect, useRef } from 'react'
import style from '../../css/ChatWindow.module.css'
import { MdChatBubble, MdGroups, MdCalendarToday, MdNotifications } from 'react-icons/md'
import { FiVideo } from 'react-icons/fi'
import logo from '../../../../public/logo.jpg'
import ChatMain from './ChatMain'
import ChatListPanel from './ChatListPanel'
import { io } from 'socket.io-client'

const sidebarIcons = [
    {
        name: 'Chat',
        icon: MdChatBubble,
    },
    {
        name: 'Meet',
        icon: FiVideo,
    },
    {
        name: 'Calendar',
        icon: MdCalendarToday,
    },
    {
        name: 'Activity',
        icon: MdNotifications,
    },
]

const initialChatList = [
    { id: 1, name: 'John Doe', lastMessage: '', lastMessageTime: '', active: true },
    { id: 2, name: 'Jane Smith', lastMessage: '', lastMessageTime: '', active: false },
    { id: 3, name: 'Team Alpha', lastMessage: '', lastMessageTime: '', active: false },
    { id: 4, name: 'Support', lastMessage: '', lastMessageTime: '', active: false },
]

const ChatWindow = () => {
    const [input, setInput] = useState('')
    const [chatList, setChatList] = useState(initialChatList)
    const [selectedChat, setSelectedChat] = useState(initialChatList[0])
    const [activeSidebar, setActiveSidebar] = useState(0)
    const [messages, setMessages] = useState([])
    const [myId, setMyId] = useState(null)
    const socketRef = useRef(null)

    const formatTime = date => {
        const d = new Date(date)
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    useEffect(() => {
        socketRef.current = io('http://localhost:3000')
        socketRef.current.on('connect', () => {
            setMyId(socketRef.current.id)
        })
        socketRef.current.on('receive-message', msg => {
            setMessages(prev => [
                ...prev,
                {
                    ...msg,
                    fromMe: msg.senderId === socketRef.current.id
                }
            ])
            setChatList(prev =>
                prev.map(chat =>
                    chat.id === selectedChat.id
                        ? {
                            ...chat,
                            lastMessage: msg.text,
                            lastMessageTime: formatTime(msg.time || Date.now())
                        }
                        : chat
                )
            )
        })
        return () => {
            socketRef.current.disconnect()
        }
        // eslint-disable-next-line
    }, [selectedChat.id])

    const handleSend = e => {
        e.preventDefault()
        if (!input.trim() || !myId) return
        const now = Date.now()
        const msg = {
            id: now,
            text: input,
            senderId: myId,
            time: now
        }
        socketRef.current.emit('send-message', msg)
        setInput('')
        setChatList(prev =>
            prev.map(chat =>
                chat.id === selectedChat.id
                    ? {
                        ...chat,
                        lastMessage: msg.text,
                        lastMessageTime: formatTime(now)
                    }
                    : chat
            )
        )
    }

    return (
        <div className={style.appBg}>
            <aside className={style.sidebar}>
                <div style={{ marginBottom: 32 }}>
                    <img src={logo} onClick={() => window.location.reload()} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, marginTop: 4, cursor: 'pointer' }} />
                </div>
                <div className={style.sidebarIcons}>
                    {sidebarIcons.map((item, idx) => {
                        const IconComp = item.icon
                        return (
                            <button
                                key={item.name}
                                className={style.sidebarBtn}
                                title={item.name}
                                onClick={() => setActiveSidebar(idx)}
                            >
                                <span className={style.icon}>
                                    <IconComp size={26} color={idx === activeSidebar ? '#0173b1' : '#fff'} />
                                </span>
                                <span
                                    className={style.sidebarLabel}
                                    style={{
                                        color: idx === activeSidebar ? '#0173b1' : '#fff',
                                        fontWeight: idx === activeSidebar ? 600 : 400
                                    }}
                                >
                                    {item.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </aside>
            <ChatListPanel
                style={style}
                chatList={chatList}
                selectedChat={selectedChat}
                setSelectedChat={setSelectedChat}
            />
            <ChatMain
                style={style}
                selectedChat={selectedChat}
                input={input}
                setInput={setInput}
                messages={messages}
                onSend={handleSend}
            />
        </div>
    )
}

export default ChatWindow