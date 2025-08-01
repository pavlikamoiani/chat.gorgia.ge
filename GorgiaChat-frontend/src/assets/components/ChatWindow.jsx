import React, { useState } from 'react'
import style from '../css/ChatWindow.module.css'
import { MdChatBubble, MdGroups, MdCalendarToday, MdNotifications } from 'react-icons/md'
import { FiVideo } from 'react-icons/fi'

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

const messages = [
    { id: 1, fromMe: false, text: 'Hi there!' },
    { id: 2, fromMe: true, text: 'Hello! How can I help you?' },
    { id: 3, fromMe: false, text: 'I have a question about my order.' },
    { id: 4, fromMe: true, text: 'Sure, please provide your order ID.' },
]

const ChatWindow = () => {
    const [input, setInput] = useState('')
    const [selectedChat, setSelectedChat] = useState(chatList[0])
    const [activeSidebar, setActiveSidebar] = useState(0)

    return (
        <div className={style.appBg}>
            <aside className={style.sidebar}>
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
            <section className={style.chatListPanel}>
                <div className={style.chatListHeader}>
                    <span className={style.chatListTitle}>Chats</span>
                    <button className={style.newMsgBtn} title="New chat">
                        <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="#0173b1" strokeWidth="2" /><path d="M10 6v8M6 10h8" stroke="#0173b1" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                </div>
                <div className={style.searchBar}>
                    <svg width="18" height="18" fill="none"><circle cx="8" cy="8" r="7" stroke="#888" strokeWidth="2" /><path d="M14 14l-3-3" stroke="#888" strokeWidth="2" strokeLinecap="round" /></svg>
                    <input type="text" placeholder="Search" />
                </div>
                <div className={style.chatList}>
                    {chatList.map(chat => (
                        <div
                            key={chat.id}
                            className={style.chatListItem + ' ' + (selectedChat.id === chat.id ? style.activeChat : '')}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className={style.avatar}>{chat.name[0]}</div>
                            <div className={style.chatInfo}>
                                <span className={style.chatName}>{chat.name}</span>
                                <span className={style.lastMsg}>{chat.lastMessage}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <main className={style.chatMain}>
                <header className={style.chatHeader}>
                    <div className={style.headerAvatar}>{selectedChat.name[0]}</div>
                    <div className={style.headerInfo}>
                        <span className={style.headerName}>{selectedChat.name}</span>
                        <span className={style.headerStatus}>Online</span>
                    </div>
                    <div className={style.headerActions}>
                        <button className={style.headerBtn} title="Call">
                            <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="#0173b1" strokeWidth="2" /><path d="M7 13l6-6M13 13l-6-6" stroke="#0173b1" strokeWidth="2" strokeLinecap="round" /></svg>
                        </button>
                        <button className={style.headerBtn} title="More">
                            <svg width="20" height="20" fill="none"><circle cx="10" cy="10" r="9" stroke="#0173b1" strokeWidth="2" /><circle cx="10" cy="10" r="1.5" fill="#0173b1" /></svg>
                        </button>
                    </div>
                </header>
                <div className={style.messagesArea}>
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={msg.fromMe ? style.msgFromMe : style.msgFromThem}
                        >
                            <span>{msg.text}</span>
                        </div>
                    ))}
                </div>
                <form className={style.inputArea} onSubmit={e => { e.preventDefault(); setInput(''); }}>
                    <button type="button" className={style.inputIconBtn} title="Attach">
                        <svg width="20" height="20" fill="none"><rect x="5" y="9" width="10" height="6" rx="3" stroke="#888" strokeWidth="2" /><path d="M10 9V5" stroke="#888" strokeWidth="2" strokeLinecap="round" /></svg>
                    </button>
                    <input
                        type="text"
                        className={style.inputBox}
                        placeholder="Type a message"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button type="submit" className={style.sendBtn} title="Send">
                        <svg width="20" height="20" fill="none"><path d="M3 17l14-7-14-7v6l10 1-10 1v6z" fill="#0173b1" /></svg>
                    </button>
                </form>
            </main>
        </div>
    )
}

export default ChatWindow