import React from 'react'
import { MdChatBubble } from 'react-icons/md'
import { FaUserPlus } from 'react-icons/fa'

const ChatListPanel = ({ style, chatList, selectedChat, setSelectedChat }) => (
    <section className={style.chatListPanel}>
        <div className={style.chatListHeader}>
            <span className={style.chatListTitle}>Chats</span>
            <button className={style.newMsgBtn} title="New chat">
                <FaUserPlus size={20} color="#888" />
            </button>
        </div>
        <div className={style.searchBar}>
            <MdChatBubble size={20} color="#888" />
            <input type="text" placeholder="Search" />
        </div>
        <div className={style.chatList}>
            {chatList.map(chat => (
                <div style={{ cursor: 'pointer', marginBottom: '4px' }}
                    key={chat.id}
                    className={style.chatListItem + ' ' + (selectedChat.id === chat.id ? style.activeChat : '')}
                    onClick={() => setSelectedChat(chat)}
                >
                    <div className={style.avatar}>
                        {chat.name ? chat.name[0].toUpperCase() : ''}
                    </div>
                    <div className={style.chatInfo}>
                        <span className={style.chatName}>{chat.name}</span>
                        <span className={style.lastMsg}>
                            {chat.lastMessage}
                            {chat.lastMessageTime && (
                                <span style={{ color: '#888', fontSize: '0.85em', marginLeft: 8 }}>
                                    {chat.lastMessageTime}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </section>
)

export default ChatListPanel
