import React from 'react';
import { BsChatDotsFill, BsPeople, BsTelephone, BsGear } from 'react-icons/bs';
import { BiHistory } from 'react-icons/bi';
import { RiLogoutCircleLine } from 'react-icons/ri';

const NavRail = ({ onLogout, onProfileClick }) => {
    return (
        <div style={styles.container}>
            {/* Top Section */}
            <div style={styles.topSection}>
                <div style={styles.logo}>
                    <BsChatDotsFill size={24} color="#0066ff" />
                </div>

                <div style={styles.navItemActive}>
                    <BiHistory size={22} />
                </div>
                <div style={styles.navItem}>
                    <BsPeople size={22} />
                </div>
                <div style={styles.navItem}>
                    <BsTelephone size={20} />
                </div>
            </div>

            {/* Bottom Section */}
            <div style={styles.bottomSection}>
                <div style={styles.navItem} onClick={onLogout} title="Sign Out">
                    <RiLogoutCircleLine size={22} />
                </div>
                <div style={styles.navItem} onClick={onProfileClick} title="Settings">
                    <BsGear size={20} />
                </div>
                <div style={styles.avatar} onClick={onProfileClick} title="Profile">
                    <img src="https://ui-avatars.com/api/?name=Me" alt="Me" style={{ width: '100%', borderRadius: '50%' }} />
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '64px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #eaeef2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        justifyContent: 'space-between',
    },
    topSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
    },
    bottomSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
    },
    logo: {
        marginBottom: '10px',
    },
    navItem: {
        cursor: 'pointer',
        color: '#6e7a8a',
        padding: '10px',
        borderRadius: '10px',
        transition: 'all 0.2s',
    },
    navItemActive: {
        cursor: 'pointer',
        color: '#0066ff',
        backgroundColor: '#eff6ff',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,102,255,0.1)'
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        cursor: 'pointer',
    }
};

export default NavRail;
