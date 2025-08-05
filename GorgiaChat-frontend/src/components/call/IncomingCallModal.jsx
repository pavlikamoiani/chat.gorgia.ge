import React, { useEffect, useState } from 'react';
import { MdCallEnd, MdCall } from 'react-icons/md';
import { useCall } from '../../contexts/CallContext';
import styles from '../../assets/css/CallModal.module.css';

const IncomingCallModal = () => {
    const { callState, acceptCall, rejectCall } = useCall();
    const { isReceivingCall, caller } = callState;
    const [displayName, setDisplayName] = useState('');
    const [displayAvatar, setDisplayAvatar] = useState('?');
    const [blink, setBlink] = useState(false);

    // Add blinking effect
    useEffect(() => {
        if (isReceivingCall) {
            const blinkInterval = setInterval(() => {
                setBlink(prev => !prev);
            }, 500);

            return () => clearInterval(blinkInterval);
        }
    }, [isReceivingCall]);

    useEffect(() => {
        console.log("Incoming call state:", callState);

        if (caller) {
            console.log("Caller info:", caller);

            // Set display name with fallbacks
            if (caller.username) {
                setDisplayName(caller.username);
                setDisplayAvatar(caller.username[0].toUpperCase());
            } else if (caller.name) {
                setDisplayName(caller.name);
                setDisplayAvatar(caller.name[0].toUpperCase());
            } else if (caller.id) {
                setDisplayName(`User ${caller.id}`);
                setDisplayAvatar(`${caller.id}`);
            } else {
                setDisplayName("Unknown");
                setDisplayAvatar("?");
            }
        }
    }, [callState, caller]);

    useEffect(() => {
        // Set up keypress listener to reject call with Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                rejectCall();
            } else if (e.key === 'Enter') {
                acceptCall();
            }
        };

        if (isReceivingCall) {
            console.log("Showing incoming call modal");
            window.addEventListener('keydown', handleKeyDown);

            // Auto-reject call after 30 seconds if not answered
            const timeout = setTimeout(() => {
                console.log("Auto-rejecting call after timeout");
                rejectCall();
            }, 30000);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                clearTimeout(timeout);
            };
        }
    }, [isReceivingCall, rejectCall, acceptCall]);

    if (!isReceivingCall) return null;

    return (
        <div className={`${styles.modalOverlay} ${styles.incomingCall}`}>
            <div
                className={`${styles.modalContent} ${blink ? styles.blinking : ''}`}
                style={{ boxShadow: blink ? '0 0 20px rgba(76, 175, 80, 0.6)' : '0 0 20px rgba(0, 0, 0, 0.5)' }}
            >
                <div className={styles.callInfo}>
                    <div className={`${styles.callerAvatar} ${styles.pulse}`}>
                        {displayAvatar}
                    </div>
                    <div className={styles.callerName}>
                        {displayName}
                    </div>
                    <div className={styles.callStatus}>
                        Incoming call...
                    </div>
                </div>

                <div className={styles.callControls}>
                    <button
                        className={`${styles.callButton} ${styles.acceptCall}`}
                        onClick={acceptCall}
                        title="Accept call"
                    >
                        <MdCall size={24} />
                    </button>

                    <button
                        className={`${styles.callButton} ${styles.rejectCall}`}
                        onClick={rejectCall}
                        title="Reject call"
                    >
                        <MdCallEnd size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
