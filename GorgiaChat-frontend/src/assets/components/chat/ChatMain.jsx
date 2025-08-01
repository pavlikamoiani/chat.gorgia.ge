import React from 'react'
import { FiVideo } from 'react-icons/fi'
import { MdCalendarToday, MdPhone } from 'react-icons/md'
import { FiSend } from 'react-icons/fi'

const ChatMain = ({ style, selectedChat, input, setInput, messages, onSend }) => (
    <main className={style.chatMain}>
        <header className={style.chatHeader}>
            <div className={style.headerAvatar}>{selectedChat.name[0]}</div>
            <div className={style.headerInfo}>
                <span className={style.headerName}>{selectedChat.name}</span>
                <span className={style.headerStatus}>Online</span>
            </div>
            <div className={style.headerActions}>
                <button className={style.headerBtn} title="Call">
                    <FiVideo size={20} color="#888" />
                </button>
                <button className={style.headerBtn} title="Phone">
                    <MdPhone size={20} color="#888" />
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
        <form className={style.inputArea} onSubmit={onSend}>
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
    </main>
)

export default ChatMain
