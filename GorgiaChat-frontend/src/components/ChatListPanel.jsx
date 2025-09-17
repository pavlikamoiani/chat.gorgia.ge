import React, { useState } from 'react'
import { MdChatBubble, MdGroups } from 'react-icons/md'
import { RiEditBoxLine } from "react-icons/ri";
import { FaUserPlus } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import defaultInstance from '../api/defaultInstance'
import { IoSearch } from "react-icons/io5";

const ChatListPanel = ({ style, chatList, selectedChat, setSelectedChat, setChatList, isGroupList, onNewGroup }) => {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState([])
    const [showResults, setShowResults] = useState(false)
    const user = useSelector(state => state.auth.user)

    const handleSearch = async e => {
        const value = e.target.value
        setSearch(value)
        if (value.trim().length === 0) {
            setResults([])
            setShowResults(false)
            return
        }
        try {
            const res = await defaultInstance.get(`/user/search-user?q=${encodeURIComponent(value)}`)
            setResults(res.data.users || [])
            setShowResults(true)
        } catch {
            setResults([])
            setShowResults(false)
        }
    }

    const handleSelectUser = async user => {
        if (!chatList.find(chat => chat.id === user.id)) {
            setSelectedChat({
                id: user.id,
                name: user.username,
                email: user.email,
                lastMessage: '',
                lastMessageTime: ''
            });

        } else {
            setSelectedChat(chatList.find(chat => chat.id === user.id));
        }

        if (window.clearMessagesForNewChat) window.clearMessagesForNewChat();

        setSearch('')
        setResults([])
        setShowResults(false)
    }

    const formatTimestamp = timestamp => {
        if (!timestamp) return ''
        const date = new Date(parseInt(timestamp))
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <section className={style.chatListPanel}>
            <div className={style.chatListHeader}>
                <span className={style.chatListTitle}>{isGroupList ? "Groups" : "Chats"}</span>
                {!isGroupList && (
                    <button className={style.newMsgBtn} title="New chat">
                        <FaUserPlus size={20} color="#888" />
                    </button>
                )}
                {isGroupList && (
                    <button
                        className={style.newMsgBtn}
                        title="New chat"
                        onClick={onNewGroup} // call handler
                    >
                        <RiEditBoxLine size={20} color="#888" />
                    </button>
                )}
            </div>
            {!isGroupList && (
                <div className={style.searchBar} style={{ position: 'relative' }}>
                    <IoSearch size={20} color="#888" />
                    <input
                        type="text"
                        placeholder="Search users"
                        value={search}
                        onChange={handleSearch}
                        onFocus={() => setShowResults(true)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    />
                    {showResults && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#232323',
                            border: '1px solid #333',
                            zIndex: 10,
                            maxHeight: 200,
                            overflowY: 'auto',
                            borderRadius: '4px',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
                        }}>
                            {results.length === 0 ? (
                                <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>
                                    No users found
                                </div>
                            ) : (
                                results.map(user => (
                                    <div
                                        key={user.id}
                                        style={{
                                            padding: '12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #333',
                                            color: '#fff',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseDown={() => handleSelectUser(user)}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#333'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                                        <div style={{ fontSize: '0.85em', color: '#888', marginTop: '2px' }}>{user.email}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
            {isGroupList && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#2b2b2bff',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        margin: '16px 8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        cursor: 'pointer'
                    }}
                    title="New chat"
                    onClick={onNewGroup}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12
                        }}
                    >
                        <MdGroups size={24} color="#fff" />
                    </div>
                    <span style={{ color: '#fff', fontSize: 15 }}>New chat</span>
                </div>
            )}
            <div className={style.chatList}>
                {chatList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        {isGroupList ? "ჯგუფები არ მოიძებნა" : "ჩატი არ მოიძებნა"}
                    </div>
                ) : (
                    chatList.map(chat => (
                        <div
                            key={chat.id}
                            className={style.chatListItem + ' ' + (selectedChat?.id === chat.id ? style.activeChat : '')}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className={style.avatarContainer}>
                                <div className={style.avatar} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {chat.name ? chat.name[0].toUpperCase() : ''}
                                    {!isGroupList && (
                                        <span
                                            className={style.statusIndicator + ' ' + (chat.isOnline ? style.online : style.offline)}
                                            title={chat.isOnline ? "Online" : "Offline"}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                bottom: 0,
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: chat.isOnline ? '#4CAF50' : '#F44336',
                                                border: '2px solid #232323',
                                                display: 'inline-block'
                                            }}
                                        ></span>
                                    )}
                                </div>
                            </div>
                            <div className={style.chatInfo}>
                                <div className={style.chatNameContainer}>
                                    <span className={style.chatName}>{chat.name
                                        ? chat.name[0].toUpperCase() + chat.name.slice(1)
                                        : ''}
                                    </span>
                                </div>
                                <span className={style.lastMsg}>
                                    <span style={chat.unread ? { fontWeight: 'bold', color: '#fff' } : {}}>
                                        {chat.lastMessage}
                                    </span>
                                    {chat.lastMessageTime && (
                                        <span style={{ color: '#888', fontSize: '0.85em', marginLeft: 8 }}>
                                            {formatTimestamp(chat.lastMessageTime)}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    )
}

export default ChatListPanel
