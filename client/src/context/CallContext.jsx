
import React, {
  createContext, useState, useRef, useEffect, useContext, useCallback
} from "react";
import { SocketContext } from "./SocketContext";

export const CallContext = createContext();

const getRTCConfig = () => {
  const IP   = import.meta.env.VITE_TURN_SERVER_IP;
  const PORT = import.meta.env.VITE_TURN_SERVER_PORT || "3478";
  const USER = import.meta.env.VITE_TURN_USERNAME;
  const PASS = import.meta.env.VITE_TURN_PASSWORD;
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: [
          `turn:${IP}:${PORT}`,
          `turn:${IP}:${PORT}?transport=tcp`,
        ],
        username:   USER,
        credential: PASS,
      },
    ],
    iceCandidatePoolSize: 10,
  };
};

export const CallProvider = ({ children }) => {
  const { socket } = useContext(SocketContext);

  const connectionRef        = useRef(null);
  const myVideo              = useRef(null);
  const userVideo            = useRef(null);
  const pendingOfferRef      = useRef(null);
  const streamRef            = useRef(null);
  const remoteStreamRef      = useRef(null);
  const myMongoIdRef         = useRef(null);
  const remoteUserIdRef      = useRef(null);
  const remoteIceBuffer      = useRef([]);
  const localIceBuffer       = useRef([]);
  const isRemoteDescSetRef   = useRef(false);

  const [call,         setCall]         = useState({});
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded,    setCallEnded]    = useState(false);
  const [stream,       setStream]       = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callType,     setCallType]     = useState("video");
  const [callTo,       setCallTo]       = useState(null);
  const [isCalling,    setIsCalling]    = useState(false);

  const myId = () => myMongoIdRef.current;

  const safeAssign = (ref, mediaStream) => {
    if (ref.current && mediaStream && ref.current.srcObject !== mediaStream) {
      ref.current.srcObject = mediaStream;
    }
  };

  const reattachStreams = useCallback(() => {
    safeAssign(myVideo,   streamRef.current);
    safeAssign(userVideo, remoteStreamRef.current);
  }, []);

  const flushLocalIce = useCallback((toMongoId) => {
    const buf = localIceBuffer.current;
    if (buf.length > 0) {
      console.log(`[ICE] flushing ${buf.length} local candidates to`, toMongoId);
      buf.forEach(candidate => {
        socket.emit("ice-candidate", { from: myId(), to: toMongoId, candidate });
      });
      localIceBuffer.current = [];
    }
  }, [socket]);

  const drainRemoteIce = useCallback(async (pc) => {
    const queue = remoteIceBuffer.current;
    if (queue.length > 0) {
      console.log(`[ICE] draining ${queue.length} remote candidates`);
      for (const c of queue) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
        catch (e) { if (!e.message?.includes("end-of-candidates")) console.warn("[ICE] drain:", e.message); }
      }
      remoteIceBuffer.current = [];
    }
  }, []);

  // SOCKET LISTENERS

  useEffect(() => {
    if (!socket) return;

    socket.on("user-id", ({ userId }) => {
      console.log("[Auth] My mongoId:", userId);
      myMongoIdRef.current = userId;
    });

    socket.on("call-user", ({ from, offer, type, callerName }) => {
      console.log("[Signal] ← call-user from:", from, "name:", callerName);
      setCallEnded(false);
      setCallType(type || "video");
      setCall({ isReceivingCall: true, from, type, callerName });
      pendingOfferRef.current = { senderMongoId: from, offer, type };
    });

    socket.on("webrtc-answer", async ({ from, answer }) => {
      console.log("[Signal] ← webrtc-answer from:", from);
      setCallAccepted(true);
      const pc = connectionRef.current;
      if (!pc) return;
      const state = pc.signalingState;
      if (state === "stable" || state === "closed") {
        console.warn("[WebRTC] answer ignored, state:", state);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[WebRTC] ✅ Remote desc set on SENDER");
        isRemoteDescSetRef.current = true;
        await drainRemoteIce(pc);
        flushLocalIce(from);
      } catch (err) {
        console.error("[WebRTC] setRemoteDescription failed:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!candidate) return;
      const pc = connectionRef.current;
      if (!pc || !isRemoteDescSetRef.current) {
        console.log("[ICE] buffering remote candidate");
        remoteIceBuffer.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        if (!err.message?.includes("end-of-candidates"))
          console.warn("[ICE] addIceCandidate error:", err.message);
      }
    });

    socket.on("end-call", () => resetCall());

    return () => {
      socket.off("user-id");
      socket.off("call-user");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
      socket.off("end-call");
    };
  }, [socket, drainRemoteIce, flushLocalIce]);

  
  // CREATE PEER CONNECTION

  const createPeerConnection = (remoteMongoId) => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    remoteUserIdRef.current    = remoteMongoId;
    remoteIceBuffer.current    = [];
    localIceBuffer.current     = [];
    isRemoteDescSetRef.current = false;

    const pc = new RTCPeerConnection(getRTCConfig());
    connectionRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) { console.log("[ICE] Gathering complete"); return; }
      console.log(`[ICE] → type:${candidate.type} proto:${candidate.protocol}`);
      if (isRemoteDescSetRef.current) {
        socket.emit("ice-candidate", { from: myId(), to: remoteMongoId, candidate: candidate.toJSON() });
      } else {
        localIceBuffer.current.push(candidate.toJSON());
      }
    };

    pc.ontrack = ({ streams, track }) => {
      console.log("[WebRTC] ← ontrack kind:", track.kind);
      const incoming = streams?.[0];
      if (incoming) {
        remoteStreamRef.current = incoming;
        setRemoteStream(incoming);
        safeAssign(userVideo, incoming);
        if (userVideo.current) userVideo.current.play().catch(() => {});
      } else {
        if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
        remoteStreamRef.current.addTrack(track);
        const updated = new MediaStream(remoteStreamRef.current.getTracks());
        setRemoteStream(updated);
        safeAssign(userVideo, updated);
      }
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      console.log("[WebRTC] connectionState:", s);
      if (s === "connected") console.log("[WebRTC] ✅ Video flowing!");
      if (s === "failed") pc.restartIce();
      if (s === "disconnected") {
        setTimeout(() => {
          if (connectionRef.current?.connectionState === "disconnected")
            connectionRef.current.restartIce();
        }, 3000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[ICE] state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };

    pc.onsignalingstatechange = () =>
      console.log("[WebRTC] signalingState:", pc.signalingState);

    return pc;
  };


  // GET LOCAL STREAM

  const getLocalStream = async (videoEnabled) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    const s = await navigator.mediaDevices.getUserMedia({
      video: videoEnabled ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = s;
    setStream(s);
    safeAssign(myVideo, s);
    if (myVideo.current) myVideo.current.play().catch(() => {});
    return s;
  };


  // CALL USER — SENDER

  const callUser = async (id, callerName) => {
    console.log("[callUser] calling:", id, "myId:", myId());

    if (!myId()) {
      console.error("[callUser] ❌ myMongoId not set yet — socket user-id event not received");
      return;
    }
    if (!id) {
      console.error("[callUser] ❌ target user id is empty");
      return;
    }

    setCallEnded(false);
    setIsCalling(true);
    setCallType("video");
    setCallTo(id);

    const localStream = await getLocalStream(true);
    const peer        = createPeerConnection(id);

    localStream.getTracks().forEach(t => {
      peer.addTrack(t, localStream);
      console.log("[WebRTC] → added track:", t.kind);
    });

    await new Promise(r => setTimeout(r, 200));

    const offer = await peer.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await peer.setLocalDescription(offer);

    console.log("[Signal] → call-user from:", myId(), "to:", id);
    socket.emit("call-user", {
      from:       myId(),
      to:         id,
      type:       "video",
      offer:      peer.localDescription,
      callerName: callerName || "",
    });
  };

  // ANSWER CALL — RECEIVER

  const answerCall = async () => {
    const pending = pendingOfferRef.current;
    if (!pending?.offer) { console.warn("[answerCall] No pending offer"); return; }

    const isVideo = (pending.type || "video") === "video";
    setCallType(pending.type || "video");
    setCallAccepted(true);

    await new Promise(r => setTimeout(r, 150));

    const localStream = await getLocalStream(isVideo);
    const peer        = createPeerConnection(pending.senderMongoId);

    localStream.getTracks().forEach(t => {
      peer.addTrack(t, localStream);
      console.log("[WebRTC] → receiver added track:", t.kind);
    });

    await peer.setRemoteDescription(new RTCSessionDescription(pending.offer));
    console.log("[WebRTC] ✅ Remote desc set on RECEIVER");

    isRemoteDescSetRef.current = true;
    await drainRemoteIce(peer);

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    console.log("[Signal] → webrtc-answer from:", myId(), "to:", pending.senderMongoId);
    socket.emit("webrtc-answer", {
      from:   myId(),
      to:     pending.senderMongoId,
      answer: peer.localDescription,
    });

    flushLocalIce(pending.senderMongoId);
    pendingOfferRef.current = null;
  };


  // CONTROLS

  const toggleAudio = () =>
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });

  const toggleVideo = () =>
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });

  const shareScreen = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track  = screen.getVideoTracks()[0];
      const sender = connectionRef.current?.getSenders().find(s => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(track);
      if (myVideo.current) myVideo.current.srcObject = screen;
      track.onended = () => {
        const cam = streamRef.current?.getVideoTracks()[0];
        const s2  = connectionRef.current?.getSenders().find(s => s.track?.kind === "video");
        if (s2 && cam) s2.replaceTrack(cam);
        if (myVideo.current) myVideo.current.srcObject = streamRef.current;
      };
    } catch (err) { console.error("Screen share error:", err); }
  };

  const leaveCall = () => {
    const to = call.from || callTo;
    if (to) socket.emit("end-call", { from: myId(), to });
    resetCall();
  };

  const resetCall = () => {
    setCallEnded(true);
    setCallAccepted(false);
    setIsCalling(false);
    pendingOfferRef.current    = null;
    remoteIceBuffer.current    = [];
    localIceBuffer.current     = [];
    isRemoteDescSetRef.current = false;
    remoteUserIdRef.current    = null;
    connectionRef.current?.close();
    connectionRef.current      = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current          = null;
    remoteStreamRef.current    = null;
    setStream(null);
    setRemoteStream(null);
    setCall({});
    setCallTo(null);
  };

  return (
    <CallContext.Provider value={{
      call, callAccepted, callEnded, isCalling, callType,
      myVideo, userVideo, stream, remoteStream,
      callUser, answerCall, leaveCall,
      toggleAudio, toggleVideo, shareScreen,
      reattachStreams,
    }}>
      {children}
    </CallContext.Provider>
  );
};