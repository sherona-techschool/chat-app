import React, { useContext, useEffect, useRef, useState } from 'react';
import { CallContext } from '../context/CallContext';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhoneOff, FiPhoneIncoming } from 'react-icons/fi';

const VideoCallModal = () => {
    const {
        call,
        callAccepted,
        stream,
        remoteStream,
        callEnded,
        leaveCall,
        answerCall,
        isCalling,
        toggleAudio,
        toggleVideo,
        shareScreen,
        callType
    } = useContext(CallContext);

    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const myVideoRef = useRef();
    const userVideoRef = useRef();

    useEffect(() => {
        if (stream && myVideoRef.current) {
            myVideoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (remoteStream && userVideoRef.current) {
            userVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callAccepted, callEnded]);

    const handleToggleAudio = () => {
        setMicOn(!micOn);
        toggleAudio();
    };

    const handleToggleVideo = () => {
        setCamOn(!camOn);
        toggleVideo();
    };

    if (!isCalling && !call.isReceivingCall && !callAccepted) return null;

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.fullScreenContainer}>

                {/* REMOTE VIDEO (MAIN BACKGROUND) */}
                <div style={styles.remoteVideoWrapper}>
                    {callAccepted && !callEnded ? (
                        <>
                            <video
                                playsInline
                                ref={userVideoRef}
                                autoPlay
                                style={{
                                    ...styles.remoteVideo,
                                    display: callType === 'audio' ? 'none' : 'block'
                                }}
                            />
                            {callType === 'audio' && (
                                <div style={styles.placeholderRemote}>
                                    <div style={styles.audioAvatar}>
                                        <span style={{ fontSize: '40px' }}>User</span>
                                    </div>
                                    <h3 style={{ color: 'white', marginTop: '20px' }}>Audio Call..</h3>
                                    {/* Helper audio element if video display none affects playback in some browsers, 
                                        but usually video tag works. Using visibility hidden is safer if display none fails.
                                    */}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={styles.placeholderRemote}>
                            <h2 style={{ color: 'white' }}>{call.isReceivingCall ? `${call.from || 'Someone'} is calling...` : 'Calling...'}</h2>
                            {callType === 'audio' && <p style={{ color: '#ccc' }}>Audio Call</p>}
                        </div>
                    )}
                </div>

                {/* LOCAL VIDEO (PiP) */}
                {stream && camOn && (
                    <div style={styles.localVideoWrapper}>
                        <video playsInline muted ref={myVideoRef} autoPlay className="" />
                    </div>
                )}

                {/* CONTROLS BAR */}
                <div style={styles.controlsBar}>
                    {call.isReceivingCall && !callAccepted ? (
                        <>
                            <button onClick={answerCall} style={styles.controlBtnBlue} title="Answer">
                                <FiPhoneIncoming size={24} /> Accept
                            </button>
                            <button onClick={leaveCall} style={styles.controlBtnRed} title="Reject">
                                <FiPhoneOff size={24} /> Reject
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleToggleAudio} style={micOn ? styles.controlBtn : styles.controlBtnActive} title="Toggle Mic">
                                {micOn ? <FiMic size={24} /> : <FiMicOff size={24} />}
                            </button>
                            <button onClick={handleToggleVideo} style={camOn ? styles.controlBtn : styles.controlBtnActive} title="Toggle Camera">
                                {camOn ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
                            </button>
                            <button onClick={shareScreen} style={styles.controlBtn} title="Share Screen">
                                <FiMonitor size={24} />
                            </button>
                            <button onClick={leaveCall} style={styles.controlBtnRed} title="End Call">
                                <FiPhoneOff size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
    },
    fullScreenContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#1f2937',
    },
    remoteVideoWrapper: {
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    remoteVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    placeholderRemote: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    },
    localVideoWrapper: {
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '320px', // Larger usage for better visibility
        height: '180px', // 16:9 aspect ratio
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#000',
        zIndex: 10, // Ensure it's above other elements
    },
    localVideo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)', // Mirror the self-view
        filter: 'brightness(1.1) contrast(1.1)', // Enhance visibility
    },
    controlsBar: {
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        padding: '15px 30px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '50px',
    },
    controlBtn: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.2s',
    },
    controlBtnActive: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: 'none',
        background: 'white',
        color: '#333',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlBtnRed: {
        width: '120px', // Wide button for End/Reject
        height: '50px',
        borderRadius: '25px',
        border: 'none',
        background: '#ef4444',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
    },
    controlBtnBlue: {
        width: '120px',
        height: '50px',
        borderRadius: '25px',
        border: 'none',
        background: '#3b82f6',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
    },
    audioAvatar: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '30px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    }
};

export default VideoCallModal;
