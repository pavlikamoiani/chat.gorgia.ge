import React, { useState, useRef, useEffect } from 'react'
import { FaReply, FaShare } from 'react-icons/fa'
import { FiFile, FiDownload } from 'react-icons/fi'
import MessageArea from '../../../assets/css/MessageArea.module.css'

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessagesArea = ({
    style,
    messages,
    activeTab,
    messagesAreaRef,
    openFullscreenImage,
    handleReply,
    handleForward,
    usersById
}) => {
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
    const contextMenuRef = useRef(null);

    useEffect(() => {
        if (!contextMenu.visible) return;
        const handleClick = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu({ ...contextMenu, visible: false });
            }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [contextMenu]);

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            msg
        });
    };

    // Utility to extract filename from URL
    const getFilenameFromUrl = (url) => {
        try {
            const pathname = new URL(url, window.location.origin).pathname;
            const name = pathname.substring(pathname.lastIndexOf('/') + 1);
            return name || 'image.jpg';
        } catch {
            return 'image.jpg';
        }
    };

    const handleMenuAction = async (action) => {
        if (action === 'reply') handleReply(contextMenu.msg);
        if (action === 'forward') handleForward(contextMenu.msg);
        if (action === 'download' && contextMenu.msg && contextMenu.msg.image) {
            try {
                const response = await fetch(contextMenu.msg.image, { mode: 'cors' });
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = getFilenameFromUrl(contextMenu.msg.image);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (err) {
                alert('Failed to download image');
                console.error('Download error:', err);
            }
        }
        setContextMenu({ ...contextMenu, visible: false });
    };

    return (
        <div className={style.messagesArea} ref={messagesAreaRef}>
            {messages.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                    {activeTab === 'Photos'
                        ? 'No photos yet.'
                        : activeTab === 'Files'
                            ? 'No files yet.'
                            : 'No messages yet. Start the conversation!'}
                </div>
            ) : (
                messages.map(msg => (
                    <div key={msg.id} style={{ position: 'relative' }}>
                        <div
                            className={
                                msg.fromMe
                                    ? style.messageSenderMe
                                    : style.messageSenderThem
                            }
                        >
                            {msg.fromMe
                                ? "You"
                                : (
                                    usersById && usersById[msg.senderId]
                                        ? usersById[msg.senderId].username
                                        : "Unknown"
                                )}
                        </div>
                        <div
                            className={`${style.messageContainer} ${msg.fromMe ? style.messageContainerMe : style.messageContainerThem}`}
                            onContextMenu={e => handleContextMenu(e, msg)}
                        >
                            <div
                                className={msg.fromMe ? style.msgFromMe : style.msgFromThem}
                                style={{
                                    position: 'relative',
                                    background: msg.image ? 'transparent' : undefined,
                                    boxShadow: msg.image ? 'none' : undefined,
                                    padding: msg.image ? 0 : undefined
                                }}
                            >
                                {msg.image && (
                                    <img
                                        src={msg.image}
                                        alt="img"
                                        style={{
                                            maxWidth: 180,
                                            maxHeight: 180,
                                            borderRadius: 8,
                                            marginBottom: 6,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => openFullscreenImage(msg.image)}
                                        onError={(e) => {
                                            console.error("Image failed to load:", e.target.src);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}
                                {msg.file && (
                                    <a
                                        href={msg.file.url || msg.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={style.fileMessageLink}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            marginBottom: 6
                                        }}
                                    >
                                        <FiFile size={20} />
                                        <span>{msg.file.name || 'File'}</span>
                                    </a>
                                )}
                                <span>{msg.text}</span>
                                <span className={`${style.msgTimeOnHover} ${msg.fromMe ? style.timeRight : style.timeLeft}`}>
                                    {formatTime(msg.time)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
            {contextMenu.visible && (
                <div
                    ref={contextMenuRef}
                    className={MessageArea.contextMenu}
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 99999
                    }}
                >
                    <button
                        className={MessageArea.contextMenuBtn}
                        onClick={() => handleMenuAction('reply')}
                    >
                        <FaReply style={{ marginRight: 12, opacity: 0.8 }} /> Reply
                    </button>
                    <div className={MessageArea.contextMenuDivider} />
                    <button
                        className={`${MessageArea.contextMenuBtn} ${MessageArea.contextMenuBtnForward}`}
                        onClick={() => handleMenuAction('forward')}
                    >
                        <FaShare style={{ marginRight: 12, opacity: 0.8 }} /> Forward
                    </button>
                    {contextMenu.msg && contextMenu.msg.image && (
                        <>
                            <div className={MessageArea.contextMenuDivider} />
                            <button
                                className={MessageArea.contextMenuBtn}
                                onClick={() => handleMenuAction('download')}
                            >
                                <FiDownload style={{ marginRight: 12, opacity: 0.8 }} /> Download
                            </button>
                        </>
                    )}
                </div>
            )}
            <div ref={messagesAreaRef} />
        </div>
    )
}
export default MessagesArea
