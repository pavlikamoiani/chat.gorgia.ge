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
        callRejected: false,  // New state for showing rejection message
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

        // Register user if needed
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

        // Handle incoming call
        socketRef.current.on('incoming-call', async ({ from, offer }) => {
            console.log("🔔 Received incoming call from:", from);

            // Play a ringtone
            try {
                const audio = new Audio('/sounds/ringtone.mp3');
                audio.loop = true;
                audio.play();
                sessionStorage.setItem('ringtone', 'playing');
            } catch (err) {
                console.log("Could not play ringtone:", err);
            }

            // Make sure we have a complete caller object
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

            // Store the offer to use when accepting the call
            peerConnectionRef.current = {
                from: callerInfo,
                offer
            };
        });

        // Handle call failures
        socketRef.current.on('call-failed', ({ reason }) => {
            alert(`Call failed: ${reason === 'user-not-connected' ? 'User is not online' : 'Connection error'}`);
            cleanupCall();
        });

        // Handle call accepted
        socketRef.current.on('call-accepted', async ({ answer }) => {
            try {
                const remoteDesc = new RTCSessionDescription(answer);
                await peerConnectionRef.current.connection.setRemoteDescription(remoteDesc);
            } catch (error) {
                console.error("Error setting remote description:", error);
            }
        });

        // Handle call rejected
        socketRef.current.on('call-rejected', () => {
            console.log("Call was rejected");

            // Instead of alert, set rejection state
            setCallState(prev => ({
                ...prev,
                callRejected: true
            }));

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setCallState(prev => ({
                    ...prev,
                    callRejected: false
                }));
            }, 5000);

            cleanupCall();
        });

        // Handle ICE candidates
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

        // Handle call ended
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
            // Get user media (audio only)
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            // Create peer connection
            const peerConnection = new RTCPeerConnection(configuration);

            // Add tracks to the peer connection
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit('ice-candidate', {
                        to: receiverId,
                        candidate: event.candidate
                    });
                }
            };

            // Handle track events (remote audio)
            peerConnection.ontrack = (event) => {
                remoteStreamRef.current = event.streams[0];
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                }
            };

            // Create offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Store connection
            peerConnectionRef.current = {
                connection: peerConnection,
                to: receiverId
            };

            // Find receiver info in chatList if available
            let receiverInfo = { id: receiverId };
            try {
                // Try to get the selected chat info
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

            // Make sure we have complete user info
            const completeUserInfo = {
                id: user.id,
                username: user.username || sessionStorage.getItem('username') || localStorage.getItem('username'),
                email: user.email || sessionStorage.getItem('email') || localStorage.getItem('email')
            };

            console.log("Sending call with user info:", completeUserInfo);
            console.log("To receiver:", receiverInfo);

            // Send offer to receiver with complete user info
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
            // Stop the ringtone
            if (sessionStorage.getItem('ringtone') === 'playing') {
                sessionStorage.removeItem('ringtone');
            }

            const { from, offer } = peerConnectionRef.current;
            console.log("Accepting call from:", from);

            // Get user media (audio only)
            localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            // Create peer connection
            const peerConnection = new RTCPeerConnection(configuration);

            // Add tracks to the peer connection
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current);
            });

            // Handle ICE candidates
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socketRef.current.emit('ice-candidate', {
                        to: from.id,
                        candidate: event.candidate
                    });
                }
            };

            // Handle track events (remote audio)
            peerConnection.ontrack = (event) => {
                remoteStreamRef.current = event.streams[0];
                if (remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                }
            };

            // Set remote description (offer)
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Create answer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Store connection
            peerConnectionRef.current = {
                connection: peerConnection,
                to: from.id
            };

            // Send answer to caller
            socketRef.current.emit('call-answer', {
                to: parseInt(from.id), // Ensure integer
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
        // Stop the ringtone
        if (sessionStorage.getItem('ringtone') === 'playing') {
            sessionStorage.removeItem('ringtone');
        }

        const { from } = peerConnectionRef.current || {};

        if (from) {
            console.log("Rejecting call from:", from.id);
            socketRef.current.emit('call-answer', {
                to: parseInt(from.id), // Ensure integer
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
        // Stop local stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close peer connection
        if (peerConnectionRef.current?.connection) {
            peerConnectionRef.current.connection.close();
        }

        // Reset call state but keep the rejection state if it's active
        setCallState(prev => ({
            isReceivingCall: false,
            isCallActive: false,
            isMuted: false,
            caller: null,
            receiver: null,
            callRejected: prev.callRejected // Preserve the rejection state
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
            dismissRejection: () => setCallState(prev => ({ ...prev, callRejected: false })) // Add a way to dismiss manually
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
