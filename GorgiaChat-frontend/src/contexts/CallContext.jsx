import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [callState, setCallState] = useState({
        isReceivingCall: false,
        isCallActive: false,
        isMuted: false,
        isVideoEnabled: false,
        isVideoCall: false,
        caller: null,
        receiver: null,
        callRejected: false,
    });
    const [callTimer, setCallTimer] = useState(0);
    const timerIntervalRef = useRef(null);
    const [lastCallDuration, setLastCallDuration] = useState(null);

    const user = useSelector(state => state.auth.user);
    const socketRef = useRef();
    const peerConnectionRef = useRef();
    const localStreamRef = useRef();
    const remoteStreamRef = useRef();
    const remoteAudioRef = useRef();
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    useEffect(() => {
        socketRef.current = io('http://localhost:3000');

        if (user?.id) {
            console.log("CallContext registering user with socket:", user.id);
            socketRef.current.emit('user-connected', {
                userId: parseInt(user.id),
                userInfo: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        }

        socketRef.current.on('incoming-call', async ({ from, offer, isVideo }) => {
            console.log("🔔 Received incoming call from:", from, isVideo ? "(video call)" : "(audio call)");

            try {
                const audio = new Audio('/sounds/ringtone.mp3');
                audio.loop = true;
                audio.play();
                sessionStorage.setItem('ringtone', 'playing');
            } catch (err) {
                console.log("Could not play ringtone:", err);
            }

            const callerInfo = {
                id: from.id,
                username: from.username || from.name || `User ${from.id}`,
                email: from.email || ''
            };

            console.log("Setting call state for incoming call from:", callerInfo.username);

            setCallState(prev => ({
                ...prev,
                isReceivingCall: true,
                isVideoCall: isVideo,
                caller: callerInfo
            }));

            peerConnectionRef.current = {
                from: callerInfo,
                offer,
                isVideo
            };
        });

        socketRef.current.on('call-failed', ({ reason }) => {
            alert(`Call failed: ${reason === 'user-not-connected' ? 'User is not online' : 'Connection error'}`);
            cleanupCall();
        });

        socketRef.current.on('call-accepted', async ({ answer }) => {
            try {
                const remoteDesc = new RTCSessionDescription(answer);
                await peerConnectionRef.current.connection.setRemoteDescription(remoteDesc);
                // Start timer for caller when call is accepted
                startTimer();
            } catch (error) {
                console.error("Error setting remote description:", error);
            }
        });

        socketRef.current.on('call-rejected', () => {
            console.log("Call was rejected");

            setCallState(prev => ({
                ...prev,
                callRejected: true
            }));

            setTimeout(() => {
                setCallState(prev => ({
                    ...prev,
                    callRejected: false
                }));
            }, 5000);

            cleanupCall();
        });

        socketRef.current.on('ice-candidate', async ({ candidate }) => {
            try {
                if (peerConnectionRef.current?.connection) {
                    await peerConnectionRef.current.connection.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );
                }
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        });

        socketRef.current.on('call-ended', () => {
            cleanupCall();
        });

        return () => {
            cleanupCall();
            socketRef.current?.disconnect();
        };
    }, [user?.id]);

    const startTimer = () => {
        setCallTimer(0);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
            setCallTimer(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setLastCallDuration(callTimer);
        setCallTimer(0);
    };

    const initiateCall = async (receiverId, withVideo = false) => {
        console.log(`Initiating ${withVideo ? 'video' : 'audio'} call to user ${receiverId}`);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Your browser doesn't support media devices. Please use a modern browser.");
                return;
            }

            console.log("Requesting media access:", { audio: true, video: withVideo });

            try {
                localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: withVideo ? { width: 640, height: 480 } : false
                });

                console.log("Media access granted:",
                    `audio tracks: ${localStreamRef.current.getAudioTracks().length}`,
                    `video tracks: ${localStreamRef.current.getVideoTracks().length}`);
            } catch (mediaError) {
                console.error("Failed to get media access:", mediaError);
                if (mediaError.name === "NotAllowedError") {
                    alert("Camera/microphone access denied. Please grant permission to use video calls.");
                } else {
                    alert(`Media error: ${mediaError.message || mediaError.name}`);
                }
                return;
            }

            const peerConnection = new RTCPeerConnection(configuration);

            localStreamRef.current.getTracks().forEach(track => {
                console.log(`Adding ${track.kind} track to peer connection`);
                peerConnection.addTrack(track, localStreamRef.current);
            });

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE candidate generated", event.candidate.candidate.substring(0, 50) + "...");
                    socketRef.current.emit('ice-candidate', {
                        to: receiverId,
                        candidate: event.candidate
                    });
                }
            };

            peerConnection.ontrack = (event) => {
                console.log(`Remote ${event.track.kind} track received`);
                remoteStreamRef.current = event.streams[0];

                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                }

                if (remoteVideoRef.current && event.track.kind === 'video') {
                    remoteVideoRef.current.srcObject = remoteStreamRef.current;
                }
            };

            console.log("Creating offer");
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log("Offer created and set as local description");

            peerConnectionRef.current = {
                connection: peerConnection,
                to: receiverId,
                isVideo: withVideo
            };

            let receiverInfo = { id: receiverId };
            try {
                const chatList = JSON.parse(localStorage.getItem('chatList') || '[]');
                const selectedChat = chatList.find(chat => chat.id === receiverId);
                if (selectedChat) {
                    receiverInfo = {
                        id: receiverId,
                        username: selectedChat.name,
                        email: selectedChat.email || ''
                    };
                }
            } catch (error) {
                console.log("Could not get receiver info from chat list");
            }

            const completeUserInfo = {
                id: user.id,
                username: user.username || sessionStorage.getItem('username') || localStorage.getItem('username'),
                email: user.email || sessionStorage.getItem('email') || localStorage.getItem('email')
            };

            console.log(`Emitting call-user event to ${receiverId}, with video: ${withVideo}`);
            socketRef.current.emit('call-user', {
                to: receiverId,
                from: completeUserInfo,
                offer,
                isVideo: withVideo
            });

            if (localVideoRef.current && withVideo) {
                console.log("Setting local video element source");
                localVideoRef.current.srcObject = localStreamRef.current;
            }

            setCallState(prev => ({
                ...prev,
                isCallActive: true,
                isVideoEnabled: withVideo,
                isVideoCall: withVideo,
                receiver: receiverInfo
            }));
        } catch (error) {
            console.error("Error initiating call:", error);
            alert(`Error starting call: ${error.message || "Unknown error"}`);
            cleanupCall();
        }
    };

    const acceptCall = async () => {
        try {
            if (sessionStorage.getItem('ringtone') === 'playing') {
                sessionStorage.removeItem('ringtone');
            }

            const { from, offer, isVideo } = peerConnectionRef.current;
            console.log("Accepting call from:", from, isVideo ? "(video call)" : "(audio call)");

            localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            });

            const peerConnection = new RTCPeerConnection(configuration);

            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit('ice-candidate', {
                        to: from.id,
                        candidate: event.candidate
                    });
                }
            };

            peerConnection.ontrack = (event) => {
                remoteStreamRef.current = event.streams[0];

                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                }

                if (remoteVideoRef.current && event.track.kind === 'video') {
                    remoteVideoRef.current.srcObject = remoteStreamRef.current;
                }
            };

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            peerConnectionRef.current = {
                connection: peerConnection,
                to: from.id,
                isVideo
            };

            socketRef.current.emit('call-answer', {
                to: parseInt(from.id),
                answer,
                accepted: true
            });

            if (localVideoRef.current && isVideo) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
            setCallState(prev => ({
                ...prev,
                isReceivingCall: false,
                isCallActive: true,
                isVideoEnabled: isVideo,
                isVideoCall: isVideo,
                caller: from
            }));
            startTimer();
        } catch (error) {
            console.error("Error accepting call:", error);
            rejectCall();
        }
    };

    const rejectCall = () => {
        if (sessionStorage.getItem('ringtone') === 'playing') {
            sessionStorage.removeItem('ringtone');
        }

        const { from } = peerConnectionRef.current || {};

        if (from) {
            console.log("Rejecting call from:", from.id);
            socketRef.current.emit('call-answer', {
                to: parseInt(from.id),
                accepted: false
            });
        }

        cleanupCall();
    };

    const endCall = () => {
        const { to } = peerConnectionRef.current || {};
        if (to) {
            socketRef.current.emit('end-call', { to, duration: callTimer });
        }
        stopTimer();
        cleanupCall();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTracks = localStreamRef.current.getAudioTracks();
            if (audioTracks.length > 0) {
                const track = audioTracks[0];
                track.enabled = !track.enabled;
                setCallState(prev => ({
                    ...prev,
                    isMuted: !track.enabled
                }));
            }
        }
    };

    const toggleVideo = () => {
        if (!localStreamRef.current || !callState.isVideoCall) return;

        const videoTracks = localStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
            const track = videoTracks[0];
            track.enabled = !track.enabled;
            setCallState(prev => ({
                ...prev,
                isVideoEnabled: track.enabled
            }));
        }
    };

    const cleanupCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (peerConnectionRef.current?.connection) {
            peerConnectionRef.current.connection.close();
        }

        setCallState(prev => ({
            isReceivingCall: false,
            isCallActive: false,
            isMuted: false,
            isVideoEnabled: false,
            isVideoCall: false,
            caller: null,
            receiver: null,
            callRejected: prev.callRejected
        }));

        peerConnectionRef.current = null;
    };

    const setAudioRef = (ref) => {
        remoteAudioRef.current = ref;
        if (ref && remoteStreamRef.current) {
            ref.srcObject = remoteStreamRef.current;
        }
    };

    const setVideoRefs = (localRef, remoteRef) => {
        console.log("Setting video refs:", !!localRef, !!remoteRef);
        localVideoRef.current = localRef;
        remoteVideoRef.current = remoteRef;

        if (localRef && localStreamRef.current) {
            console.log("Updating local video element with stream");
            localRef.srcObject = localStreamRef.current;
        }

        if (remoteRef && remoteStreamRef.current) {
            console.log("Updating remote video element with stream");
            remoteRef.srcObject = remoteStreamRef.current;
        }
    };

    return (
        <CallContext.Provider value={{
            callState,
            initiateCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleVideo,
            setAudioRef,
            setVideoRefs,
            dismissRejection: () => setCallState(prev => ({ ...prev, callRejected: false })),
            callTimer,
            lastCallDuration
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
