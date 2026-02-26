
const Message = require('../models/Message');

const isObjectId = (str) => /^[a-f\d]{24}$/i.test(String(str));

module.exports = (io, socket, onlineUsers) => {

  const emitToUser = (mongoId, event, payload) => {
    if (!mongoId) return;
    console.log(`  [emit] → room:"${mongoId}" event:"${event}"`);
    io.to(String(mongoId)).emit(event, payload);
  };

  const resolveMongoId = (value) => {
    if (!value) return null;
    if (isObjectId(value)) return String(value);
    for (const [mongoId, sid] of onlineUsers.entries()) {
      if (sid === value) return mongoId;
    }
    return io.sockets.sockets.get(value)?.userId || null;
  };

  socket.on('call-user', (data) => {
    console.log(`[call-user] from:"${data.from}" to:"${data.to}" name:"${data.callerName}"`);
    emitToUser(data.to, 'call-user', {
      from:       data.from,
      offer:      data.offer,
      type:       data.type,
      callerName: data.callerName,
    });
  });

  socket.on('webrtc-answer', (data) => {
    console.log(`[webrtc-answer] from:"${data.from}" to:"${data.to}"`);
    emitToUser(data.to, 'webrtc-answer', {
      from:   data.from,
      answer: data.answer,
    });
  });

  socket.on('ice-candidate', (data) => {
    emitToUser(data.to, 'ice-candidate', {
      from:      data.from,
      candidate: data.candidate,
    });
  });

  socket.on('call-rejected', (data) => {
    emitToUser(data.to, 'call-rejected', { from: data.from });
  });

  socket.on('end-call', async (data) => {
    console.log(`[end-call] from:"${data.from}" to:"${data.to}"`);
    emitToUser(data.to, 'end-call', { from: data.from });

    const senderMongoId   = socket.userId || resolveMongoId(data.from);
    const receiverMongoId = resolveMongoId(data.to);

    if (!senderMongoId || !receiverMongoId) {
      console.warn('[end-call] Cannot resolve mongo IDs — skipping DB save');
      return;
    }

    try {
      await Message.create({
        sender:       senderMongoId,
        receiver:     receiverMongoId,
        content:      data.callType === 'audio' ? 'Audio call ended' : 'Video call ended',
        type:         data.callType === 'audio' ? 'audio_call' : 'video_call',
        callDuration: data.duration || 0,
      });
      console.log('[end-call] ✅ Saved');
    } catch (err) {
      console.error('[end-call] DB save failed:', err.message);
    }
  });
};