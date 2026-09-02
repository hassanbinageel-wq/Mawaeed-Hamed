import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isConfigured } from './supabase';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

// Map DB row (snake_case) → app shape (camelCase) matching the prototype
const rowToAppt = (r) => ({
  id: r.id,
  title: r.title,
  type: r.type,
  startISO: r.start_iso,
  endISO: r.end_iso,
  location: r.location || '',
  notes: r.notes || '',
  priority: r.priority,
  needsDriver: r.needs_driver,
  driverId: r.driver_id,
  requestedDriverId: r.requested_driver_id,
  status: r.status,
  createdBy: r.created_by,
  createdAt: r.created_at,
});
const apptToRow = (a) => ({
  id: a.id,
  title: a.title,
  type: a.type,
  start_iso: a.startISO,
  end_iso: a.endISO,
  location: a.location,
  notes: a.notes,
  priority: a.priority,
  needs_driver: a.needsDriver,
  driver_id: a.driverId,
  requested_driver_id: a.requestedDriverId,
  status: a.status,
  created_by: a.createdBy,
});
const rowToNotif = (r) => ({
  id: r.id, targetRole: r.target_role, targetId: r.target_id,
  kind: r.kind, title: r.title, body: r.body,
  appointmentId: r.appointment_id, read: r.read, createdAt: r.created_at,
});
const ACTION_LABELS = {
  'appointment.created':  (r, d) => `أنشأ الموعد`,
  'appointment.updated':  (r, d) => `عدّل الموعد`,
  'appointment.deleted':  (r, d) => `حذف الموعد`,
  'appointment.assigned': (r, d) => `عيّن ${d.driver || 'سائقاً'} للمشوار`,
  'trip.status':          (r, d) => {
    const labels = { confirmed:'أكّد المشوار', onway:'انطلق في الطريق', arrived:'وصل الموقع',
                     completed:'أنهى المهمة', declined:'اعتذر عن المشوار', cancelled:'ألغى المشوار' };
    return labels[d.status] || `حدّث الحالة إلى ${d.status}`;
  },
  'driver.status':        (r, d) => {
    const labels = { available:'أصبح متاحاً', busy:'أصبح مشغولاً', off:'خرج عن الخدمة' };
    return labels[d.status] || `غيّر حالته إلى ${d.status}`;
  },
};

const rowToLog = (r) => {
  const details = r.details || {};
  const label = ACTION_LABELS[r.action] ? ACTION_LABELS[r.action](r, details) : r.action;
  return {
    id: r.id, actorId: r.actor_id, actorName: r.actor_name, actorRole: r.actor_role,
    action: r.action, appointmentId: r.appointment_id, details, createdAt: r.created_at,
    // Aliases for existing UI code
    actor: r.actor_id, label, ts: r.created_at,
  };
};
const rowToDriver = (r) => ({
  id: r.id, name: r.name, phone: r.phone || '', avatar: r.avatar,
  status: r.status, joinedAt: r.joined_at,
});
const rowToUser = (r) => ({
  id: r.id, name: r.name, role: r.role, avatar: r.avatar, phone: r.phone || '',
});

const rid = (p='id') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

