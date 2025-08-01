import React, { useState, useEffect, useRef } from 'react'
import style from '../css/ChatWindow.module.css'
import { MdChatBubble, MdGroups, MdCalendarToday, MdNotifications } from 'react-icons/md'
import { FiVideo } from 'react-icons/fi'
import logo from '../../../public/logo.jpg'
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
        name: 'Communities',
        icon: MdGroups,
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

const chatList = [
    { id: 1, name: 'John Doe', lastMessage: 'See you at 3pm!', active: true },
    { id: 2, name: 'Jane Smith', lastMessage: 'Thanks for the update.', active: false },
    { id: 3, name: 'Team Alpha', lastMessage: 'Meeting starts soon.', active: false },
    { id: 4, name: 'Support', lastMessage: 'How can we help?', active: false },
]

const ChatWindow = () => {
    const [input, setInput] = useState('')
    const [selectedChat, setSelectedChat] = useState(chatList[0])
    const [activeSidebar, setActiveSidebar] = useState(0)
    const [messages, setMessages] = useState([])
    const socketRef = useRef(null)

    useEffect(() => {
        socketRef.current = io('http://localhost:3000')
        socketRef.current.on('receive-message', msg => {
            setMessages(prev => [...prev, msg])
        })
        return () => {
            socketRef.current.disconnect()
        }
    }, [])

    const handleSend = e => {
        e.preventDefault()
        if (!input.trim()) return
        const msg = {
            id: Date.now(),
            fromMe: true,
            text: input
        }
        setMessages(prev => [...prev, msg])
        socketRef.current.emit('send-message', { ...msg, fromMe: false })
        setInput('')
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