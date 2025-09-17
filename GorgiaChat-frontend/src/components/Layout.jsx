import React from 'react';
import Sidebar, { sidebarIcons } from './Sidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '/logo.jpg';
import style from '../assets/css/ChatWindow.module.css';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const activeIdx = sidebarIcons.findIndex(icon =>
        location.pathname.startsWith(icon.route)
    );

    return (
        <div className={style.appBg}>
            <Sidebar
                active={activeIdx}
                setActive={idx => {
                    const item = sidebarIcons[idx];
                    if (item.route && item.route !== '#') navigate(item.route);
                }}
                sidebarIcons={sidebarIcons}
                logo={logo}
                onLogoClick={() => window.location.reload()}
            />

            <Outlet />
        </div>
    );
};

export default Layout;
