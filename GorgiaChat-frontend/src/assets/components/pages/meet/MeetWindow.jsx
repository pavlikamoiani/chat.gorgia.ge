import React from 'react'
import style from '../../../css/MeetWindow.module.css'
import logo from '../../../../../public/logo.jpg'
import { useNavigate } from 'react-router-dom'
import Sidebar, { sidebarIcons } from '../../Sidebar'

const MeetWindow = () => {
    const navigate = useNavigate()
    return (
        <div className={style.appBg}>
            <Sidebar
                active={1}
                setActive={idx => {
                    const item = sidebarIcons[idx]
                    if (item.route && item.route !== '#') navigate(item.route)
                }}
                sidebarIcons={sidebarIcons}
                logo={logo}
                onLogoClick={() => navigate('/')}
            />
            <main className={style.meetMain}>
                <div className={style.meetHeader}>
                    <h2>Meet</h2>
                </div>
                <div className={style.meetActions}>
                    <button className={style.meetBtn}>Create a meeting link</button>
                    <button className={style.meetBtn}>Schedule a meeting</button>
                    <button className={style.meetBtn}>Join with a meeting ID</button>
                </div>
                <div className={style.meetingLinks}>
                    <div className={style.meetingLinkCard}>
                        <div className={style.meetingLinkIcon}>🔗</div>
                        <div>
                            <div className={style.meetingLinkTitle}>Quickly create, save, and share links with anyone.</div>
                            <div className={style.meetingLinkDesc}><a href="#">Learn more about meeting links</a></div>
                        </div>
                    </div>
                </div>
                <div className={style.scheduledMeetings}>
                    <div className={style.scheduledHeader}>
                        <span>Scheduled meetings</span>
                        <span className={style.viewCalendar}>View in calendar</span>
                    </div>
                    <div className={style.scheduledEmpty}>
                        <div className={style.scheduledEmptyText}>You don't have anything scheduled.</div>
                        <div className={style.scheduledEmptyImg}>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default MeetWindow
