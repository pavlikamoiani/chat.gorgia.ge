import React, { useState, useRef, useEffect } from 'react'
import style from '../css/ChatWindow.module.css'
import { MdChatBubble, MdCalendarToday, MdNotifications } from 'react-icons/md'
import { FiVideo } from 'react-icons/fi'
import { GiHamburgerMenu } from 'react-icons/gi'

export const sidebarIcons = [
    { name: 'Chat', icon: MdChatBubble, route: '/' },
    { name: 'Meet', icon: FiVideo, route: '/meet' },
    { name: 'Calendar', icon: MdCalendarToday, route: '/calendar' },
    { name: 'Activity', icon: MdNotifications, route: '/activity' },
]

const Sidebar = ({ active, setActive, logo, onLogoClick, onProfile, onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        } else {
            document.removeEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    return (
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
            <div style={{ marginTop: 'auto', marginBottom: 0, position: 'relative' }}>
                <button
                    className={`${style.sidebarBtn} ${style.hamburgerBtn}`}
                    title="Menu"
                    onClick={() => setMenuOpen(v => !v)}
                >
                    <span className={style.icon}>
                        <GiHamburgerMenu size={26} color="#fff" />
                    </span>
                </button>
                {menuOpen && (
                    <ul
                        ref={menuRef}
                        style={{
                            position: 'absolute',
                            left: '100%',
                            bottom: 0,
                            background: '#232323',
                            borderRadius: 8,
                            boxShadow: '0 2px 8px #0006',
                            listStyle: 'none',
                            margin: 0,
                            padding: '8px 0',
                            minWidth: 120,
                            zIndex: 10,
                            marginLeft: 8
                        }}
                    >
                        <li
                            style={{
                                padding: '10px 18px',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: 14
                            }}
                            onClick={() => {
                                setMenuOpen(false)
                                onProfile && onProfile()
                            }}
                        >
                            Profile
                        </li>
                        <li
                            style={{
                                padding: '10px 18px',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: 14
                            }}
                            onClick={() => {
                                setMenuOpen(false)
                                onLogout && onLogout()
                            }}
                        >
                            Logout
                        </li>
                    </ul>
                )}
            </div>
        </aside>
    )
}

export default Sidebar
