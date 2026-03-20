import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import StickyNote from './StickyNote';
import CreateTaskModal from './CreateTaskModal';

export default function TaskBoard({ groupId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const url = groupId ? `/tasks/group/${groupId}` : '/tasks/me';
    api.get(url)
      .then(res => setTasks(res.data))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Subscribe to real-time task updates for this group so changes in members' personal todos reflect immediately
  const socketRef = useSocket();
  useEffect(() => {
    const socket = socketRef?.current;
    if (!groupId || !socket) return;
    // join group room
    socket.emit('join_group', groupId);

    const onUpdated = (task) => {
      setTasks(ts => {
        // If task exists, update it; otherwise add it if incomplete
        const exists = ts.some(t => t._id === task._id);
        if (task.completed) {
          // remove completed tasks from active list
          return ts.filter(t => t._id !== task._id);
        }
        if (exists) return ts.map(t => t._id === task._id ? task : t);
        return [task, ...ts];
      });
    };

    const onDeleted = ({ _id }) => setTasks(ts => ts.filter(t => t._id !== _id));

    socket.on('task_updated', onUpdated);
    socket.on('task_deleted', onDeleted);

    return () => {
      socket.emit('leave_group', groupId);
      socket.off('task_updated', onUpdated);
      socket.off('task_deleted', onDeleted);
    };
  }, [groupId, socketRef]);

  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t =>  t.completed);
  const filtered  = filter === 'all' ? active : filter === 'done' ? completed : tasks;

  // Group active tasks by owner when viewing a group
  const groupedByOwner = groupId ? active.reduce((acc, t) => {
    const owner = t.owner || { _id: 'unknown', name: 'Unknown' };
    const id = owner._id || owner;
    if (!acc[id]) acc[id] = { owner, tasks: [] };
    acc[id].tasks.push(t);
    return acc;
  }, {}) : {};

  const [collapsed, setCollapsed] = React.useState({});

  const headerStyle = { fontFamily:"'Fredoka One',cursive", fontSize:24, color:'white', marginBottom:20, display:'flex', alignItems:'center', gap:10, letterSpacing:-0.5 };

  if (loading) return <div style={{ textAlign:'center', padding:40, fontSize:18, color:'#888' }}>📌 Loading notes...</div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        {!groupId && (
          <div style={{ display:'flex', gap:10 }}>
            {[['all','📌 Active'],['done','✅ Done']].map(([val,label]) => (
              <button key={val} onClick={()=>setFilter(val)} className={`btn ${filter===val ? 'btn-yellow' : 'btn-ghost'}`} style={{ padding:'10px 20px', fontSize:13 }}>{label}</button>
            ))}
          </div>
        )}
        {/* Do not allow creating todos from within a group - todos are personal */}
        {!groupId && (
          <button onClick={()=>setShowModal(true)} className="btn btn-yellow" style={{ gap:6 }}>
            ➕ New Note
          </button>
        )}
      </div>

      {/* Gamification bar */}
      {!groupId && (
        <div className="glass-card" style={{ padding:'24px', marginBottom:32, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap', border:'1px solid var(--border-glass)' }}>
          <div style={{ flex:1 }}>
            <div style={{ color:'var(--primary-glow)', fontWeight:900, fontSize:13, marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>🏆 Mission Progress</div>
            <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:20, height:12, overflow:'hidden', border:'1px solid var(--border-glass)' }}>
              <div style={{ background:'linear-gradient(90deg, var(--primary-glow), #FF8C42)', height:'100%', width: tasks.length ? `${(completed.length/tasks.length*100).toFixed(0)}%` : '0%', transition:'width 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)', borderRadius:20 }} />
            </div>
          </div>
          <div style={{ color:'white', fontWeight:950, fontSize:15, background:'rgba(255,255,255,0.05)', padding:'10px 18px', borderRadius:14, border:'1px solid var(--border-glass)' }}>
            ✅ {completed.length}/{tasks.length} done
          </div>
        </div>
      )}

      {filter !== 'done' && (
        <>
          <div style={headerStyle}>📌 Active Notes <span style={{ fontSize:16, background:'var(--primary-glow)', color:'#000', borderRadius:20, padding:'2px 12px', fontFamily:'Nunito', marginLeft:4 }}>{active.length}</span></div>
          {active.length === 0 ? (
            <div className="glass-card" style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)', fontSize:16, border:'1px dashed var(--border-glass)', background:'rgba(255,255,255,0.01)' }}>
              🎉 All clear! Add a new note to get started. 🗿
            </div>
          ) : (
            groupId ? (
              // Group view: show todos separated by owner in accordions
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:32 }}>
                {Object.keys(groupedByOwner).map(ownerId => {
                  const bucket = groupedByOwner[ownerId];
                  const owner = bucket.owner;
                  const tasksForOwner = bucket.tasks;
                  const isCollapsed = collapsed[ownerId];
                  return (
                    <div key={ownerId} className="glass-card" style={{ padding:20, background:'rgba(255,255,255,0.02)', border:'1px solid var(--border-glass)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:950, color:'var(--primary-glow)', fontSize:20, border:'1px solid var(--border-glass)' }}>{owner?.name?.[0] || '❓'}</div>
                          <div>
                            <div style={{ fontWeight:950, fontSize:17, color:'white' }}>{owner?.name || 'Unknown'}</div>
                            <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:800, textTransform:'uppercase', marginTop:2 }}>{tasksForOwner.length} mission{tasksForOwner.length!==1?'s':''} active</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                          <button className={`btn ${isCollapsed ? 'btn-yellow' : 'btn-ghost'}`} style={{ padding:'8px 16px', fontSize:11 }} onClick={()=>setCollapsed(c => ({ ...c, [ownerId]: !c[ownerId] }))}>
                            {isCollapsed ? '展开 EXPAND' : '折叠 COLLAPSE'}
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                          {tasksForOwner.map(t => (
                            <StickyNote key={t._id} task={t} compact onUpdate={u=>setTasks(ts=>ts.map(x=>x._id===u._id?u:x))} onDelete={id=>setTasks(ts=>ts.filter(x=>x._id!==id))} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:24, marginBottom:32 }}>
                {active.map(t => (
                  <StickyNote key={t._id} task={t} onUpdate={u=>setTasks(ts=>ts.map(x=>x._id===u._id?u:x))} onDelete={id=>setTasks(ts=>ts.filter(x=>x._id!==id))} />
                ))}
              </div>
            )
          )}
        </>
      )}

      {(filter === 'done' || filter === 'all') && completed.length > 0 && (
        <>
          <div style={{ ...headerStyle, marginTop: filter==='all' ? 32 : 0 }}>✅ Completed <span style={{ fontSize:16, background:'rgba(107, 203, 119, 0.2)', color:'#6BCB77', border:'1px solid #6BCB77', borderRadius:20, padding:'2px 12px', fontFamily:'Nunito', marginLeft:4 }}>{completed.length}</span></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:24 }}>
            {completed.map(t => (
              <StickyNote key={t._id} task={t} onUpdate={u=>setTasks(ts=>ts.map(x=>x._id===u._id?u:x))} onDelete={id=>setTasks(ts=>ts.filter(x=>x._id!==id))} />
            ))}
          </div>
        </>
      )}

      {showModal && <CreateTaskModal onClose={()=>setShowModal(false)} onCreated={t=>setTasks(ts=>[t,...ts])} />}
    </div>
  );
}
