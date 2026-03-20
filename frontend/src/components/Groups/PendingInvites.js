import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import ConfirmModal from '../Common/ConfirmModal';
import { useToast } from '../Common/ToastContext';

export default function PendingInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [declineId, setDeclineId] = useState(null);
  const { show } = useToast();

  useEffect(() => {
    let mounted = true;
    api.get('/groups/pending')
      .then(res => { if (mounted) setInvites(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const accept = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.post(`/groups/${id}/accept-invite`);
      setInvites(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      console.error(err);
      show(err?.response?.data?.message || 'Alliance failed! 🛡️', { type: 'error' });
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  const decline = async () => {
    const id = declineId;
    if (!id) return;
    setDeclineId(null);
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.post(`/groups/${id}/decline`);
      setInvites(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      console.error(err);
      show(err?.response?.data?.message || 'Signal rejected! 📡', { type: 'error' });
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  if (loading) return <div style={{ padding:12, color:'#666' }}>Checking invites…</div>;
  if (!invites || invites.length === 0) return null;

  return (
    <div style={{ marginBottom:18, background:'white', padding:14, borderRadius:12, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontWeight:800, color:'#333' }}>Invites</div>
        <div style={{ color:'#999', fontSize:13 }}>{invites.length} pending</div>
      </div>
      <div style={{ display:'grid', gap:8 }}>
        {invites.map(g => (
          <div key={g._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'8px 6px', borderRadius:10, background:'#FBFBFB' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ fontSize:20 }}>{g.emoji || '📚'}</div>
              <div>
                <div style={{ fontWeight:700 }}>{g.name}</div>
                <div style={{ fontSize:12, color:'#666' }}>From: {g.creator?.name || 'Unknown'}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>accept(g._id)} className="btn btn-small" disabled={processing[g._id]}>{processing[g._id] ? 'Joining...' : 'Accept'}</button>
              <button onClick={()=>setDeclineId(g._id)} className="btn btn-small" style={{ background:'transparent', border:'1px solid #eee' }} disabled={processing[g._id]}>{processing[g._id] ? '...' : 'Decline'}</button>
            </div>
          </div>
        ))}
      </div>

      {declineId && (
        <ConfirmModal 
          title="DECLINE INVITATION?"
          message="Are you sure you want to decline this invitation to join the circle? 🛡️"
          onConfirm={decline}
          onCancel={() => setDeclineId(null)}
          confirmText="DECLINE"
        />
      )}
    </div>
  );
}
