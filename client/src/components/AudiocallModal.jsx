import React, { useContext, useEffect, useState, useRef } from "react";
import { CallContext } from "../context/CallContext";
import { FiMic, FiMicOff, FiPhoneOff, FiPhone } from "react-icons/fi";

// AudioCallModal
const AudioCallModal = () => {
  const {
    call, callAccepted, callEnded, isCalling, callType,
    remoteStream,
    answerCall, leaveCall, toggleAudio,
  } = useContext(CallContext);

  const [micOn,    setMicOn]    = useState(true);
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef(null);
  const audioRef = useRef(null); // ✅ <audio> element — not <video>

  const isConnected = callAccepted && !callEnded;
  const isIncoming  = call.isReceivingCall && !callAccepted;
  const displayName = call.callerName || "Someone";

  // Live call timer
  useEffect(() => {
    if (isConnected) {
      setCallTime(0);
      timerRef.current = setInterval(() => setCallTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isConnected]);

  const fmt = s =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ✅ Pipe remote audio into <audio> element (not <video>)
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {});
      console.log("[AudioCallModal] ✅ remote audio stream attached");
    }
  }, [remoteStream, callAccepted]);

  const handleMic = () => { setMicOn(p => !p); toggleAudio(); };

  // ✅ Only show for audio calls — returns nothing for video calls
  if (callType !== "audio") return null;
  if (!isCalling && !call.isReceivingCall && !callAccepted) return null;

  return (
    <div style={S.overlay}>

      {/* ✅ Audio output — plain <audio> tag, no video element at all */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />

      <div style={S.card}>

        {/* Pulsing rings while ringing / calling */}
        {!isConnected && (
          <div style={S.ringsWrap} aria-hidden="true">
            <div style={{ ...S.ring, animation: "ringPulse 2s ease-out infinite 0s"   }} />
            <div style={{ ...S.ring, animation: "ringPulse 2s ease-out infinite 0.6s" }} />
            <div style={{ ...S.ring, animation: "ringPulse 2s ease-out infinite 1.2s" }} />
          </div>
        )}

        {/* Avatar */}
        <div style={S.avatarWrap}>
          <div style={S.avatar}>{displayName.charAt(0).toUpperCase()}</div>
          {isConnected && <div style={S.onlineDot} />}
        </div>

        {/* Name */}
        <p style={S.name}>{displayName}</p>

        {/* Status / timer */}
        <p style={S.status}>
          {isIncoming && !isConnected
            ? "Incoming audio call..."
            : isConnected
            ? fmt(callTime)
            : "Calling..."}
        </p>

        {/* Controls */}
        <div style={S.controls}>
          {isIncoming ? (
            <>
              <BtnGroup label="Accept"  color="#22c55e" onClick={answerCall}>
                <FiPhone size={28} color="#fff" />
              </BtnGroup>
              <BtnGroup label="Decline" color="#ef4444" onClick={leaveCall}>
                <FiPhoneOff size={28} color="#fff" />
              </BtnGroup>
            </>
          ) : (
            <>
              <BtnGroup
                label={micOn ? "Mute" : "Unmute"}
                color={micOn ? "rgba(255,255,255,0.15)" : "#fff"}
                onClick={handleMic}
              >
                {micOn
                  ? <FiMic    size={26} color="#fff" />
                  : <FiMicOff size={26} color="#111" />}
              </BtnGroup>
              <BtnGroup label="End call" color="#ef4444" onClick={leaveCall}>
                <FiPhoneOff size={28} color="#fff" />
              </BtnGroup>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ringPulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.6); opacity: 0;    }
        }
      `}</style>
    </div>
  );
};

const BtnGroup = ({ children, label, color, onClick }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
    <button
      onClick={onClick}
      style={{
        width:68, height:68, borderRadius:"50%", border:"none",
        background: color, cursor:"pointer",
        display:"flex", justifyContent:"center", alignItems:"center",
        boxShadow:"0 6px 20px rgba(0,0,0,0.35)",
        transition:"transform .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {children}
    </button>
    <span style={{ color:"rgba(255,255,255,0.55)", fontSize:12, fontWeight:500 }}>
      {label}
    </span>
  </div>
);

const S = {
  overlay:   {
    position:"fixed", inset:0, zIndex:2000,
    display:"flex", justifyContent:"center", alignItems:"center",
    background:"rgba(0,0,0,0.8)", backdropFilter:"blur(12px)",
  },
  card:      {
    position:"relative", width:300, padding:"56px 32px 44px",
    borderRadius:32,
    background:"linear-gradient(155deg,#1e293b,#0f172a)",
    display:"flex", flexDirection:"column", alignItems:"center", gap:16,
    boxShadow:"0 28px 80px rgba(0,0,0,0.65)", overflow:"hidden",
  },
  ringsWrap: {
    position:"absolute", top:56, left:"50%", transform:"translateX(-50%)",
    width:120, height:120,
    display:"flex", justifyContent:"center", alignItems:"center",
  },
  ring:      {
    position:"absolute", width:120, height:120,
    borderRadius:"50%", border:"2.5px solid rgba(99,102,241,0.55)",
  },
  avatarWrap:{ position:"relative", zIndex:1 },
  avatar:    {
    width:120, height:120, borderRadius:"50%",
    background:"linear-gradient(135deg,#3b82f6,#6366f1)",
    display:"flex", justifyContent:"center", alignItems:"center",
    fontSize:50, color:"#fff", fontWeight:700,
    boxShadow:"0 0 40px rgba(99,102,241,0.45)",
  },
  onlineDot: {
    position:"absolute", bottom:7, right:7,
    width:18, height:18, borderRadius:"50%",
    background:"#22c55e", border:"2.5px solid #0f172a",
  },
  name:      { color:"#fff", fontSize:24, fontWeight:700, margin:0, textAlign:"center" },
  status:    { color:"rgba(255,255,255,0.5)", fontSize:15, margin:0, minHeight:22 },
  controls:  { display:"flex", gap:40, marginTop:20 },
};

export default AudioCallModal;