import React from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '/logo.jpg'
import Sidebar, { sidebarIcons } from '../../Sidebar'


const CalendarWindow = () => {
    const navigate = useNavigate()
    return (
        <div>
            <Sidebar
                active={1}
                setActive={idx => {
                    const item = sidebarIcons[idx]
                    if (item.route && item.route !== '#') navigate(item.route)
                }}
                sidebarIcons={sidebarIcons}
                onLogoClick={() => window.location.reload()}
            />

        </div>
    )
}

export default CalendarWindow