import React from 'react'
import { MdChatBubble } from 'react-icons/md'

const ChatListPanel = ({ style, chatList, selectedChat, setSelectedChat }) => (
    <section className={style.chatListPanel}>
        <div className={style.chatListHeader}>
            <span className={style.chatListTitle}>Chats</span>
            <button className={style.newMsgBtn} title="New chat">
                <MdChatBubble size={20} color="#0173b1" />
            </button>
        </div>
        <div className={style.searchBar}>
            <MdChatBubble size={18} color="#888" />
            <input type="text" placeholder="Search" />
        </div>
        <div className={style.chatList}>
            {chatList.map(chat => (
                <div style={{ cursor: 'pointer', marginBottom: '4px' }}
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
)

export default ChatListPanel
