import React from 'react'
import style from '../css/ChatWindow.module.css'
import { MdChatBubble, MdCalendarToday, MdNotifications } from 'react-icons/md'
import { FiVideo } from 'react-icons/fi'

export const sidebarIcons = [
    { name: 'Chat', icon: MdChatBubble, route: '/' },
    { name: 'Meet', icon: FiVideo, route: '/meet' },
    { name: 'Calendar', icon: MdCalendarToday, route: '/calendar' },
    { name: 'Activity', icon: MdNotifications, route: '/activity' },
]

const Sidebar = ({ active, setActive, logo, onLogoClick }) => (
    <aside className={style.sidebar}>
        <div style={{ marginBottom: 32 }}>
            {logo && (
                <img
                    src={logo}
                    alt="Logo"
                    style={{ width: 40, height: 40, borderRadius: 8, marginTop: 4, cursor: 'pointer' }}
                    onClick={onLogoClick}
                />
            )}
        </div>
        <div className={style.sidebarIcons}>
            {sidebarIcons.map((item, idx) => {
                const IconComp = item.icon
                return (
                    <button
                        key={item.name}
                        className={style.sidebarBtn}
                        title={item.name}
                        onClick={() => {
                            setActive && setActive(idx)
                            if (item.onClick) item.onClick()
                        }}
                    >
                        <span className={style.icon}>
                            <IconComp size={26} color={idx === active ? '#0173b1' : '#fff'} />
                        </span>
                        <span
                            className={style.sidebarLabel}
                            style={{
                                color: idx === active ? '#0173b1' : '#fff',
                                fontWeight: idx === active ? 600 : 400
                            }}
                        >
                            {item.name}
                        </span>
                    </button>
                )
            })}
        </div>
    </aside>
)

export default Sidebar
