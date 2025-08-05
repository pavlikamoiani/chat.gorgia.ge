import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [callState, setCallState] = useState({
        isReceivingCall: false,
        isCallActive: false,
        isMuted: false,
        caller: null,
        receiver: null,
        callRejected: false,
    });

    const user = useSelector(state => state.auth.user);
    const socketRef = useRef();
    const peerConnectionRef = useRef();
    const localStreamRef = useRef();
    const remoteStreamRef = useRef();
    const remoteAudioRef = useRef();

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

        socketRef.current.on('incoming-call', async ({ from, offer }) => {
            console.log("🔔 Received incoming call from:", from);

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
                caller: callerInfo
            }));

            peerConnectionRef.current = {
                from: callerInfo,
                offer
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

    const initiateCall = async (receiverId) => {
        try {
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            const peerConnection = new RTCPeerConnection(configuration);

            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit('ice-candidate', {
                        to: receiverId,
                        candidate: event.candidate
                    });
                }
            };

            peerConnection.ontrack = (event) => {
                remoteStreamRef.current = event.streams[0];
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            peerConnectionRef.current = {
                connection: peerConnection,
                to: receiverId
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

            console.log("Sending call with user info:", completeUserInfo);
            console.log("To receiver:", receiverInfo);

            socketRef.current.emit('call-user', {
                to: receiverId,
                from: completeUserInfo,
                offer
            });

            setCallState(prev => ({
                ...prev,
                isCallActive: true,
                receiver: receiverInfo
            }));
        } catch (error) {
            console.error("Error initiating call:", error);
            cleanupCall();
        }
    };

    const acceptCall = async () => {
        try {
            if (sessionStorage.getItem('ringtone') === 'playing') {
                sessionStorage.removeItem('ringtone');
            }

            const { from, offer } = peerConnectionRef.current;
            console.log("Accepting call from:", from);

            localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
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
            };

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            peerConnectionRef.current = {
                connection: peerConnection,
                to: from.id
            };

            socketRef.current.emit('call-answer', {
                to: parseInt(from.id),
                answer,
                accepted: true
            });

            setCallState(prev => ({
                ...prev,
                isReceivingCall: false,
                isCallActive: true,
                caller: from
            }));
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
            socketRef.current.emit('end-call', { to });
        }

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

    return (
        <CallContext.Provider value={{
            callState,
            initiateCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            setAudioRef,
            dismissRejection: () => setCallState(prev => ({ ...prev, callRejected: false }))
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
