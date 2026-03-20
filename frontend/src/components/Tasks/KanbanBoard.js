import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../../utils/api';
import { useToast } from '../Common/ToastContext';
import StickyNote from './StickyNote';
import CreateTaskModal from './CreateTaskModal';
import Graveyard from './Graveyard';

export default function KanbanBoard({ groupId }) {
  const { show } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    api.get('/tasks/me')
      .then(res => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return; // Order is arbitrary within column for now

    const newStatus = destination.droppableId;
    const movedTask = tasks.find(t => t._id === draggableId);

    if (movedTask?.status === 'done' && newStatus !== 'done') {
      show('Mission accomplished! No retreat. 🏁', { type: 'error' });
      return;
    }
    
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t._id === draggableId 
        ? { ...t, status: newStatus, completed: newStatus === 'done' } 
        : t
    ));

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
    } catch (err) {
      show('Strategic error: Relocation failed! 🛰️', { type: 'error' });
      // Revert on failure
      api.get('/tasks/me').then(res => setTasks(res.data));
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done').sort((a,b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#888' }}>📌 Loading board...</div>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ fontFamily:"'Fredoka One',cursive", margin:0 }}>Personal Board</h2>
        <button onClick={()=>setShowModal(true)} className="btn btn-yellow" style={{ gap:6 }}>➕ New Note</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          {/* Active Tasks Section */}
          <div className="glass-card" style={{ padding:28, border:'1px solid var(--border-glass)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div style={{ fontWeight:900, fontSize:20, display:'flex', alignItems:'center', gap:10, color:'white', letterSpacing:-0.5 }}>
                🚀 Active Intel <span style={{ background:'var(--primary-glow)', color:'#000', borderRadius:10, padding:'2px 10px', fontSize:13, fontWeight:900 }}>{activeTasks.length}</span>
              </div>
            </div>
            
            <Droppable droppableId="active" direction="horizontal">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  style={{ 
                    display:'flex', 
                    gap:16, 
                    overflowX:'auto', 
                    paddingBottom:12,
                    minHeight:150,
                    background: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
                    borderRadius:12,
                    transition:'background 0.2s'
                  }}
                  className="hide-scrollbar"
                >
                  {activeTasks.map((t, index) => (
                    <Draggable key={t._id} draggableId={t._id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ ...provided.draggableProps.style, flex:'0 0 auto', width:280 }}
                        >
                          <StickyNote 
                            task={t} 
                            onUpdate={u=>setTasks(ts=>ts.map(x=>x._id===u._id?u:x))} 
                            onDelete={id=>setTasks(ts=>ts.filter(x=>x._id!==id))} 
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Done Tasks Section */}
          <div style={{ opacity: 0.9 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontWeight:900, fontSize:20, display:'flex', alignItems:'center', gap:10, color:'var(--text-muted)', letterSpacing:-0.5 }}>
                ✅ Done & Dusted <span style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'2px 10px', fontSize:13, fontWeight:900 }}>{doneTasks.length}</span>
              </div>
              <button 
                onClick={() => setShowDone(!showDone)}
                className="btn btn-ghost" 
                style={{ fontSize:13, color:'var(--brand-blue)', fontWeight:800 }}
              >
                {showDone ? 'Hide History ⬆' : 'View History ⬇'}
              </button>
            </div>
            
            {showDone && <Graveyard tasks={doneTasks} onDeleted={id => setTasks(ts => ts.filter(x => x._id !== id))} />}
          </div>
        </div>
      </DragDropContext>

      {showModal && <CreateTaskModal onClose={()=>setShowModal(false)} onCreated={t=>setTasks(ts=>[t,...ts])} />}
    </div>
  );
}
