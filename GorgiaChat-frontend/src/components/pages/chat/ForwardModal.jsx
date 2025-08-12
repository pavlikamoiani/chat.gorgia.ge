import React from 'react'

const ForwardModal = ({
    style,
    chatList,
    selectedChat,
    handleSelectForwardChat,
    setShowForwardModal
}) => (
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
)
export default ForwardModal
