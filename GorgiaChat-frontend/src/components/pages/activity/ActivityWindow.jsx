import React from 'react'
import Sidebar, { sidebarIcons } from '../../Sidebar'
import { useNavigate } from 'react-router-dom'

const ActivityWindow = () => {
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

export default ActivityWindow