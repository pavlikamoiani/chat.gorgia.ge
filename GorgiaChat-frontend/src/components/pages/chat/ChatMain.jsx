import React, { useEffect, useRef, useState } from 'react'
import { FiVideo } from 'react-icons/fi'
import { MdCalendarToday, MdPhone } from 'react-icons/md'
import { FiSend } from 'react-icons/fi'
import { FaReply, FaShare } from 'react-icons/fa'
import { useCall } from '../../../contexts/CallContext'

const ChatMain = ({ style, selectedChat, input, setInput, messages, onSend, chatList, onForward }) => {
    const messagesEndRef = useRef(null);
    const messagesAreaRef = useRef(null);
    const { initiateCall } = useCall();
    const [replyTo, setReplyTo] = useState(null);
    const [forwardMsg, setForwardMsg] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);

    useEffect(() => {
        if (messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleCallClick = () => {
        if (selectedChat && selectedChat.id) {
            initiateCall(selectedChat.id);
        }
    };

    const handleReply = (msg) => {
        setReplyTo(msg);
    };

    const handleCancelReply = () => {
        setReplyTo(null);
    };

    const handleSendWithReply = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(e, replyTo);
        setReplyTo(null);
    };

    const handleForward = (msg) => {
        setForwardMsg(msg);
        setShowForwardModal(true);
    };

    const handleSelectForwardChat = (chat) => {
        if (forwardMsg && chat) {
            onForward(forwardMsg, chat);
        }
        setShowForwardModal(false);
        setForwardMsg(null);
    };

    return (
        <main className={style.chatMain}>
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
                        <a href='#'>Chat</a>
                        <a href='#'>Files</a>
                        <a href='#'>Photos</a>
                    </div>
                </div>

                <div className={style.headerActions}>
                    <button className={style.headerBtn} title="Video call">
                        <FiVideo size={20} color="#888" />
                    </button>
                    <button
                        className={style.headerBtn}
                        title="Voice call"
                        onClick={handleCallClick}
                    >
                        <MdPhone size={20} color="#888" />
                    </button>
                </div>
            </header>
            <div
                className={style.messagesArea}
                ref={messagesAreaRef}
            >
                {messages.length === 0 ? (
                    <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            className={msg.fromMe ? style.msgFromMe : style.msgFromThem}
                            style={{ position: 'relative' }}
                        >
                            <div className={style.msgHoverOverlay}>
                                <button
                                    className={style.replyBtnTop}
                                    title="Reply"
                                    onClick={() => handleReply(msg)}
                                >
                                    <FaReply />
                                </button>
                                <button
                                    className={style.forwardBtnTop}
                                    title="Forward"
                                    onClick={() => handleForward(msg)}
                                >
                                    <FaShare />
                                </button>
                            </div>
                            {msg.forwarded && (
                                <div className={style.forwardedLabel}>Forwarded</div>
                            )}
                            {msg.replyTo && (
                                <div className={style.replyPreviewInMsg}>
                                    <span className={style.replySender}>
                                        {msg.replyTo.fromMe ? "You" : selectedChat.name}
                                    </span>
                                    <span className={style.replyText}>
                                        {msg.replyTo.text}
                                    </span>
                                </div>
                            )}
                            <span>{msg.text}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            {replyTo && (
                <div className={style.replyPreview}>
                    <span className={style.replySender}>
                        Replying to {replyTo.fromMe ? "yourself" : selectedChat.name}:
                    </span>
                    <span className={style.replyText}>
                        {replyTo.text}
                    </span>
                    <button className={style.cancelReplyBtn} onClick={handleCancelReply}>✕</button>
                </div>
            )}
            <form className={style.inputArea} onSubmit={handleSendWithReply}>
                <button type="button" className={style.inputIconBtn} title="Attach">
                    <MdCalendarToday size={20} color="#888" />
                </button>
                <input
                    type="text"
                    className={style.inputBox}
                    placeholder="Type a message"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <button type="submit" className={style.sendBtn} title="Send">
                    <FiSend size={20} color="#fff" />
                </button>
            </form>
            {showForwardModal && (
                <div className={style.forwardModalOverlay}>
                    <div className={style.forwardModalContent}>
                        <div style={{ fontWeight: 600, marginBottom: 12 }}>Forward to:</div>
                        <div className={style.forwardChatList}>
                            {chatList.filter(chat => chat.id !== selectedChat.id).map(chat => (
                                <div
                                    key={chat.id}
                                    className={style.forwardChatItem}
                                    onClick={() => handleSelectForwardChat(chat)}
                                >
                                    {chat.name}
                                </div>
                            ))}
                        </div>
                        <button
                            className={style.cancelForwardBtn}
                            onClick={() => setShowForwardModal(false)}
                        >Cancel</button>
                    </div>
                </div>
            )}
        </main>
    )
}
export default ChatMain
