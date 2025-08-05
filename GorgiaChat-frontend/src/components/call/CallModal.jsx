import React, { useEffect, useState } from 'react';
import { MdCallEnd, MdMic, MdMicOff } from 'react-icons/md';
import { useCall } from '../../contexts/CallContext';
import styles from '../../assets/css/CallModal.module.css';

const CallModal = () => {
    const { callState, endCall, toggleMute, setAudioRef } = useCall();
    const { isCallActive, isMuted, caller, receiver } = callState;
    const [displayName, setDisplayName] = useState('');
    const [displayAvatar, setDisplayAvatar] = useState('?');

    // Get the other participant's info (either caller or receiver)
    const otherParticipant = caller || receiver;

    useEffect(() => {
        console.log("Call state updated:", callState);

        if (otherParticipant) {
            console.log("Other participant info:", otherParticipant);

            // Set display name with fallbacks
            if (otherParticipant.username) {
                setDisplayName(otherParticipant.username);
                setDisplayAvatar(otherParticipant.username[0].toUpperCase());
            } else if (otherParticipant.name) {
                setDisplayName(otherParticipant.name);
                setDisplayAvatar(otherParticipant.name[0].toUpperCase());
            } else if (otherParticipant.id) {
                setDisplayName(`User ${otherParticipant.id}`);
                setDisplayAvatar(`${otherParticipant.id}`);
            } else {
                setDisplayName("Unknown");
                setDisplayAvatar("?");
            }
        }
    }, [callState, otherParticipant]);

    // Set up keypress listener to end call with Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                endCall();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [endCall]);

    if (!isCallActive) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <audio ref={setAudioRef} autoPlay />

                <div className={styles.callInfo}>
                    <div className={styles.callerAvatar}>
                        {displayAvatar}
                    </div>
                    <div className={styles.callerName}>
                        {displayName}
                    </div>
                    <div className={styles.callStatus}>
                        Call in progress...
                    </div>
                </div>

                <div className={styles.callControls}>
                    <button
                        className={`${styles.callButton} ${isMuted ? styles.active : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <MdMicOff size={24} /> : <MdMic size={24} />}
                    </button>

                    <button
                        className={`${styles.callButton} ${styles.endCall}`}
                        onClick={endCall}
                        title="End call"
                    >
                        <MdCallEnd size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallModal;
