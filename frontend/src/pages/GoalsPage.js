import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Common/Navbar';
import { useToast } from '../components/Common/ToastContext';
import ConfirmModal from '../components/Common/ConfirmModal';

function daysLeft(date) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function urgencyColor(days) {
  if (days === null) return '#94A3B8';
  if (days < 0)  return '#FF4076';
  if (days < 3)  return '#FB923C';
  if (days < 7)  return '#FBBF24';
  return '#34D399';
}

export default function GoalsPage() {
  const { user, setUser } = useAuth();
  const { show } = useToast();
  const [goals, setGoals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [form, setForm]             = useState({ title: '', targetDate: '' });
  const [headingForms, setHeadingForms] = useState({});
  const [subtaskForms, setSubtaskForms] = useState({});
  const [expandedGoals, setExpandedGoals] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [dateError, setDateError]   = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/users/goals')
      .then(res => { if (mounted) setGoals(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => mounted = false;
  }, []);

  // ── Collapse / Expand All ──────────────────────────────────────
  const toggleAll = () => {
    if (allExpanded) {
      setExpandedGoals({});
      setAllExpanded(false);
    } else {
      const all = {};
      goals.forEach(g => { all[g._id] = true; });
      setExpandedGoals(all);
      setAllExpanded(true);
    }
  };

  // ── Add Goal ──────────────────────────────────────────────────
  const addGoal = async (e) => {
    e.preventDefault();
    setDateError('');
    if (form.targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(form.targetDate) < today) {
        setDateError('⚠️ Chad rule: No living in the past. Choose a future date.');
        return;
      }
    }
    try {
      const res = await api.post('/users/goals', { title: form.title, targetDate: form.targetDate || undefined });
      setGoals(g => [res.data, ...g]);
      setForm({ title: '', targetDate: '' });
      show('Mission Accepted. 🗿', { type: 'success' });
    } catch (err) {
      show(err.response?.data?.message || 'Could not create goal', { type: 'info' });
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const removeGoal = (goalId) => setConfirmDelete(goalId);

  const confirmRemoveGoal = async () => {
    if (!confirmDelete) return;
    try {
      const res = await api.delete(`/users/goals/${confirmDelete}`);
      setGoals(gs => gs.filter(g => g._id !== confirmDelete));
      show(res.data.aiMessage || 'Mission aborted. 🤨', { type: 'info' });
      setConfirmDelete(null);
    } catch {
      show('Failed to remove', { type: 'info' });
      setConfirmDelete(null);
    }
  };

  // ── Heading + Subtask ──────────────────────────────────────
  const addHeading = async (goalId) => {
    const title = headingForms[goalId];
    if (!title?.trim()) return;
    try {
      const res = await api.post(`/users/goals/${goalId}/headings`, { title });
      setGoals(gs => gs.map(g => g._id === goalId ? { ...g, headings: [...(g.headings || []), res.data] } : g));
      setHeadingForms(h => ({ ...h, [goalId]: '' }));
    } catch {}
  };

  const addSubtask = async (goalId, headingId) => {
    const title = subtaskForms[`${goalId}_${headingId}`];
    if (!title?.trim()) return;
    try {
      const res = await api.post(`/users/goals/${goalId}/headings/${headingId}/subtasks`, { title });
      setGoals(gs => gs.map(g => {
        if (g._id !== goalId) return g;
        return { ...g, headings: g.headings.map(h => h._id === headingId ? { ...h, subtasks: [...(h.subtasks || []), res.data] } : h) };
      }));
      setSubtaskForms(s => ({ ...s, [`${goalId}_${headingId}`]: '' }));
    } catch {}
  };

  const toggleSubtask = async (goalId, headingId, subtaskId) => {
    const goal    = goals.find(g => g._id === goalId);
    const heading = goal?.headings.find(h => h._id === headingId);
    const subtask = heading?.subtasks.find(s => s._id === subtaskId);
    if (subtask?.completed) return; // Cannot uncheck

    // Optimistic update
    setGoals(gs => gs.map(g => {
      if (g._id !== goalId) return g;
      return { ...g, headings: g.headings.map(h => {
        if (h._id !== headingId) return h;
        return { ...h, subtasks: h.subtasks.map(s => s._id === subtaskId ? { ...s, completed: true } : s) };
      })};
    }));

    try {
      const res = await api.patch(`/users/goals/${goalId}/headings/${headingId}/subtasks/${subtaskId}/toggle`);
      setGoals(gs => gs.map(g => g._id === goalId ? res.data : g));
      if (res.data.aiMessage) show(res.data.aiMessage, { type: 'celebrate', duration: 4000 });
      else if (res.data.auraAwarded) show(`+${res.data.auraAwarded} Aura!! 🔥`, { type: 'success', duration: 4000 });
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => {});
    } catch (err) {
      show(err.response?.data?.message || 'Failed to toggle step', { type: 'info' });
    }
  };

  const activeGoals    = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', paddingBottom: 60 }}>
      <Navbar />
      <div className="page-enter" style={{ maxWidth: 1060, margin: '0 auto', padding: 'clamp(16px,4vw,28px)' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--primary-glow)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 6 }}>
              Mission Control
            </div>
            <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 'clamp(28px,6vw,42px)', margin: 0, color: 'white' }}>
              Goals 🎯
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700, margin: '6px 0 0', fontSize: 13 }}>
              Focus on the vision. Ignore the noise. 🗿
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleAll} style={{
              padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
              fontWeight: 900, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s'
            }}>{allExpanded ? '⬆ Collapse All' : '⬇ Expand All'}</button>
          </div>
        </div>

        {/* ── Add Mission Form ── */}
        <div style={{
          borderRadius: 22, padding: 'clamp(20px,4vw,28px)', marginBottom: 28,
          background: 'linear-gradient(145deg,rgba(255,215,0,0.04),rgba(255,215,0,0.01))',
          border: '1px solid rgba(255,215,0,0.12)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,215,0,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            ➕ New Mission
          </div>
          <form onSubmit={addGoal} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              placeholder="What's the big vision? 🎯" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required
              style={{ flex: '2 1 220px', minWidth: 0 }}
            />
            <input
              type="date" value={form.targetDate} min={new Date().toISOString().split('T')[0]}
              onChange={e => { setForm({ ...form, targetDate: e.target.value }); setDateError(''); }}
              style={{ flex: '1 1 140px', minWidth: 0 }}
            />
            <button type="submit" style={{
              flex: '0 0 auto', padding: '13px 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#FFD700,#FF9500)', color: '#000',
              fontWeight: 900, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
              boxShadow: '0 4px 16px rgba(255,215,0,0.3)'
            }}>Begin Mission</button>
          </form>
          {dateError && (
            <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,64,118,0.1)', border: '1px solid rgba(255,64,118,0.25)', color: '#FF4076', fontSize: 12, fontWeight: 800 }}>
              {dateError}
            </div>
          )}
        </div>

        {/* ── Active Goals ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>
            🛰️ Synchronizing mission data...
          </div>
        ) : activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🗿</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 8 }}>No missions found.</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Time to build a legacy.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeGoals.map(g => <GoalCard key={g._id} g={g} expanded={!!expandedGoals[g._id]}
              onToggle={() => setExpandedGoals(p => ({ ...p, [g._id]: !p[g._id] }))}
              onRemove={() => removeGoal(g._id)} onAddHeading={t => addHeading(g._id)}
              headingForm={headingForms[g._id] || ''} setHeadingForm={v => setHeadingForms(h => ({ ...h, [g._id]: v }))}
              subtaskForms={subtaskForms} setSubtaskForms={setSubtaskForms}
              onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask}
            />)}

            {/* Done & Dusted */}
            {completedGoals.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#34D399', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                  💎 Done & Dusted ({completedGoals.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {completedGoals.map(g => (
                    <div key={g._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 18px', borderRadius: 16, gap: 12,
                      background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: 'white' }}>✅ {g.title}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800, marginTop: 3 }}>
                          Completed {g.completedAt ? new Date(g.completedAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <button onClick={() => removeGoal(g._id)} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5
                      }}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {confirmDelete && (
          <ConfirmModal
            title="THANOS SNAP MISSION?"
            message="One does not simply delete a mission. This will permanently erase your progress. Proceed? 💀"
            confirmText="DO IT (ULTRA CHAD)"
            onConfirm={confirmRemoveGoal}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    </div>
  );
}

