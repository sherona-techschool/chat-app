

import React, { useContext, useEffect, useState } from "react";
import { CallContext } from "../context/CallContext";
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff,
  FiMonitor, FiPhoneOff, FiPhoneIncoming,
} from "react-icons/fi";

const VideoCallModal = () => {
  const {
    call, callAccepted, callEnded, isCalling, callType,
    myVideo, userVideo,
    stream, remoteStream,
    answerCall, leaveCall,
    toggleAudio, toggleVideo, shareScreen,
    reattachStreams,
  } = useContext(CallContext);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Assign remote stream after DOM renders (callAccepted triggers modal mount)
  useEffect(() => {
    if (remoteStream && userVideo.current) {
      userVideo.current.srcObject = remoteStream;
      userVideo.current.play().catch(() => {});
    }
  }, [remoteStream, callAccepted]);

  // Assign local stream
  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
      myVideo.current.play().catch(() => {});
    }
  }, [stream, callAccepted, isCalling]);

  // Safety net reattach
  useEffect(() => {
    reattachStreams();
  }, [callAccepted, isCalling, stream, remoteStream]);

  const handleMic = () => { setMicOn(p => !p); toggleAudio(); };
  const handleCam = () => { setCamOn(p => !p); toggleVideo(); };

  if (!isCalling && !call.isReceivingCall && !callAccepted) return null;

  const isConnected = callAccepted && !callEnded;
  const isIncoming  = call.isReceivingCall && !callAccepted;
  const displayName = call.callerName || "Someone";

  return (
    <div style={S.overlay}>
      <div style={S.root}>

        {/* REMOTE VIDEO */}
        <div style={S.remoteArea}>
          <video
            ref={userVideo}
            autoPlay
            playsInline
            style={{
              ...S.remoteVideo,
              visibility: (isConnected && callType !== "audio") ? "visible" : "hidden",
            }}
          />
          {(!isConnected || callType === "audio") && (
            <div style={S.placeholder}>
              {isConnected && callType === "audio"
                ? <><div style={S.audioAvatar}>🎙️</div><p style={S.txt}>Audio Call</p></>
                : <p style={S.txt}>{isIncoming ? `${displayName} is calling…` : "Calling…"}</p>
              }
            </div>
          )}
        </div>

        {/* LOCAL PiP */}
        <div style={{ ...S.pip, opacity: stream ? 1 : 0, visibility: stream ? "visible" : "hidden" }}>
          <video
            ref={myVideo}
            autoPlay playsInline muted
            style={{ ...S.pipVideo, filter: camOn ? "none" : "brightness(0.1)" }}
          />
        </div>

        {/* CONTROLS */}
        <div style={S.bar}>
          {isIncoming ? (
            <>
              <Btn color="#22c55e" onClick={answerCall}><FiPhoneIncoming size={20} /> Accept</Btn>
              <Btn color="#ef4444" onClick={leaveCall}><FiPhoneOff size={20} /> Reject</Btn>
            </>
          ) : (
            <>
              <RoundBtn active={!micOn} onClick={handleMic}>
                {micOn ? <FiMic size={22} /> : <FiMicOff size={22} />}
              </RoundBtn>
              <RoundBtn active={!camOn} onClick={handleCam}>
                {camOn ? <FiVideo size={22} /> : <FiVideoOff size={22} />}
              </RoundBtn>
              <RoundBtn onClick={shareScreen}><FiMonitor size={22} /></RoundBtn>
              <Btn color="#ef4444" onClick={leaveCall}><FiPhoneOff size={20} /></Btn>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

const RoundBtn = ({ children, active, onClick }) => (
  <button onClick={onClick} style={active ? S.roundActive : S.round}>{children}</button>
);
const Btn = ({ children, color, onClick }) => (
  <button onClick={onClick} style={{ ...S.pill, background: color }}>{children}</button>
);

const S = {
  overlay:     { position:"fixed", inset:0, zIndex:2000, backgroundColor:"#000", display:"flex" },
  root:        { position:"relative", width:"100%", height:"100%", overflow:"hidden", backgroundColor:"#111827" },
  remoteArea:  { position:"absolute", inset:0, display:"flex", justifyContent:"center", alignItems:"center" },
  remoteVideo: { position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" },
  placeholder: { position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap:16, background:"linear-gradient(135deg,#1e293b,#0f172a)" },
  audioAvatar: { width:96, height:96, borderRadius:"50%", background:"#3b82f6", display:"flex", justifyContent:"center", alignItems:"center", fontSize:44 },
  txt:         { color:"#fff", fontSize:22, fontWeight:600, margin:0 },
  pip:         { position:"absolute", bottom:100, right:20, width:220, height:124, borderRadius:14, overflow:"hidden", border:"2px solid rgba(255,255,255,0.18)", boxShadow:"0 8px 32px rgba(0,0,0,0.55)", backgroundColor:"#000", zIndex:10, transition:"opacity .25s,visibility .25s" },
  pipVideo:    { width:"100%", height:"100%", objectFit:"cover", transform:"scaleX(-1)" },
  bar:         { position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", gap:14, padding:"14px 28px", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(14px)", borderRadius:60, zIndex:20 },
  round:       { width:52, height:52, borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.18)", color:"#fff", cursor:"pointer", display:"flex", justifyContent:"center", alignItems:"center" },
  roundActive: { width:52, height:52, borderRadius:"50%", border:"none", background:"#fff", color:"#111", cursor:"pointer", display:"flex", justifyContent:"center", alignItems:"center" },
  pill:        { height:52, padding:"0 22px", borderRadius:26, border:"none", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8 },
};

export default VideoCallModal;