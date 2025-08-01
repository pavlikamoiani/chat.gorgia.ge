import React, { useState, useEffect, useRef } from 'react'
import style from '../css/ChatWindow.module.css'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import Sidebar, { sidebarIcons } from './Sidebar'
import ChatMain from './pages/chat/ChatMain'
import ChatListPanel from './ChatListPanel'
import logo from '../../../public/logo.jpg'

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
    const navigate = useNavigate()

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