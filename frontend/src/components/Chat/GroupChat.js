import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function GroupChat({ groupId, stealth = false }) {
  const { user } = useAuth();
  const socketRef = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    api.get(`/chat/${groupId}`)
      .then(res => setMessages(res.data))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    // If stealth mode is enabled (e.g., admin wants to view without joining socket room),
    // don't attach socket listeners or emit join/leave events. Only fetch messages via API.
    if (stealth) return;
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('join_group', groupId);
    socket.on('new_message', msg => setMessages(ms => [...ms, msg]));
    socket.on('user_typing',   ({ name }) => setTyping(`${name} is typing...`));
    socket.on('user_stop_typing', () => setTyping(''));
    return () => {
      socket.emit('leave_group', groupId);
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [groupId, socketRef, stealth]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current?.emit('send_message', { groupId, content: input.trim() });
    socketRef.current?.emit('stop_typing', { groupId });
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socketRef.current?.emit('typing', { groupId, name: user.name });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socketRef.current?.emit('stop_typing', { groupId }), 1500);
  };

  const isMine = (msg) => msg.sender?._id === user._id || msg.sender === user._id;

  return (
    <div className="glass-card" style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', border:'1px solid var(--border-glass)' }}>
      {/* Header */}
      <div style={{ padding:'16px 24px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border-glass)', color:'var(--primary-glow)', fontFamily:"'Fredoka One',cursive", fontSize:22, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:24 }}>💬</span> Tribe Comms
      </div>

      {/* Messages */}
      <div className="hide-scrollbar" style={{ flex:1, overflowY:'auto', padding:'24px 20px', display:'flex', flexDirection:'column', gap:16, background:'rgba(0,0,0,0.2)' }}>
        {loading && <div style={{ textAlign:'center', color:'var(--text-muted)', fontWeight:800 }}>🛰️ Syncing transmission...</div>}
        {messages.length === 0 && !loading && <div style={{ textAlign:'center', color:'var(--text-muted)', marginTop:40, fontSize:14 }}>No comms yet. Start the transmission. 🗿</div>}
        
        {messages.map((msg, i) => {
          const mine = isMine(msg);
          return (
            <div key={msg._id || i} style={{ display:'flex', flexDirection: mine ? 'row-reverse' : 'row', gap:12, alignItems:'flex-end' }}>
              <div style={{ 
                width:36, height:36, borderRadius:12, 
                background: mine ? 'var(--primary-glow)' : 'rgba(255,255,255,0.1)', 
                display:'flex', alignItems:'center', justifyContent:'center', 
                fontSize:14, fontWeight:900, color: mine ? '#000' : '#fff', 
                flexShrink:0, border:'1px solid var(--border-glass)'
              }}>
                {msg.sender?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ maxWidth:'75%' }}>
                {!mine && <div style={{ fontSize:11, color:'var(--primary-glow)', fontWeight:900, marginBottom:4, paddingLeft:4, textTransform:'uppercase', letterSpacing:1 }}>{msg.sender?.name}</div>}
                <div style={{ 
                  background: mine ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255,255,255,0.03)', 
                  border: mine ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid var(--border-glass)',
                  color: 'white', 
                  padding:'12px 18px', 
                  borderRadius: mine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                  fontSize:14, fontWeight:600, 
                  wordBreak:'break-word',
                  boxShadow: mine ? '0 4px 15px rgba(255, 215, 0, 0.05)' : 'none'
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6, textAlign: mine ? 'right' : 'left', fontWeight:800, paddingLeft:4, paddingRight:4 }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {typing && <div style={{ fontSize:11, color:'var(--primary-glow)', fontWeight:800, fontStyle:'italic', paddingLeft:48, animation:'pulse 1.5s infinite' }}>📡 {typing}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ padding:'20px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid var(--border-glass)', display:'flex', gap:12 }}>
        <input
          value={input}
          onChange={handleTyping}
          placeholder="Transmit a message..."
          style={{ 
            flex:1, 
            padding:'14px 20px', 
            borderRadius:14, 
            background:'rgba(255,255,255,0.03)',
            border:'1px solid var(--border-glass)',
            color:'white',
            fontSize:14, 
            outline:'none',
            transition:'all 0.2s'
          }}
          onFocus={e => { e.target.style.borderColor='var(--primary-glow)'; e.target.style.boxShadow='0 0 15px rgba(255, 215, 0, 0.1)'; }}
          onBlur={e => { e.target.style.borderColor='var(--border-glass)'; e.target.style.boxShadow='none'; }}
        />
        <button type="submit" className="btn btn-yellow" style={{ borderRadius:14, padding:'0 24px', fontSize:18 }}>
          ➤
        </button>
      </form>
    </div>
  );
}