// ── Goal Card Component ───────────────────────────────────────────────────
function GoalCard({ g, expanded, onToggle, onRemove, onAddHeading, headingForm, setHeadingForm, subtaskForms, setSubtaskForms, onAddSubtask, onToggleSubtask }) {
  const days = daysLeft(g.targetDate);
  const urgency = urgencyColor(days);
  const progress = Math.round(g.progress || 0);

  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      background: g.completed ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${urgency}22`,
      transition: 'box-shadow 0.3s ease',
    }}>
      {/* Card Header */}
      <div style={{ padding: 'clamp(16px,3vw,22px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 'clamp(15px,3vw,18px)', color: 'white', fontWeight: 900, wordBreak: 'break-word' }}>
              {g.title}
            </h3>
            {g.targetDate && (
              <div style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 900,
                background: `${urgency}18`, color: urgency, border: `1px solid ${urgency}35`, flexShrink: 0
              }}>
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, background: `linear-gradient(90deg,${urgency}88,${urgency})`,
                width: `${progress}%`, transition: 'width 0.8s ease', boxShadow: `0 0 6px ${urgency}`
              }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: urgency, flexShrink: 0 }}>{progress}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onToggle} style={{
            padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: expanded ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
            color: expanded ? '#FFD700' : 'rgba(255,255,255,0.5)',
            fontSize: 10, fontWeight: 900, letterSpacing: 1, cursor: 'pointer', textTransform: 'uppercase',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}>{expanded ? 'Hide ↑' : 'View ↓'}</button>
          <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.4, padding: '7px 6px' }}>🗑️</button>
        </div>
      </div>

      {/* Expandable content */}
      <div style={{
        maxHeight: expanded ? '3000px' : '0px',
        overflow: 'hidden',
        opacity: expanded ? 1 : 0,
        transition: 'max-height 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease',
      }}>
        <div style={{ padding: 'clamp(12px,3vw,20px)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(g.headings || []).map(h => (
            <div key={h._id} style={{ borderRadius: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                📌 {h.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(h.subtasks || []).map(s => (
                  <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: s.completed ? 'default' : 'pointer', padding: '6px 0' }}>
                    <div onClick={() => !s.completed && onToggleSubtask(g._id, h._id, s._id)} style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: s.completed ? 'default' : 'pointer',
                      border: s.completed ? 'none' : '2px solid rgba(255,255,255,0.2)',
                      background: s.completed ? 'linear-gradient(135deg,#34D399,#10B981)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                      transition: 'all 0.2s'
                    }}>{s.completed ? '✓' : ''}</div>
                    <span style={{ flex: 1, fontSize: 13, color: s.completed ? 'rgba(255,255,255,0.3)' : '#fff',
                      textDecoration: s.completed ? 'line-through' : 'none', fontWeight: 600, wordBreak: 'break-word' }}>
                      {s.title}
                    </span>
                  </label>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <input
                    placeholder="Add sub-mission..." value={subtaskForms[`${g._id}_${h._id}`] || ''}
                    onChange={e => setSubtaskForms(s => ({ ...s, [`${g._id}_${h._id}`]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddSubtask(g._id, h._id))}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 12, borderRadius: 10 }}
                  />
                  <button onClick={() => onAddSubtask(g._id, h._id)} style={{
                    padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 900
                  }}>+</button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Phase */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="New mission phase...🎯" value={headingForm}
              onChange={e => setHeadingForm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAddHeading(headingForm))}
              style={{ flex: 1, padding: '10px 14px', fontSize: 12, borderRadius: 12 }}
            />
            <button onClick={() => onAddHeading(headingForm)} style={{
              padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,215,0,0.2)',
              background: 'rgba(255,215,0,0.07)', color: 'rgba(255,215,0,0.8)',
              fontWeight: 900, fontSize: 11, letterSpacing: 1, cursor: 'pointer'
            }}>ADD PHASE</button>
          </div>
        </div>
      </div>
    </div>
  );
}
