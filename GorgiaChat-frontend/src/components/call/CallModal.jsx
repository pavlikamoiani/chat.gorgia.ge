import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { MdCallEnd, MdMic, MdMicOff, MdVideocam, MdVideocamOff } from 'react-icons/md';
import { useCall } from '../../contexts/CallContext';
import styles from '../../assets/css/CallModal.module.css';

const CallModal = () => {
    const { callState, endCall, toggleMute, toggleVideo, setAudioRef, setVideoRefs, callTimer } = useCall();
    const { isCallActive, isMuted, isVideoEnabled, isVideoCall, caller, receiver } = callState;
    const [displayName, setDisplayName] = useState('');
    const [displayAvatar, setDisplayAvatar] = useState('?');

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const otherParticipant = caller || receiver;

    // Use useLayoutEffect to ensure references are set before any rendering happens
    useLayoutEffect(() => {
        console.log("CallModal: Setting video refs on mount");
        setVideoRefs(localVideoRef.current, remoteVideoRef.current);
    }, []);

    useEffect(() => {
        console.log("CallModal: call state updated", { isCallActive, isVideoCall });

        if (isCallActive && isVideoCall) {
            console.log("CallModal: Updating video refs after call became active");
            setVideoRefs(localVideoRef.current, remoteVideoRef.current);
        }
    }, [isCallActive, isVideoCall, setVideoRefs]);

    useEffect(() => {
        console.log("Call state updated:", callState);

        if (otherParticipant) {
            console.log("Other participant info:", otherParticipant);

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

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!isCallActive) return null;

    return (
        <div className={`${styles.modalOverlay} ${isVideoCall ? styles.videoCall : ''}`}>
            <div className={`${styles.modalContent} ${isVideoCall ? styles.videoContent : ''}`}>
                <audio ref={setAudioRef} autoPlay />

                {isVideoCall && (
                    <div className={styles.videoContainer}>
                        <video
                            ref={remoteVideoRef}
                            className={styles.remoteVideo}
                            autoPlay
                            playsInline
                        />
                        <video
                            ref={localVideoRef}
                            className={styles.localVideo}
                            autoPlay
                            playsInline
                            muted
                        />

                        <div className={styles.videoStatus}>
                            {isVideoEnabled ? 'Video active' : 'Video paused'}
                        </div>

                        {!isVideoEnabled && (
                            <div className={styles.noVideoOverlay}>
                                <div className={styles.callerAvatar}>
                                    {displayAvatar}
                                </div>
                                <div className={styles.callerName}>
                                    {displayName}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isVideoCall && (
                    <div className={styles.callInfo}>
                        <div className={styles.callerAvatar}>
                            {displayAvatar}
                        </div>
                        <div className={styles.callerName}>
                            {displayName}
                        </div>
                        <div className={styles.callStatus}>
                            {callTimer > 0
                                ? `Call duration: ${formatTimer(callTimer)}`
                                : `Call in progress...`}
                        </div>
                    </div>
                )}
                {/* 
                {isCallActive && (
                    <div className={styles.callTimer}>
                        Call duration: {formatTimer(callTimer)}
                    </div>
                )} */}

                <div className={styles.callControls}>
                    <button
                        className={`${styles.callButton} ${isMuted ? styles.active : ''}`}
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <MdMicOff size={24} /> : <MdMic size={24} />}
                    </button>

                    {isVideoCall && (
                        <button
                            className={`${styles.callButton} ${!isVideoEnabled ? styles.active : ''}`}
                            onClick={toggleVideo}
                            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                        >
                            {isVideoEnabled ? <MdVideocam size={24} /> : <MdVideocamOff size={24} />}
                        </button>
                    )}

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
