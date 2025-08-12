import React from 'react'
import { MdCalendarToday } from 'react-icons/md'
import { FiImage, FiFile, FiSend } from 'react-icons/fi'

const InputArea = ({
    style,
    input,
    setInput,
    handleSendWithReply,
    handleImageIconClick,
    handleFileIconClick,
    imageInputRef,
    fileInputRef,
    handleImageChange,
    handleFileChange
}) => (
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
)
export default InputArea
