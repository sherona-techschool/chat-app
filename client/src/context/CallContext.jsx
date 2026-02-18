import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { SocketContext } from './SocketContext';

const CallContext = createContext();

const CallProvider = ({ children }) => {
    const { socket } = useContext(SocketContext);
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [name, setName] = useState('');
    const [myVideo, setMyVideo] = useState(null);
    const [userVideo, setUserVideo] = useState(null);
    const [connectionRef, setConnectionRef] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [callType, setCallType] = useState('video');
    const [callTo, setCallTo] = useState(null); // ID of person we are calling

    // Refs for current values in callbacks
    const socketRef = useRef();
    socketRef.current = socket;

    useEffect(() => {
        if (!socket) return;

        socket.on('call-user', ({ from, signal, type }) => {
            console.log('Incoming call from', from, 'type:', type);
            setCall({ isReceivingCall: true, from, signal, type });
            setCallType(type || 'video');
        });

        socket.on('end-call', () => {
            resetCallState();
        });

        // We need to handle other events too inside the peer connection logic or here
    }, [socket]);

    const answerCall = async () => {
        setCallAccepted(true);
        const peer = createPeerConnection(call.from);

        // Get local stream based on call type
        // If it's an audio call, video: false
        const isVideo = call.type === 'video' || callType === 'video';

        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: isVideo ? {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    advanced: [{ focusMode: 'continuous' }]
                } : false,
                audio: true
            });
            setStream(currentStream);

            // Only attach to video element if video is present
            if (isVideo && myVideo && myVideo.current) {
                myVideo.current.srcObject = currentStream;
            } else if (myVideo && myVideo.srcObject) {
                // Clear previous stream if any
                myVideo.srcObject = null;
            }

            currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

            // Answer logic continues in createPeerConnection or triggered by caller's offer
        } catch (err) {
            console.error("Error accessing media devices", err);
        }
    };


    // const [callType, setCallType] = useState('video'); // 'video' or 'audio' - This line is a duplicate and should be removed if it's not intended to be a separate state. Assuming the one at the top is the correct one.

    // ...

    const callUser = async (id) => {
        setIsCalling(true);
        setCallType('video');
        setCallTo(id);

        const peer = createPeerConnection(id);

        const currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                advanced: [{ focusMode: 'continuous' }]
            },
            audio: true
        });
        setStream(currentStream);
        if (myVideo) myVideo.srcObject = currentStream;

        currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit('call-user', { from: socket.userId, to: id, type: 'video' });
        socket.emit('webrtc-offer', { from: socket.userId, to: id, offer });
    };

    const callUserAudio = async (id) => {
        setIsCalling(true);
        setCallType('audio');
        setCallTo(id);

        const peer = createPeerConnection(id);

        const currentStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setStream(currentStream);
        // if (myVideo) myVideo.srcObject = currentStream; // No video for audio call

        currentStream.getTracks().forEach(track => peer.addTrack(track, currentStream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit('call-user', { from: socket.userId, to: id, type: 'audio' });
        socket.emit('webrtc-offer', { from: socket.userId, to: id, offer });
    };

    const resetCallState = () => {
        setCallEnded(true);
        if (connectionRef) {
            connectionRef.close();
            setConnectionRef(null);
        }
        setStream(null);
        setRemoteStream(null);
        setCallAccepted(false);
        setIsCalling(false);
        setCall({});
        setCallTo(null);
    };

    const leaveCall = () => {
        const targetId = call.from || callTo;
        if (targetId) {
            socket.emit('end-call', { from: socket.userId, to: targetId, callType });
        }
        resetCallState();
    };

    const createPeerConnection = (remoteUserId) => {
        const turnIp = import.meta.env.VITE_TURN_IP;
        const turnPort = import.meta.env.VITE_TURN_PORT;
        const turnUser = import.meta.env.VITE_TURN_USERNAME;
        const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                {
                    urls: `turn:${turnIp}:${turnPort}?transport=udp`,
                    username: turnUser,
                    credential: turnPassword
                },
                {
                    urls: `turn:${turnIp}:${turnPort}?transport=tcp`,
                    username: turnUser,
                    credential: turnPassword
                }
            ]
        });

        setConnectionRef(peer);

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { from: socket.userId, to: remoteUserId, candidate: event.candidate });
            }
        };

        peer.ontrack = (event) => {
            console.log('Got remote stream', event.streams[0]);
            setRemoteStream(event.streams[0]);
        };

        // Socket listeners for this specific peer
        socket.on('webrtc-offer', async ({ offer }) => {
            if (!peer.currentRemoteDescription) {
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('webrtc-answer', { from: socket.userId, to: remoteUserId, answer });
            }
        });

        socket.on('webrtc-answer', async ({ answer }) => {
            await peer.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error adding received ice candidate', e);
            }
        });

        socket.on('call-accepted', () => {
            setCallAccepted(true);
        });

        // socket.on('end-call') moved to global useEffect

        return peer;
    };



    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        }
    };

    const shareScreen = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            if (connectionRef) {
                const senders = connectionRef.getSenders();
                const sender = senders.find(s => s.track.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            }

            // Update local view
            if (myVideo) myVideo.srcObject = screenStream;
            setStream(screenStream);

            screenTrack.onended = () => {
                stopScreenShare();
            };

        } catch (error) {
            console.error("Failed to share screen", error);
        }
    };

    const stopScreenShare = async () => {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: true
        });
        const videoTrack = webcamStream.getVideoTracks()[0];

        if (connectionRef) {
            const senders = connectionRef.getSenders();
            const sender = senders.find(s => s.track.kind === 'video');
            if (sender) {
                sender.replaceTrack(videoTrack);
            }
        }

        if (myVideo) myVideo.srcObject = webcamStream;
        setStream(webcamStream);
    };

    return (
        <CallContext.Provider value={{
            call,
            callAccepted,
            myVideo: (el) => setMyVideo(el),
            userVideo: (el) => setUserVideo(el),
            stream,
            remoteStream,
            name,
            setName,
            callEnded,
            isCalling,
            callUser,
            callUserAudio,
            answerCall,
            leaveCall,
            toggleAudio,
            toggleVideo,
            shareScreen,
            callType
        }}>
            {children}
        </CallContext.Provider>
    );
};

export { CallProvider, CallContext };