export function AppProvider({ children }) {
  const [users, setUsers]     = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [appts, setAppts]     = useState([]);
  const [notifs, setNotifs]   = useState([]);
  const [log, setLog]         = useState([]);
  const [now, setNow]         = useState(new Date());
  const [role, setRole]       = useState('owner');
  const [currentDriverId, setCurrentDriverId] = useState('d_ahmed');
  const [toast, setToast]     = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const flashTimer = useRef(null);
  const toastTimer = useRef(null);

  // ---- Initial load ---------------------------------------------------------
  useEffect(() => {
    if (!isConfigured()) {
      setError('لم يتم إعداد Supabase. يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [u, d, a, n, l] = await Promise.all([
          supabase.from('users').select('*').order('name'),
          supabase.from('drivers').select('*').order('name'),
          supabase.from('appointments').select('*').order('start_iso'),
          supabase.from('notifications').select('*').order('created_at', { ascending:false }).limit(200),
          supabase.from('activity_log').select('*').order('created_at', { ascending:false }).limit(200),
        ]);
        if (cancelled) return;
        if (u.error) throw u.error;
        if (d.error) throw d.error;
        if (a.error) throw a.error;
        if (n.error) throw n.error;
        if (l.error) throw l.error;
        setUsers(u.data.map(rowToUser));
        setDrivers(d.data.map(rowToDriver));
        setAppts(a.data.map(rowToAppt));
        setNotifs(n.data.map(rowToNotif));
        setLog(l.data.map(rowToLog));
        setLoading(false);
      } catch (e) {
        console.error('Load failed:', e);
        if (!cancelled) { setError(e.message || 'فشل الاتصال'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- Tick clock (for relative-time labels) --------------------------------
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // ---- Realtime subscriptions ----------------------------------------------
  useEffect(() => {
    if (!isConfigured()) return;
    const channel = supabase.channel('maw3idi-live')
      .on('postgres_changes', { event:'*', schema:'public', table:'appointments' }, (p) => {
        setAppts(prev => applyChange(prev, p, rowToAppt));
        if (p.eventType === 'UPDATE' && p.new?.id) flashRow(p.new.id);
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'drivers' }, (p) => {
        setDrivers(prev => applyChange(prev, p, rowToDriver));
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'users' }, (p) => {
        setUsers(prev => applyChange(prev, p, rowToUser));
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications' }, (p) => {
        setNotifs(prev => [rowToNotif(p.new), ...prev].slice(0, 200));
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'notifications' }, (p) => {
        setNotifs(prev => prev.map(n => n.id === p.new.id ? rowToNotif(p.new) : n));
      })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'activity_log' }, (p) => {
        setLog(prev => [rowToLog(p.new), ...prev].slice(0, 200));
      })
      .subscribe(status => setConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, []);

  const applyChange = (prev, p, mapper) => {
    if (p.eventType === 'INSERT') return prev.some(x => x.id === p.new.id) ? prev : [...prev, mapper(p.new)];
    if (p.eventType === 'UPDATE') return prev.map(x => x.id === p.new.id ? mapper(p.new) : x);
    if (p.eventType === 'DELETE') return prev.filter(x => x.id !== p.old.id);
    return prev;
  };

  // ---- UI helpers -----------------------------------------------------------
  const push = useCallback((msg, tone='ink') => {
    setToast({ msg, tone, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const flashRow = useCallback((id) => {
    setFlashId(id);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1500);
  }, []);

  const driverName = useCallback((id) => drivers.find(d => d.id === id)?.name || '—', [drivers]);
  const userName   = useCallback((id) => users.find(u => u.id === id)?.name   || '—', [users]);

  // ---- Actions --------------------------------------------------------------
  const addLog = async (action, appointmentId, actorId='u_abdullah', details={}) => {
    const actor = users.find(u => u.id === actorId) || drivers.find(d => d.id === actorId);
    const entry = {
      id: rid('l'),
      actor_id: actorId,
      actor_name: actor?.name || 'النظام',
      actor_role: actor?.role || (drivers.find(d => d.id === actorId) ? 'driver' : 'system'),
      action, appointment_id: appointmentId, details
    };
    const { error } = await supabase.from('activity_log').insert(entry);
    if (error) console.error('log insert failed:', error);
  };

  const addNotif = async (targetRole, targetId, kind, title, body, appointmentId=null) => {
    const entry = { id: rid('n'), target_role: targetRole, target_id: targetId,
                    kind, title, body, appointment_id: appointmentId };
    const { error } = await supabase.from('notifications').insert(entry);
    if (error) console.error('notif insert failed:', error);
  };

  const createAppointment = async (partial) => {
    const a = {
      id: rid('a'),
      title: partial.title || 'موعد جديد',
      type: partial.type || 'meeting',
      startISO: partial.startISO,
      endISO: partial.endISO || partial.startISO,
      location: partial.location || '',
      notes: partial.notes || '',
      priority: partial.priority || 'normal',
      needsDriver: !!partial.needsDriver,
      driverId: partial.driverId || null,
      requestedDriverId: partial.requestedDriverId || null,
      status: partial.driverId ? 'awaiting' : (partial.needsDriver ? 'pending' : 'confirmed'),
      createdBy: partial.createdBy || 'u_abdullah',
    };
    const { error } = await supabase.from('appointments').insert(apptToRow(a));
    if (error) { push('فشل الحفظ: ' + error.message, 'clay'); return; }
    push('تم إنشاء الموعد', 'sage');
    await addLog('appointment.created', a.id, a.createdBy);
    if (a.driverId) {
      await addNotif('driver', a.driverId, 'assign', 'مهمة جديدة', a.title, a.id);
    } else if (a.needsDriver) {
      await addNotif('admin', null, 'conflict', 'موعد يحتاج سائق', a.title, a.id);
    }
  };

  const assignDriver = async (apptId, driverId) => {
    const a = appts.find(x => x.id === apptId);
    if (!a) return;
    const { error } = await supabase.from('appointments')
      .update({ driver_id: driverId, status: 'awaiting' })
      .eq('id', apptId);
    if (error) { push('فشل التعيين: ' + error.message, 'clay'); return; }
    push(`تم تعيين ${driverName(driverId).split(' ')[0]}`, 'sage');
    await addLog('appointment.assigned', apptId, 'u_abdullah', { driver: driverName(driverId) });
    await addNotif('driver', driverId, 'assign', 'تم تعيينك لموعد', a.title, apptId);
  };

  const setTripStatus = async (apptId, status, actorId=null) => {
    const a = appts.find(x => x.id === apptId);
    if (!a) return;
    const { error } = await supabase.from('appointments')
      .update({ status }).eq('id', apptId);
    if (error) { push('فشل التحديث: ' + error.message, 'clay'); return; }
    const labels = { confirmed:'مؤكد', onway:'في الطريق', arrived:'وصل', completed:'أنجز', declined:'اعتذر', cancelled:'ملغى' };
    push(`الحالة: ${labels[status] || status}`, 'sage');
    await addLog('trip.status', apptId, actorId || a.driverId, { status });
    await addNotif('owner', null, 'status', `${labels[status]}: ${a.title}`, driverName(a.driverId), apptId);
    if (status === 'declined') {
      await supabase.from('appointments').update({ driver_id: null, status: 'pending' }).eq('id', apptId);
      await addNotif('admin', null, 'decline', 'اعتذر السائق', a.title, apptId);
    }
  };

  const updateAppointment = async (apptId, patch) => {
    const row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.type !== undefined) row.type = patch.type;
    if (patch.startISO !== undefined) row.start_iso = patch.startISO;
    if (patch.endISO !== undefined) row.end_iso = patch.endISO;
    if (patch.location !== undefined) row.location = patch.location;
    if (patch.notes !== undefined) row.notes = patch.notes;
    if (patch.priority !== undefined) row.priority = patch.priority;
    if (patch.needsDriver !== undefined) row.needs_driver = patch.needsDriver;
    if (patch.driverId !== undefined) row.driver_id = patch.driverId;
    if (patch.status !== undefined) row.status = patch.status;
    const { error } = await supabase.from('appointments').update(row).eq('id', apptId);
    if (error) { push('فشل التعديل: ' + error.message, 'clay'); return; }
    push('تم التعديل', 'sage');
    await addLog('appointment.updated', apptId);
  };

  const deleteAppointment = async (apptId) => {
    const { error } = await supabase.from('appointments').delete().eq('id', apptId);
    if (error) { push('فشل الحذف: ' + error.message, 'clay'); return; }
    push('تم الحذف', 'ink');
    await addLog('appointment.deleted', apptId);
  };

  const setDriverStatus = async (driverId, status) => {
    const { error } = await supabase.from('drivers').update({ status }).eq('id', driverId);
    if (error) { push('فشل التحديث: ' + error.message, 'clay'); return; }
    const labels = { available:'متاح', busy:'مشغول', off:'خارج الخدمة' };
    push(`الحالة: ${labels[status]}`, 'sage');
    await addLog('driver.status', null, driverId, { status });
  };

  const markAllRead = async (targetRole, targetId=null) => {
    let q = supabase.from('notifications').update({ read: true }).eq('target_role', targetRole).eq('read', false);
    if (targetId) q = q.eq('target_id', targetId);
    const { error } = await q;
    if (error) console.error(error);
  };

  const value = {
    // data
    users, drivers, appts, notifs, log, now,
    // ui state
    role, setRole, currentDriverId, setCurrentDriverId,
    toast, flashId, connected, loading, error,
    // helpers
    driverName, userName, push, flashRow,
    // actions
    createAppointment, assignDriver, setTripStatus,
    updateAppointment, deleteAppointment,
    setDriverStatus, markAllRead, addLog, addNotif,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
