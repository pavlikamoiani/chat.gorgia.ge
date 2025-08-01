import React from 'react'
import { FiVideo } from 'react-icons/fi'
import { MdNotifications, MdCalendarToday, MdChatBubble } from 'react-icons/md'

const ChatMain = ({ style, selectedChat, input, setInput, messages }) => (
    <main className={style.chatMain}>
        <header className={style.chatHeader}>
            <div className={style.headerAvatar}>{selectedChat.name[0]}</div>
            <div className={style.headerInfo}>
                <span className={style.headerName}>{selectedChat.name}</span>
                <span className={style.headerStatus}>Online</span>
            </div>
            <div className={style.headerActions}>
                <button className={style.headerBtn} title="Call">
                    <FiVideo size={24} color="#0173b1" />
                </button>
                <button className={style.headerBtn} title="More">
                    <MdNotifications size={24} color="#0173b1" />
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
                <MdChatBubble size={20} color="#fff" />
            </button>
        </form>
    </main>
)

export default ChatMain
