import React from 'react'
import { FiVideo } from 'react-icons/fi'
import { MdPhone } from 'react-icons/md'

const ChatHeader = ({
    style,
    selectedChat,
    activeTab,
    setActiveTab,
    handleVideoCallClick,
    handleAudioCallClick
}) => (
    <header className={style.chatHeader}>
        <div className={style.headerAvatarContainer}>
            <div className={style.headerAvatar}>
                {selectedChat.name ? selectedChat.name[0].toUpperCase() : ''}
            </div>
            <div
                className={`${style.statusIndicator} ${selectedChat.isOnline ? style.online : style.offline}`}
                title={selectedChat.isOnline ? "Online" : "Offline"}
            ></div>
        </div>
        <div className={style.headerInfo}>
            <div className={style.headerInfoNameActivity}>
                <span className={style.headerName}>
                    {selectedChat.name
                        ? selectedChat.name[0].toUpperCase() + selectedChat.name.slice(1)
                        : ''}
                </span>
                <span className={style.headerStatus} style={{ color: selectedChat.isOnline ? '#4CAF50' : '#F44336' }}>
                    {selectedChat.isOnline ? 'Online' : 'Offline'}
                </span>
            </div>
            <div className={style.headerInfoChatFilesPhotos}>
                <a
                    href='#'
                    className={activeTab === 'Chat' ? style.activeTab : ''}
                    onClick={e => { e.preventDefault(); setActiveTab('Chat'); }}
                >Chat</a>
                <a
                    href='#'
                    className={activeTab === 'Files' ? style.activeTab : ''}
                    onClick={e => { e.preventDefault(); setActiveTab('Files'); }}
                >Files</a>
                <a
                    href='#'
                    className={activeTab === 'Photos' ? style.activeTab : ''}
                    onClick={e => { e.preventDefault(); setActiveTab('Photos'); }}
                >Photos</a>
            </div>
        </div>
        <div className={style.headerActions}>
            <button
                className={style.headerBtn}
                title="Video call"
                onClick={handleVideoCallClick}
            >
                <FiVideo size={20} color="#888" />
            </button>
            <button
                className={style.headerBtn}
                title="Voice call"
                onClick={handleAudioCallClick}
            >
                <MdPhone size={20} color="#888" />
            </button>
        </div>
    </header>
)
export default ChatHeader
