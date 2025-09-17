import React, { useEffect, useRef, useState } from 'react'
import { FiFile, FiVideo } from 'react-icons/fi'
import { MdCalendarToday, MdPhone } from 'react-icons/md'
import { FiSend } from 'react-icons/fi'
import { FaReply, FaShare } from 'react-icons/fa'
import { useCall } from '../../../contexts/CallContext'
import { FiImage } from 'react-icons/fi'
import MessagesArea from './MessagesArea'

const ChatMain = ({ style, selectedChat, input, setInput, messages, onSend, chatList, onForward }) => {
    const messagesAreaRef = useRef(null);
    const { initiateCall, lastCallDuration } = useCall();
    const [replyTo, setReplyTo] = useState(null);
    const [forwardMsg, setForwardMsg] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imagePreviewName, setImagePreviewName] = useState("");
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [activeTab, setActiveTab] = useState('Chat');

    useEffect(() => {
        if (messagesAreaRef.current) {
            messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleAudioCallClick = () => {
        if (selectedChat && selectedChat.id) {
            initiateCall(selectedChat.id, false);
        }
    };

    const handleVideoCallClick = () => {
        if (selectedChat && selectedChat.id) {
            console.log("Video call button clicked for:", selectedChat.name);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Your browser doesn't support video calls. Please use a modern browser.");
                return;
            }

            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());

                    initiateCall(selectedChat.id, true);
                })
                .catch(err => {
                    console.error("Camera permission error:", err);
                    if (err.name === "NotAllowedError") {
                        alert("Camera access denied. Please grant camera permission to make video calls.");
                    } else {
                        alert(`Error accessing camera: ${err.message || err.name}`);
                    }
                });
        } else {
            alert("No chat selected. Please select a chat first.");
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
        if (!input.trim() && !imagePreview) return;

        const messageData = {
            text: input.trim(),
            replyTo: replyTo,
            image: imagePreview,
            imageName: imagePreviewName
        };

        onSend(messageData);

        setReplyTo(null);
        setImagePreview(null);
        setImagePreviewName("");
        setInput("");
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

    const handleFileIconClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageIconClick = () => {
        if (imageInputRef.current) {
            imageInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`Вы выбрали файл: ${file.name}`);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreviewName(file.name);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreview(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const openFullscreenImage = (imageUrl) => {
        setFullscreenImage(imageUrl);
    };

    const closeFullscreenImage = () => {
        setFullscreenImage(null);
    };

    let filteredMessages = messages;
    if (activeTab === 'Photos') {
        filteredMessages = messages.filter(msg => !!msg.image);
    } else if (activeTab === 'Files') {
        filteredMessages = messages.filter(msg => !!msg.file);
    }

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
            <MessagesArea
                style={style}
                messages={filteredMessages}
                activeTab={activeTab}
                messagesAreaRef={messagesAreaRef}
                openFullscreenImage={openFullscreenImage}
                handleReply={handleReply}
                handleForward={handleForward}
                selectedChat={selectedChat}
            />
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
            {imagePreview && (
                <div className={style.imagePreviewBox}>
                    <div className={style.imagePreviewIcon}>
                        <FiImage />
                    </div>
                    <div className={style.imagePreviewInfo}>
                        <span className={style.imagePreviewFilename}>{imagePreviewName}</span>
                        <span className={style.imagePreviewSub}>Anyone with the link can edit</span>
                    </div>
                    <button
                        type="button"
                        className={style.imagePreviewRemoveBtn}
                        onClick={() => { setImagePreview(null); setImagePreviewName(""); }}
                        title="Remove image"
                    >✕</button>
                </div>
            )}
            <form className={style.inputArea} onSubmit={handleSendWithReply}>
                <button type="button" className={style.inputIconBtn} title="Attach">
                    <MdCalendarToday size={20} color="#888" />
                </button>
                <button
                    type="button"
                    className={style.inputIconBtn}
                    title="Add image"
                    onClick={handleImageIconClick}
                    style={{ marginRight: 4 }}
                >
                    <FiImage size={20} color="#888" />
                </button>
                <button
                    type="button"
                    className={style.inputIconBtn}
                    title="Add file"
                    onClick={handleFileIconClick}
                >
                    <FiFile size={20} color="#888" />
                </button>
                <input
                    type="file"
                    ref={imageInputRef}
                    style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
                    onChange={handleImageChange}
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip,application/x-rar-compressed"
                    onChange={handleFileChange}
                />
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

            {fullscreenImage && (
                <div
                    className={style.fullscreenImageOverlay}
                    onClick={closeFullscreenImage}
                >
                    <div className={style.fullscreenImageContainer}>
                        <img
                            src={fullscreenImage}
                            alt="Fullscreen"
                            className={style.fullscreenImage}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            className={style.fullscreenCloseBtn}
                            onClick={closeFullscreenImage}
                            style={{ background: 'none' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
            {lastCallDuration !== null && (
                <div className={style.lastCallDuration}>
                    Last call duration: {Math.floor(lastCallDuration / 60)}m {lastCallDuration % 60}s
                </div>
            )}
        </main>
    )
}
export default ChatMain
