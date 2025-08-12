import React from 'react'
import { FaReply, FaShare } from 'react-icons/fa'
import { FiFile } from 'react-icons/fi'

const MessagesArea = ({
    style,
    messages,
    activeTab,
    messagesAreaRef,
    openFullscreenImage,
    handleReply,
    handleForward
}) => (
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
                    {/* ...forwarded, replyTo... */}
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
                </div>
            ))
        )}
        <div ref={messagesAreaRef} />
    </div>
)
export default MessagesArea
