import React from 'react';
import { AppProvider, useApp } from './store';
import {
  Icon, I,
  APPT_TYPES, PRIORITIES, TRIP_STATUS, DRIVER_STATUS,
  toneBg, toneFg, toneDot,
  pad, AR_DAYS, AR_MONTHS, AR_MONTHS_SHORT,
  fmtDate, fmtDateShort, fmtTime12, fmtTimeFromISO,
  fmtTimeShortFromISO, fmtDateAndTime,
  sameDay, addDays, startOfDay, relativeTime, closenessOf,
  LOCATIONS,
  Badge, StatusDot, Btn, IconBtn, Card, Section, Modal, Field, inputCls,
  Avatar, TypeChip, Toast, typeInfo,
} from './components';

const LOGO = '/logo.jpg';

/* ==========================================================================
   USER APP — Owner / Assistant
   ========================================================================== */
function UserApp() {
  const [tab, setTab] = React.useState('home');
  const [addOpen, setAddOpen] = React.useState(false);
  const [addType, setAddType] = React.useState('meeting');
  const [detailId, setDetailId] = React.useState(null);
  const [aiOpen, setAiOpen] = React.useState(false);

  const tabs = [
    { key:'home',    label:'الرئيسية', Icon:I.Home },
    { key:'cal',     label:'التقويم',  Icon:I.Cal },
    { key:'add',     label:'',        Icon:I.Plus, center:true },
    { key:'drivers', label:'السائقون', Icon:I.Car  },
    { key:'more',    label:'المزيد',   Icon:I.Menu },
  ];

  const openAdd = (type='meeting') => { setAddType(type); setAddOpen(true); };

  return (
    <div className="phone-frame flex flex-col relative">
      <div className="phone-notch" />
      <div className="flex-1 overflow-y-auto parchment-noise pb-24">
        {tab === 'home'    && <UserHome onOpen={setDetailId} onAdd={openAdd} onAi={()=>setAiOpen(true)} />}
        {tab === 'cal'     && <UserCalendar onOpen={setDetailId} onAdd={()=>openAdd('meeting')} />}
        {tab === 'drivers' && <UserDrivers />}
        {tab === 'more'    && <UserMore />}
      </div>

      {/* Bottom nav */}
      <nav className="absolute bottom-0 left-0 right-0 bg-paper/95 backdrop-blur hairline-t px-3 pt-2 pb-4">
        <div className="flex items-end justify-around">
          {tabs.map((t, i) => {
            const active = tab === t.key;
            if (t.center) return (
              <button key={i} onClick={()=>openAdd('meeting')}
                className="w-14 h-14 rounded-full bg-ink text-parchment flex items-center justify-center shadow-pop -mt-6 hover:bg-ink2 transition-colors">
                <I.Plus size={26} stroke={2.2}/>
              </button>
            );
            return (
              <button key={i} onClick={()=>setTab(t.key)}
                className={`flex flex-col items-center gap-1 py-1 px-2 min-w-[52px] ${active?'text-brass':'text-stone'} transition-colors`}>
                <t.Icon size={22} stroke={active?2.2:1.7}/>
                <span className={`text-[11px] ${active?'font-bold':'font-medium'}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {addOpen && <AddAppointmentModal onClose={()=>setAddOpen(false)} initialType={addType} />}
      {detailId && <AppointmentDetail id={detailId} onClose={()=>setDetailId(null)} />}
      {aiOpen && <AiAssistantModal onClose={()=>setAiOpen(false)} onCreated={id=>{setAiOpen(false); setDetailId(id);}} />}
    </div>
  );
}

/* ---------- HOME ---------- */
function UserHome({ onOpen, onAdd, onAi }) {
  const { appts, drivers, notifs, now, users } = useApp();
  const me = users.find(u => u.role === 'owner');
  const today = startOfDay(now);
  const todaysAppts = appts.filter(a => sameDay(new Date(a.startISO), today))
                            .sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
  const upcoming = todaysAppts.find(a => new Date(a.endISO) > now) || todaysAppts[todaysAppts.length-1];
  const needDriver = appts.filter(a => a.needsDriver && !a.driverId && new Date(a.startISO) > now);
  const conflicts  = detectConflicts(appts);
  const unread = notifs.filter(n => n.targetRole === 'owner' && !n.read).length;

  const hour = now.getHours();
  const greet = hour < 5 ? 'ليلة مباركة' : hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : hour < 22 ? 'مساء الخير' : 'ليلة مباركة';

  // Smart status line
  let smart = { tone:'sage', text:'جدولك اليوم منظّم.', icon:<I.Check size={16} stroke={2.2}/> };
  if (needDriver.length) smart = { tone:'clay', text:`${needDriver.length} موعد بحاجة إلى تعيين سائق`, icon:<I.Warn size={16} stroke={2.2}/> };
  else if (conflicts.length) smart = { tone:'clay', text:`${conflicts.length} تعارض يحتاج إلى مراجعة`, icon:<I.Warn size={16} stroke={2.2}/> };
  else if (todaysAppts.length >= 6) smart = { tone:'brass', text:`يوم مزدحم — ${todaysAppts.length} مواعيد`, icon:<I.Bolt size={16} stroke={2.2}/> };

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={me.avatar} name={me.name} size={44} ring />
          <div>
            <div className="text-xs text-stone leading-tight">{greet}</div>
            <div className="text-[15px] font-bold text-ink serif leading-tight">الحبيب حامد بن عمر</div>
          </div>
        </div>
        <button className="relative w-10 h-10 rounded-full bg-paper hairline flex items-center justify-center">
          <I.Bell size={19} stroke={1.8}/>
          {unread>0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
        </button>
      </header>

      {/* Date + smart line */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-stone">{fmtDate(now)}</div>
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${toneFg(smart.tone)}`}>
          {smart.icon} <span>{smart.text}</span>
        </div>
      </div>

      {/* Next appointment hero */}
      {upcoming && <NextApptHero appt={upcoming} now={now} onOpen={()=>onOpen(upcoming.id)} />}

      {/* Day summary strip */}
      <div className="grid grid-cols-4 gap-2">
        <Stat n={todaysAppts.length}                                              label="مواعيد اليوم" tone="ink"/>
        <Stat n={todaysAppts.filter(a=>a.needsDriver).length}                     label="مشاوير"      tone="brass"/>
        <Stat n={todaysAppts.filter(a=>a.priority==='urgent'||a.type==='urgent').length + needDriver.length} label="تحتاج انتباه" tone="clay"/>
        <Stat n={drivers.filter(d=>d.status==='available').length}                label="سائق متاح"    tone="sage"/>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        <QuickAction icon={<I.Plus size={18} stroke={2}/>}   label="موعد"   onClick={()=>onAdd('meeting')} />
        <QuickAction icon={<I.Car size={18} stroke={2}/>}    label="مشوار"  onClick={()=>onAdd('meeting')} />
        <QuickAction icon={<I.Zap size={18} stroke={2}/>}    label="طارئ"   tone="clay" onClick={()=>onAdd('urgent')} />
        <QuickAction icon={<I.Sparkle size={18} stroke={2}/>}label="مساعد"  tone="brass" onClick={onAi} />
      </div>

      {/* Timeline of today */}
      <Section title="جدول اليوم" right={<span className="text-xs text-stone">{todaysAppts.length} موعد</span>}>
        <DayTimeline items={todaysAppts} onOpen={onOpen} now={now} />
      </Section>

      {/* Alerts */}
      {needDriver.length > 0 && (
        <Section title="بحاجة إلى تعيين سائق">
          {needDriver.slice(0,3).map(a => (
            <Card key={a.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-chip bg-clayLite text-clay flex items-center justify-center shrink-0"><I.Car size={17}/></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink truncate">{a.title}</div>
                <div className="text-xs text-stone mt-0.5 flex items-center gap-2">
                  <I.Clock size={12}/> {fmtTimeFromISO(a.startISO)} <span className="text-line">·</span> <I.Pin size={12}/> <span className="truncate">{a.location.split(' — ')[0]}</span>
                </div>
              </div>
              <Btn size="sm" variant="brass" onClick={()=>onOpen(a.id)}>تعيين</Btn>
            </Card>
          ))}
        </Section>
      )}
    </div>
  );
}

function NextApptHero({ appt, now, onOpen }) {
  const t = typeInfo(appt.type);
  const st = TRIP_STATUS[appt.status];
  const isPast = new Date(appt.endISO) < now;
  const isNow = new Date(appt.startISO) <= now && new Date(appt.endISO) >= now;
  const rel = relativeTime(appt.startISO, now);

  return (
    <button onClick={onOpen} className="w-full text-right block rounded-hero bg-ink text-parchment p-5 shadow-pop overflow-hidden relative">
      <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-brass/10" />
      <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-brassLite/5" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-brassLite">
            {isNow ? 'الآن' : isPast ? 'الموعد الأخير' : 'الموعد القادم'}
          </span>
          <span className="text-[11px] font-medium text-parchment/70">{rel}</span>
        </div>
        <div className="text-4xl serif num text-parchment leading-none">
          {fmtTimeShortFromISO(appt.startISO)}
          <span className="text-lg mr-2 text-brassLite">{new Date(appt.startISO).getHours()>=12?'م':'ص'}</span>
        </div>
        <div className="mt-3 text-lg font-bold leading-tight">{appt.title}</div>
        <div className="mt-1.5 text-[13px] text-parchment/80 flex items-center gap-1.5">
          <I.Pin size={13}/> {appt.location}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-chip bg-parchment/10 text-parchment`}>
            <t.icon size={12} stroke={2}/> {t.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-chip bg-parchment/10 text-parchment`}>
            <StatusDot tone={st.tone==='ink'?'brass':st.tone} /> {st.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function Stat({ n, label, tone='ink' }) {
  return (
    <div className="bg-paper hairline rounded-card p-2.5 text-center">
      <div className={`text-xl font-bold num ${toneFg(tone)}`}>{n}</div>
      <div className="text-[10px] text-stone mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
function QuickAction({ icon, label, onClick, tone='ink' }) {
  return (
    <button onClick={onClick}
      className={`bg-paper hairline rounded-card py-3 flex flex-col items-center gap-1.5 hover:bg-line2/50 transition-colors`}>
      <span className={`${toneFg(tone)}`}>{icon}</span>
      <span className="text-[11px] font-medium text-ink">{label}</span>
    </button>
  );
}

/* Today's timeline (rail-style vertical) */
function DayTimeline({ items, onOpen, now }) {
  const { flashId, driverName } = useApp();
  if (items.length === 0) return (
    <Card><div className="text-sm text-stone text-center py-6">لا مواعيد اليوم — استرح 🌿<div className="text-xs text-stone2 mt-1">استخدم زر (+) لإضافة موعد.</div></div></Card>
  );
  return (
    <div className="relative rail pr-9">
      {items.map((a, idx) => {
        const t = typeInfo(a.type);
        const st = TRIP_STATUS[a.status];
        const isPast = new Date(a.endISO) < now;
        const flashed = flashId===a.id;
        return (
          <div key={a.id} className="relative mb-3">
            <span className={`absolute right-4 top-4 w-4 h-4 rounded-full ${toneDot(t.tone)} ${isPast?'opacity-40':''} ring-4 ring-parchment`}
              style={{transform:'translateX(50%)'}} />
            <button onClick={()=>onOpen(a.id)} className={`w-full text-right bg-paper hairline rounded-card p-3.5 flex items-start gap-3 transition-all ${isPast?'opacity-60':''} ${flashed?'ring-2 ring-brass':''}`}>
              <div className="text-[11px] font-bold text-stone num w-16 shrink-0 pt-0.5">
                <div>{fmtTimeShortFromISO(a.startISO)}<span className="text-stone2 mr-1">{new Date(a.startISO).getHours()>=12?'م':'ص'}</span></div>
                <div className="text-stone2 text-[10px] mt-0.5">{Math.round((new Date(a.endISO)-new Date(a.startISO))/60000)} د</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink leading-tight">{a.title}</div>
                <div className="text-[11px] text-stone mt-1 flex items-center gap-1.5"><I.Pin size={11}/><span className="truncate">{a.location}</span></div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <TypeChip type={a.type}/>
                  {a.needsDriver && (
                    <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-chip ${toneBg(st.tone)} ${toneFg(st.tone)}`}>
                      <I.Car size={11}/> {a.driverId ? driverName(a.driverId).split(' ')[0] : 'بدون سائق'}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- CALENDAR ---------- */
function UserCalendar({ onOpen, onAdd }) {
  const { appts, now } = useApp();
  const [mode, setMode] = React.useState('week');
  const [anchor, setAnchor] = React.useState(startOfDay(now));

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink serif">التقويم</h2>
        <div className="inline-flex bg-paper hairline rounded-chip p-0.5">
          {['day','week','month'].map(m => (
            <button key={m} onClick={()=>setMode(m)}
              className={`text-xs font-medium px-3 py-1.5 rounded-[5px] transition-colors ${mode===m?'bg-ink text-parchment':'text-stone'}`}>
              {m==='day'?'يوم':m==='week'?'أسبوع':'شهر'}
            </button>
          ))}
        </div>
      </header>

      <div className="flex items-center justify-between">
        <IconBtn onClick={()=>setAnchor(addDays(anchor, mode==='day'?-1:mode==='week'?-7:-30))}><I.ChevronR size={20}/></IconBtn>
        <div className="text-sm font-bold text-ink">
          {mode==='month'
            ? `${AR_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
            : `${fmtDateShort(anchor)}${mode==='week'?` — ${fmtDateShort(addDays(anchor,6))}`:''}`}
        </div>
        <IconBtn onClick={()=>setAnchor(addDays(anchor, mode==='day'?1:mode==='week'?7:30))}><I.Chevron size={20}/></IconBtn>
      </div>

      {mode==='day'   && <DayView appts={appts} date={anchor} onOpen={onOpen}/>}
      {mode==='week'  && <WeekView appts={appts} start={anchor} onOpen={onOpen}/>}
      {mode==='month' && <MonthView appts={appts} anchor={anchor} onOpen={onOpen} setAnchor={setAnchor} setMode={setMode}/>}
    </div>
  );
}

function DayView({ appts, date, onOpen }) {
  const items = appts.filter(a => sameDay(new Date(a.startISO), date))
                     .sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
  if (!items.length) return <Card><div className="text-center text-sm text-stone py-8">لا مواعيد في هذا اليوم</div></Card>;
  return <DayTimeline items={items} onOpen={onOpen} now={new Date()} />;
}

function WeekView({ appts, start, onOpen }) {
  const { driverName } = useApp();
  const days = Array.from({length:7}, (_,i)=>addDays(start,i));
  return (
    <div className="space-y-3">
      {days.map(d => {
        const its = appts.filter(a => sameDay(new Date(a.startISO), d)).sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
        const isToday = sameDay(d, new Date());
        return (
          <div key={d.toISOString()}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`text-xs font-bold ${isToday?'text-brass':'text-ink'}`}>{AR_DAYS[d.getDay()]} {d.getDate()}</div>
              {isToday && <Badge tone="brass" size="sm">اليوم</Badge>}
              <div className="flex-1 h-px bg-line2"></div>
              <span className="text-[11px] text-stone">{its.length} موعد</span>
            </div>
            {its.length === 0 ? (
              <div className="text-[11px] text-stone2 pr-2">—</div>
            ) : (
              <div className="space-y-1.5">
                {its.map(a => (
                  <button key={a.id} onClick={()=>onOpen(a.id)}
                    className="w-full text-right bg-paper hairline rounded-chip p-2.5 flex items-center gap-2.5">
                    <div className="w-1 h-8 rounded-full" style={{background:`var(--tw-${typeInfo(a.type).tone})`}}></div>
                    <span className={`w-1.5 h-1.5 rounded-full ${toneDot(typeInfo(a.type).tone)}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{a.title}</div>
                      <div className="text-[11px] text-stone truncate">{a.location.split(' — ')[0]}</div>
                    </div>
                    <div className="text-[11px] font-bold text-stone num">{fmtTimeShortFromISO(a.startISO)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ appts, anchor, onOpen, setAnchor, setMode }) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startPad = first.getDay(); // Sun=0
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth()+1, 0).getDate();
  const cells = [];
  for (let i=0;i<startPad;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-stone2 mb-1 text-center">
        {['ح','ن','ث','ر','خ','ج','س'].map((d,i)=><div key={i} className="py-1 font-bold">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square"></div>;
          const its = appts.filter(a => sameDay(new Date(a.startISO), d));
          const isToday = sameDay(d, new Date());
          return (
            <button key={i} onClick={()=>{setAnchor(d); setMode('day');}}
              className={`aspect-square rounded-chip hairline p-1 flex flex-col items-center justify-start gap-1 hover:bg-line2 transition-colors ${isToday?'bg-ink text-parchment border-ink':'bg-paper'}`}>
              <span className={`text-xs font-bold num ${isToday?'':''}`}>{d.getDate()}</span>
              <div className="flex gap-0.5">
                {its.slice(0,3).map((a,j)=>(
                  <span key={j} className={`w-1 h-1 rounded-full ${toneDot(typeInfo(a.type).tone)}`}/>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- DRIVERS TAB ---------- */
function UserDrivers() {
  const { drivers, appts, now } = useApp();
  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink serif">السائقون</h2>
        <Btn size="sm" variant="outline"><I.Plus size={14}/> إضافة سائق</Btn>
      </header>

      <div className="space-y-3">
        {drivers.map(d => {
          const ds = DRIVER_STATUS[d.status];
          const dTrips = appts.filter(a => a.driverId === d.id);
          const upcoming = dTrips.filter(a => new Date(a.endISO) > now).sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
          const next = upcoming[0];
          return (
            <Card key={d.id}>
              <div className="flex items-center gap-3">
                <Avatar name={d.name} size={48}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-ink truncate">{d.name}</div>
                    <Badge tone={ds.tone} dot size="sm">{ds.label}</Badge>
                  </div>
                  <div className="text-xs text-stone mt-0.5 flex items-center gap-1"><I.Phone size={11}/> {d.phone}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 hairline-t grid grid-cols-3 gap-2 text-center">
                <div><div className="text-sm font-bold num text-ink">{dTrips.length}</div><div className="text-[10px] text-stone">مشوار</div></div>
                <div><div className="text-sm font-bold num text-sage">{dTrips.filter(t=>t.status==='completed').length}</div><div className="text-[10px] text-stone">مكتمل</div></div>
                <div><div className="text-sm font-bold num text-brass">{upcoming.length}</div><div className="text-[10px] text-stone">قادم</div></div>
              </div>
              {next && (
                <div className="mt-3 pt-3 hairline-t">
                  <div className="text-[10px] font-bold text-stone mb-1">المهمة القادمة</div>
                  <div className="text-xs text-ink font-medium">{next.title}</div>
                  <div className="text-[11px] text-stone mt-0.5">{fmtDateAndTime(next.startISO)} · {next.location.split(' — ')[0]}</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- MORE TAB ---------- */
function UserMore() {
  const { notifs, log, users } = useApp();
  const me = users.find(u => u.role === 'owner');
  const myNotifs = notifs.filter(n => n.targetRole === 'owner');
  const myLog = log.slice(0, 15);
  const [tab, setTab] = React.useState('notifs');
  return (
    <div className="p-4 space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar src={me.avatar} name={me.name} size={56} ring/>
          <div>
            <div className="text-base font-bold text-ink serif">{me.name}</div>
            <div className="text-xs text-stone mt-0.5">{me.phone}</div>
            <Badge tone="brass" size="sm">صاحب الحساب</Badge>
          </div>
        </div>
      </Card>

      <div className="inline-flex bg-paper hairline rounded-chip p-0.5 w-full">
        {[['notifs','الإشعارات'],['log','سجل النشاط'],['set','الإعدادات']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`flex-1 text-xs font-medium py-1.5 rounded-[5px] ${tab===k?'bg-ink text-parchment':'text-stone'}`}>{l}</button>
        ))}
      </div>

      {tab==='notifs' && (
        <div className="space-y-2">
          {myNotifs.length===0 && <Card><div className="text-center text-sm text-stone py-6">لا إشعارات</div></Card>}
          {myNotifs.map(n => <NotifRow key={n.id} n={n}/>)}
        </div>
      )}
      {tab==='log' && (
        <Card pad={false}>
          <div className="divide-hair">
            {myLog.map(l => (
              <div key={l.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-line2 text-ink flex items-center justify-center shrink-0">
                  <I.Activity size={13}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink">{l.label}</div>
                  <div className="text-[11px] text-stone mt-0.5">{fmtDateAndTime(l.ts)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {tab==='set' && (
        <div className="space-y-2">
          <SettingRow label="اللغة" value="العربية"/>
          <SettingRow label="المدينة الافتراضية" value="تريم، حضرموت"/>
          <SettingRow label="المنطقة الزمنية" value="Asia/Aden"/>
          <SettingRow label="التذكيرات" value="قبل يوم، ساعتين، ٣٠ د"/>
          <SettingRow label="إشعارات الواتساب" value="مفعّلة"/>
        </div>
      )}
    </div>
  );
}
function SettingRow({ label, value }) {
  return (
    <Card className="flex items-center justify-between !py-3">
      <span className="text-sm text-ink">{label}</span>
      <span className="text-xs text-stone">{value}</span>
    </Card>
  );
}
function NotifRow({ n }) {
  const iconMap = {
    assign:   <I.User size={16}/>,
    accept:   <I.Check size={16}/>,
    decline:  <I.X size={16}/>,
    status:   <I.Route size={16}/>,
    conflict: <I.Warn size={16}/>,
    reminder: <I.Clock size={16}/>,
    urgent:   <I.Bolt size={16}/>,
  };
  const tone = ({accept:'sage', status:'sage', conflict:'clay', decline:'clay', urgent:'clay', reminder:'brass', assign:'indigo'})[n.kind] || 'ink';
  return (
    <Card className="!p-3 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-chip ${toneBg(tone)} ${toneFg(tone)} flex items-center justify-center shrink-0`}>
        {iconMap[n.kind] || <I.Bell size={16}/>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink">{n.title}</div>
        <div className="text-xs text-stone mt-0.5">{n.body}</div>
        <div className="text-[10px] text-stone2 mt-1">{fmtDateAndTime(n.createdAt)}</div>
      </div>
    </Card>
  );
}

/* ---------- ADD APPOINTMENT MODAL ---------- */
function LocationAutocomplete({ value, onChange, placeholder }) {
  const [open, setOpen] = React.useState(false);
  const suggestions = React.useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return LOCATIONS;
    return LOCATIONS.filter(l => l.toLowerCase().includes(q));
  }, [value]);
  return (
    <div className="relative">
      <input
        className={inputCls}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-paper hairline rounded-chip shadow-pop max-h-60 overflow-y-auto">
          {suggestions.slice(0, 8).map(loc => (
            <button
              key={loc} type="button"
              onMouseDown={e => { e.preventDefault(); onChange(loc); setOpen(false); }}
              className="w-full text-right px-3 py-2 text-sm hover:bg-parchment flex items-center gap-2 transition-colors">
              <I.Pin size={13} className="text-stone2 shrink-0"/>
              <span className="text-ink">{loc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddAppointmentModal({ onClose, initialType='meeting' }) {
  const { createAppointment, drivers, push } = useApp();
  const [form, setForm] = React.useState(() => {
    const start = new Date(); start.setMinutes(0,0,0); start.setHours(start.getHours()+1);
    const end = new Date(start); end.setHours(end.getHours()+1);
    return {
      title:'', type:initialType, customType:'', priority:initialType==='urgent'?'urgent':'normal',
      date: `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`,
      startTime:`${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime:`${pad(end.getHours())}:${pad(end.getMinutes())}`,
      location:'', notes:'', needsDriver:false, driverId:'', broadcast:false,
    };
  });
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { push('العنوان مطلوب', 'clay'); return; }
    if (!form.location.trim()) { push('الموقع مطلوب', 'clay'); return; }
    if (form.type === 'custom' && !form.customType.trim()) { push('اكتب اسم النوع المخصص', 'clay'); return; }
    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end   = new Date(`${form.date}T${form.endTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) { push('تاريخ أو وقت غير صحيح', 'clay'); return; }
    const finalType = form.type === 'custom' ? form.customType.trim() : form.type;
    createAppointment({
      title:form.title.trim(), type:finalType, priority:form.priority,
      startISO:start.toISOString(), endISO:end.toISOString(),
      location:form.location.trim(), notes:form.notes,
      needsDriver:form.needsDriver, driverId: form.needsDriver && !form.broadcast ? form.driverId : null,
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={initialType==='urgent'?'موعد طارئ':'إضافة موعد'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="العنوان">
          <input className={inputCls} value={form.title} onChange={e=>set('title', e.target.value)} placeholder="مثلاً: درس التفسير الأسبوعي"/>
        </Field>

        <Field label="نوع الموعد">
          <div className="grid grid-cols-3 gap-2">
            {Object.values(APPT_TYPES).map(t => (
              <button type="button" key={t.key} onClick={()=>set('type', t.key)}
                className={`p-2.5 rounded-chip flex flex-col items-center gap-1 text-xs font-medium transition-colors ${form.type===t.key ? `${toneBg(t.tone)} ${toneFg(t.tone)} ring-2 ring-brass` : 'bg-parchment hairline text-stone'}`}>
                <t.icon size={16}/> {t.label}
              </button>
            ))}
            <button type="button" onClick={()=>set('type','custom')}
              className={`p-2.5 rounded-chip flex flex-col items-center gap-1 text-xs font-medium transition-colors ${form.type==='custom' ? 'bg-brass/15 text-brass ring-2 ring-brass' : 'bg-parchment hairline text-stone'}`}>
              <I.Edit size={16}/> أخرى
            </button>
          </div>
          {form.type === 'custom' && (
            <input className={`${inputCls} mt-2`} value={form.customType} onChange={e=>set('customType', e.target.value)} placeholder="اكتب اسم النوع (مثال: مقابلة إعلامية)"/>
          )}
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="التاريخ"><input type="date" className={inputCls} value={form.date} onChange={e=>set('date',e.target.value)}/></Field>
          <Field label="البداية"><input type="time" className={inputCls} value={form.startTime} onChange={e=>set('startTime',e.target.value)}/></Field>
          <Field label="النهاية"><input type="time" className={inputCls} value={form.endTime}   onChange={e=>set('endTime',e.target.value)}/></Field>
        </div>

        <Field label="الموقع" hint="اكتب أي موقع، والاقتراحات تظهر تلقائياً">
          <LocationAutocomplete value={form.location} onChange={v=>set('location',v)} placeholder="مثلاً: دار المصطفى — تريم"/>
        </Field>

        <Field label="الأولوية">
          <div className="grid grid-cols-4 gap-2">
            {Object.values(PRIORITIES).map(p => (
              <button type="button" key={p.key} onClick={()=>set('priority', p.key)}
                className={`text-xs font-medium py-2 rounded-chip transition-colors ${form.priority===p.key ? `${toneBg(p.tone)} ${toneFg(p.tone)} ring-2 ring-brass`:'bg-parchment hairline text-stone'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="ملاحظات">
          <textarea rows="2" className={inputCls} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="ملاحظات إضافية"/>
        </Field>

        <div className="bg-parchment hairline rounded-card p-3 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.needsDriver} onChange={e=>set('needsDriver',e.target.checked)} className="w-4 h-4 rounded"/>
            <span className="text-sm font-medium text-ink">يحتاج إلى سائق</span>
          </label>
          {form.needsDriver && (
            <div className="space-y-2 pr-6">
              <label className="flex items-center gap-2">
                <input type="radio" checked={!form.broadcast} onChange={()=>set('broadcast',false)}/>
                <span className="text-xs text-ink">تعيين سائق محدد</span>
              </label>
              {!form.broadcast && (
                <select className={inputCls} value={form.driverId} onChange={e=>set('driverId',e.target.value)}>
                  <option value="">— اختر —</option>
                  {drivers.map(d=><option key={d.id} value={d.id}>{d.name} ({DRIVER_STATUS[d.status].label})</option>)}
                </select>
              )}
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.broadcast} onChange={()=>set('broadcast',true)}/>
                <span className="text-xs text-ink">إرسال الطلب لجميع السائقين</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Btn type="button" variant="ghost" onClick={onClose} className="flex-1">إلغاء</Btn>
          <Btn type="submit" variant={initialType==='urgent'?'clay':'primary'} className="flex-1">
            {initialType==='urgent'?'إرسال الآن':'إنشاء الموعد'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- APPOINTMENT DETAIL ---------- */
function AppointmentDetail({ id, onClose }) {
  const { appts, drivers, assignDriver, deleteAppointment, log, driverName } = useApp();
  const appt = appts.find(a => a.id === id);
  const [assign, setAssign] = React.useState(false);
  if (!appt) { onClose(); return null; }
  const t = typeInfo(appt.type);
  const st = TRIP_STATUS[appt.status];
  const apptLog = log.filter(l => l.appointmentId === appt.id).slice(0, 8);

  return (
    <Modal open onClose={onClose} title="تفاصيل الموعد" size="md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-ink leading-tight">{appt.title}</div>
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <TypeChip type={appt.type}/>
              <Badge tone={PRIORITIES[appt.priority].tone} size="sm">{PRIORITIES[appt.priority].label}</Badge>
              {appt.needsDriver && <Badge tone={st.tone} dot size="sm">{st.label}</Badge>}
            </div>
          </div>
        </div>

        <div className="bg-parchment hairline rounded-card p-3 space-y-2.5">
          <DetailRow icon={<I.Cal size={15}/>}   label="التاريخ" value={fmtDate(new Date(appt.startISO))}/>
          <DetailRow icon={<I.Clock size={15}/>} label="الوقت"   value={`${fmtTimeFromISO(appt.startISO)} — ${fmtTimeFromISO(appt.endISO)}`}/>
          <DetailRow icon={<I.Pin size={15}/>}   label="الموقع"  value={appt.location}/>
          {appt.notes && <DetailRow icon={<I.List size={15}/>} label="ملاحظات" value={appt.notes}/>}
        </div>

        {appt.needsDriver && (
          <Card className="!p-3">
            <div className="text-xs font-bold text-stone mb-2">السائق</div>
            {appt.driverId ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={driverName(appt.driverId)} size={36}/>
                  <div>
                    <div className="text-sm font-bold text-ink">{driverName(appt.driverId)}</div>
                    <Badge tone={st.tone} dot size="sm">{st.label}</Badge>
                  </div>
                </div>
                <Btn size="sm" variant="ghost" onClick={()=>setAssign(true)}>تغيير</Btn>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-clay flex items-center gap-1.5"><I.Warn size={14}/> بحاجة إلى تعيين سائق</div>
                <Btn size="sm" variant="brass" onClick={()=>setAssign(true)}>تعيين سائق</Btn>
              </div>
            )}
            {assign && (
              <div className="mt-3 pt-3 hairline-t space-y-2">
                {drivers.map(d => {
                  const conflict = hasConflict(appts, d.id, appt);
                  return (
                    <button key={d.id} disabled={conflict}
                      onClick={()=>{assignDriver(appt.id, d.id); setAssign(false);}}
                      className={`w-full text-right p-2.5 rounded-chip hairline flex items-center justify-between gap-2 ${conflict?'opacity-60':'hover:bg-line2'}`}>
                      <div className="flex items-center gap-2">
                        <Avatar name={d.name} size={30}/>
                        <div>
                          <div className="text-sm font-medium text-ink">{d.name}</div>
                          <div className="text-[10px] text-stone">{DRIVER_STATUS[d.status].label}</div>
                        </div>
                      </div>
                      {conflict ? <Badge tone="clay" size="sm">لديه مشوار متعارض</Badge>
                                : <Btn size="sm" variant="outline">اختيار</Btn>}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {apptLog.length>0 && (
          <div>
            <div className="text-xs font-bold text-stone mb-2">سجل الموعد</div>
            <Card pad={false}>
              <div className="divide-hair">
                {apptLog.map(l => (
                  <div key={l.id} className="px-3 py-2.5 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-line2 flex items-center justify-center"><I.Activity size={11}/></div>
                    <div className="flex-1 text-xs text-ink">{l.label}</div>
                    <div className="text-[10px] text-stone2 num">{fmtTimeShortFromISO(l.ts)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="ghost" className="flex-1" onClick={()=>{ if(confirm('حذف الموعد؟')){ deleteAppointment(appt.id); onClose(); }}}><I.Trash size={14}/> حذف</Btn>
          <Btn variant="outline" className="flex-1"><I.Edit size={14}/> تعديل</Btn>
        </div>
      </div>
    </Modal>
  );
}
function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div className="text-stone2 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-[10px] text-stone">{label}</div>
        <div className="text-ink">{value}</div>
      </div>
    </div>
  );
}

/* ---------- AI ASSISTANT MODAL ---------- */
function AiAssistantModal({ onClose, onCreated }) {
  const { createAppointment, drivers } = useApp();
  const [text, setText] = React.useState('بكرة عندي اجتماع في دار المصطفى الساعة ٤ عصراً وأحتاج أحمد يوصلني');
  const [parsed, setParsed] = React.useState(null);

  const parse = () => {
    // Simple heuristic parser (demo)
    const now = new Date();
    let d = new Date(now); if (/بكرة|غدا|غداً/.test(text)) d = addDays(now, 1);
    let hour = 10, min = 0, isPm = false;
    const timeM = text.match(/(\d{1,2})[:\.]?(\d{0,2})?\s*(صباح|صباحاً|صباحا|ص|مساء|مساءً|مساءا|م|عصر|عصراً|ظهر|ظهراً|فجر|فجراً)?/);
    if (timeM) {
      hour = parseInt(timeM[1],10);
      if (timeM[2]) min = parseInt(timeM[2],10);
      const period = timeM[3];
      if (/مساء|م|عصر|ظهر/.test(period||'') || (!period && hour>=1 && hour<=7)) { isPm = true; }
      if (isPm && hour < 12) hour += 12;
    }
    const arDigits = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
    const norm = text.replace(/[٠-٩]/g, ch => arDigits[ch]);
    const timeM2 = norm.match(/(\d{1,2})[:\.]?(\d{0,2})?\s*(صباح|ص|مساء|م|عصر|ظهر|فجر)?/);
    if (timeM2){
      hour = parseInt(timeM2[1],10);
      min  = timeM2[2] ? parseInt(timeM2[2],10) : 0;
      const per = timeM2[3];
      if (/مساء|م|عصر|ظهر/.test(per||'') || (!per && hour>=1 && hour<=7)) { if (hour < 12) hour += 12; }
    }
    d.setHours(hour, min, 0, 0);
    const end = new Date(d); end.setHours(end.getHours()+1);

    let location = 'تريم';
    for (const loc of LOCATIONS) {
      const key = loc.split(' — ')[0];
      if (text.includes(key)) { location = loc; break; }
    }

    let title = 'موعد جديد';
    if (/اجتماع/.test(text)) title = 'اجتماع';
    else if (/درس/.test(text)) title = 'درس';
    else if (/زيارة/.test(text)) title = 'زيارة';
    else if (/سفر|مطار/.test(text)) title = 'سفر';
    if (/مع\s+(\S+)/.test(text)) title += ' مع ' + text.match(/مع\s+(\S+)/)[1];

    let type = /درس/.test(text)?'lesson':/اجتماع/.test(text)?'meeting':/سفر|مطار/.test(text)?'travel':/زيارة/.test(text)?'visit':'meeting';
    let driverId = null;
    for (const dr of drivers) {
      const first = dr.name.split(' ')[0];
      if (text.includes(first)) { driverId = dr.id; break; }
    }
    const needsDriver = !!driverId || /سائق|يوصل|يأخذ|يوديني/.test(text);

    setParsed({ title, type, start:d.toISOString(), end:end.toISOString(), location, needsDriver, driverId });
  };

  const confirm = () => {
    createAppointment({ ...parsed, priority:'normal', notes:`أُنشئ بواسطة المساعد الذكي: "${text}"` });
    onCreated && onCreated(id);
  };

  return (
    <Modal open onClose={onClose} title="المساعد الذكي" size="md">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-brass">
          <I.Sparkle size={14}/> اكتب طلبك بلغتك الطبيعية وسأجهّز الموعد
        </div>
        <div className="relative">
          <textarea rows="3" className={inputCls} value={text} onChange={e=>setText(e.target.value)}
            placeholder='مثال: بكرة عندي درس بعد المغرب في مسجد المحضار'/>
          <button type="button" className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-brass text-white flex items-center justify-center"><I.Mic size={15}/></button>
        </div>
        <Btn onClick={parse} className="w-full" variant="brass"><I.Sparkle size={15}/> تحليل الطلب</Btn>

        {parsed && (
          <Card className="!p-3 space-y-2 bg-parchment">
            <div className="text-xs font-bold text-brass mb-1 flex items-center gap-1.5"><I.Check size={13}/> فهمتُ التالي:</div>
            <DetailRow icon={<I.Book size={14}/>}  label="العنوان"  value={parsed.title}/>
            <DetailRow icon={<I.Clock size={14}/>} label="الوقت"    value={fmtDateAndTime(parsed.start)}/>
            <DetailRow icon={<I.Pin size={14}/>}   label="الموقع"   value={parsed.location}/>
            <DetailRow icon={<I.Car size={14}/>}   label="السائق"   value={parsed.driverId ? (drivers.find(d=>d.id===parsed.driverId)?.name || '—') : (parsed.needsDriver?'يحتاج سائق':'بدون سائق')}/>
            <Btn onClick={confirm} className="w-full mt-2"><I.Check size={15}/> تأكيد الإنشاء</Btn>
          </Card>
        )}
      </div>
    </Modal>
  );
}

/* Helpers */
function hasConflict(appts, driverId, target) {
  const s = new Date(target.startISO).getTime(), e = new Date(target.endISO).getTime();
  return appts.some(a => a.id !== target.id && a.driverId === driverId
    && !['completed','cancelled','declined'].includes(a.status)
    && new Date(a.startISO).getTime() < e && new Date(a.endISO).getTime() > s);
}
function detectConflicts(appts) {
  const list = [];
  for (let i=0;i<appts.length;i++) for (let j=i+1;j<appts.length;j++) {
    const a=appts[i], b=appts[j];
    if (a.driverId && a.driverId === b.driverId
      && !['completed','cancelled','declined'].includes(a.status)
      && !['completed','cancelled','declined'].includes(b.status)
      && new Date(a.startISO) < new Date(b.endISO) && new Date(a.endISO) > new Date(b.startISO)) {
      list.push([a,b]);
    }
  }
  return list;
}
/* ==========================================================================
   DRIVER APP
   ========================================================================== */
function DriverApp() {
  const { drivers, currentDriverId, setCurrentDriverId } = useApp();
  const [tab, setTab] = React.useState('home');
  const driver = drivers.find(d => d.id === currentDriverId) || drivers[0];

  const tabs = [
    { key:'home',   label:'الرئيسية',   Icon:I.Home },
    { key:'tasks',  label:'المهام',     Icon:I.List },
    { key:'cal',    label:'التقويم',    Icon:I.Cal },
    { key:'notifs', label:'الإشعارات',  Icon:I.Bell },
    { key:'acct',   label:'الحساب',    Icon:I.User },
  ];

  return (
    <div className="phone-frame flex flex-col relative">
      <div className="phone-notch" />
      <div className="flex-1 overflow-y-auto parchment-noise pb-24">
        {/* Driver selector strip (demo helper) */}
        <div className="bg-ink text-parchment/90 text-[11px] px-4 py-1.5 flex items-center justify-between">
          <span className="opacity-70">وضع السائق (تجريبي):</span>
          <div className="flex gap-1">
            {drivers.map(d => (
              <button key={d.id} onClick={()=>setCurrentDriverId(d.id)}
                className={`px-2 py-0.5 rounded text-[10px] ${currentDriverId===d.id?'bg-brass text-white':'bg-white/10'}`}>
                {d.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {tab==='home'   && <DriverHome driver={driver}/>}
        {tab==='tasks'  && <DriverTasks driver={driver}/>}
        {tab==='cal'    && <DriverCalendar driver={driver}/>}
        {tab==='notifs' && <DriverNotifs driver={driver}/>}
        {tab==='acct'   && <DriverAccount driver={driver}/>}
      </div>

      <nav className="absolute bottom-0 left-0 right-0 bg-paper/95 backdrop-blur hairline-t px-3 py-2 pb-4">
        <div className="flex items-end justify-around">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={()=>setTab(t.key)}
                className={`flex flex-col items-center gap-1 py-1 px-2 ${active?'text-brass':'text-stone'}`}>
                <t.Icon size={22} stroke={active?2.2:1.7}/>
                <span className={`text-[11px] ${active?'font-bold':'font-medium'}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function DriverHome({ driver }) {
  const { appts, now, setDriverStatus, setTripStatus } = useApp();
  const myTrips = appts.filter(a => a.driverId === driver.id).sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
  const current = myTrips.find(a => a.status==='onway' || a.status==='arrived') 
                || myTrips.find(a => (a.status==='confirmed'||a.status==='awaiting') && new Date(a.endISO) > now);
  const upcoming = myTrips.filter(a => new Date(a.startISO) > now && a.id !== (current&&current.id));
  const done = myTrips.filter(a => a.status==='completed').length;
  const hour = now.getHours();
  const greet = hour<12 ? 'صباح الخير' : hour<17 ? 'مساء الخير' : 'مساء الخير';
  const ds = DRIVER_STATUS[driver.status];

  return (
    <div className="px-4 pt-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={driver.name} size={44}/>
          <div>
            <div className="text-xs text-stone leading-tight">{greet}</div>
            <div className="text-[15px] font-bold text-ink leading-tight">{driver.name.split(' ').slice(0,2).join(' ')}</div>
          </div>
        </div>
        <button onClick={()=>{
          const next = driver.status==='available'?'busy':driver.status==='busy'?'off':'available';
          setDriverStatus(driver.id, next);
        }} className={`px-3 py-2 rounded-chip flex items-center gap-2 ${toneBg(ds.tone)} ${toneFg(ds.tone)}`}>
          <StatusDot tone={ds.tone} pulse={driver.status==='available'}/>
          <span className="text-xs font-bold">{ds.label}</span>
        </button>
      </header>
      <div className="text-sm text-stone">{fmtDate(now)}</div>

      {/* Current or next task big card */}
      {current ? <DriverTaskHero appt={current} now={now} onStatus={(s)=>setTripStatus(current.id, s, driver.id)}/>
              : <Card className="text-center py-8">
                  <I.Check className="mx-auto text-sage" size={32}/>
                  <div className="text-sm font-bold text-ink mt-2">لا مهام حالية</div>
                  <div className="text-xs text-stone mt-1">استمتع باستراحتك</div>
                </Card>}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Stat n={upcoming.length}                                              label="مهام قادمة" tone="brass"/>
        <Stat n={myTrips.filter(a=>sameDay(new Date(a.startISO), now)).length} label="اليوم"       tone="ink"/>
        <Stat n={done}                                                          label="مكتمل"      tone="sage"/>
      </div>

      {/* Upcoming */}
      <Section title="المهام القادمة">
        {upcoming.length===0 ? <Card className="text-center py-6"><div className="text-xs text-stone">لا مهام قادمة</div></Card>
          : <div className="space-y-2">
              {upcoming.slice(0,4).map(a => <DriverTaskRow key={a.id} appt={a}/>)}
            </div>}
      </Section>
    </div>
  );
}

function DriverTaskHero({ appt, now, onStatus }) {
  const st = TRIP_STATUS[appt.status];
  const [declineOpen, setDeclineOpen] = React.useState(false);
  const rel = relativeTime(appt.startISO, now);

  const actionButtons = () => {
    if (appt.status === 'awaiting' || appt.status === 'pending') {
      return (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Btn variant="ghost" onClick={()=>setDeclineOpen(true)}><I.X size={16}/> اعتذار</Btn>
          <Btn variant="sage" onClick={()=>onStatus('confirmed')}><I.Check size={16}/> قبول المشوار</Btn>
        </div>
      );
    }
    if (appt.status === 'confirmed') return <Btn variant="primary" className="w-full mt-4" onClick={()=>onStatus('onway')}><I.Route size={16}/> بدء الرحلة</Btn>;
    if (appt.status === 'onway')     return <Btn variant="brass"   className="w-full mt-4" onClick={()=>onStatus('arrived')}><I.Pin size={16}/> وصلت الموقع</Btn>;
    if (appt.status === 'arrived')   return <Btn variant="sage"    className="w-full mt-4" onClick={()=>onStatus('completed')}><I.Check size={16}/> إنهاء المهمة</Btn>;
    return null;
  };

  return (
    <>
      <div className="rounded-hero bg-ink text-parchment overflow-hidden shadow-pop">
        <div className="p-5 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brass" style={{
            background: `linear-gradient(to left, var(--tw-color-brass) ${
              appt.status==='confirmed'?25:appt.status==='onway'?50:appt.status==='arrived'?75:appt.status==='completed'?100:10}%, rgba(255,255,255,0.08) 0%)`}}></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-wider text-brassLite uppercase">
              {appt.status==='awaiting'?'مهمة جديدة':appt.status==='confirmed'?'مؤكد':appt.status==='onway'?'أنت في الطريق':appt.status==='arrived'?'وصلت':'المهمة'}
            </span>
            <Badge tone={st.tone==='ink'?'brass':st.tone} dot size="sm">{st.label}</Badge>
          </div>
          <div className="text-3xl serif num text-parchment leading-none">
            {fmtTimeShortFromISO(appt.startISO)}
            <span className="text-base mr-2 text-brassLite">{new Date(appt.startISO).getHours()>=12?'م':'ص'}</span>
            <span className="text-xs font-normal text-parchment/60 mr-3">{rel}</span>
          </div>
          <div className="mt-3 text-base font-bold leading-tight">{appt.title}</div>
          <div className="mt-2 space-y-1.5">
            <div className="text-[13px] text-parchment/85 flex items-center gap-1.5"><I.Pin size={13}/> {appt.location}</div>
            <div className="text-[13px] text-parchment/85 flex items-center gap-1.5"><I.User size={13}/> الحبيب حامد بن عمر</div>
            {appt.notes && <div className="text-[12px] text-parchment/70 flex items-start gap-1.5 mt-2"><I.List size={12} className="mt-0.5"/> {appt.notes}</div>}
          </div>
          {actionButtons()}
        </div>
      </div>
      {declineOpen && <DeclineModal onClose={()=>setDeclineOpen(false)} onConfirm={(r)=>{onStatus('declined'); setDeclineOpen(false);}}/>}
    </>
  );
}

function DriverTaskRow({ appt }) {
  const st = TRIP_STATUS[appt.status];
  return (
    <Card className="!p-3 flex items-center gap-3">
      <div className="w-11 text-center">
        <div className="text-sm font-bold text-ink num">{fmtTimeShortFromISO(appt.startISO)}</div>
        <div className="text-[10px] text-stone">{new Date(appt.startISO).getHours()>=12?'م':'ص'}</div>
      </div>
      <div className="w-px h-9 bg-line"></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink truncate">{appt.title}</div>
        <div className="text-[11px] text-stone truncate mt-0.5">{appt.location.split(' — ')[0]}</div>
      </div>
      <Badge tone={st.tone} dot size="sm">{st.label}</Badge>
    </Card>
  );
}

function DriverTasks({ driver }) {
  const { appts, setTripStatus } = useApp();
  const [filter, setFilter] = React.useState('all');
  const mine = appts.filter(a => a.driverId === driver.id).sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
  const filtered = filter==='all' ? mine
    : filter==='active' ? mine.filter(a => ['awaiting','confirmed','onway','arrived','pending'].includes(a.status))
    : filter==='done' ? mine.filter(a => a.status==='completed')
    : mine;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold text-ink serif">مهامي</h2>
      <div className="inline-flex bg-paper hairline rounded-chip p-0.5 w-full">
        {[['all','الكل'],['active','نشطة'],['done','مكتملة']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} className={`flex-1 text-xs font-medium py-1.5 rounded-[5px] ${filter===k?'bg-ink text-parchment':'text-stone'}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length===0 && <Card className="text-center py-8 text-sm text-stone">لا مهام</Card>}
        {filtered.map(a => <DriverTaskRow key={a.id} appt={a}/>)}
      </div>
    </div>
  );
}

function DriverCalendar({ driver }) {
  const { appts, now } = useApp();
  const mine = appts.filter(a => a.driverId === driver.id);
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold text-ink serif">جدولي</h2>
      <WeekView appts={mine} start={startOfDay(now)} onOpen={()=>{}}/>
    </div>
  );
}

function DriverNotifs({ driver }) {
  const { notifs, markAllRead } = useApp();
  const mine = notifs.filter(n => n.targetRole === 'driver' && n.targetId === driver.id);
  React.useEffect(() => { markAllRead('driver', driver.id); }, [driver.id]);
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-bold text-ink serif">الإشعارات</h2>
      <div className="space-y-2">
        {mine.length===0 && <Card className="text-center py-8 text-sm text-stone">لا إشعارات</Card>}
        {mine.map(n => <NotifRow key={n.id} n={n}/>)}
      </div>
    </div>
  );
}

function DriverAccount({ driver }) {
  const { appts, setDriverStatus } = useApp();
  const done = appts.filter(a => a.driverId === driver.id && a.status==='completed').length;
  const ds = DRIVER_STATUS[driver.status];
  return (
    <div className="p-4 space-y-3">
      <Card className="text-center">
        <Avatar name={driver.name} size={72} ring/>
        <div className="text-lg font-bold text-ink mt-3">{driver.name}</div>
        <div className="text-xs text-stone mt-0.5 flex items-center justify-center gap-1"><I.Phone size={11}/> {driver.phone}</div>
        <Badge tone={ds.tone} dot size="md" className="mt-2">{ds.label}</Badge>
      </Card>

      <Card>
        <div className="text-xs font-bold text-stone mb-2">حالة التوفر</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.values(DRIVER_STATUS).map(s => (
            <button key={s.key} onClick={()=>setDriverStatus(driver.id, s.key)}
              className={`p-2.5 rounded-chip text-xs font-medium ${driver.status===s.key?`${toneBg(s.tone)} ${toneFg(s.tone)} ring-2 ring-brass`:'bg-parchment hairline text-stone'}`}>
              <StatusDot tone={s.tone}/> <span className="mr-1">{s.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Stat n={appts.filter(a=>a.driverId===driver.id).length} label="إجمالي" tone="ink"/>
        <Stat n={done} label="مكتملة" tone="sage"/>
      </div>
    </div>
  );
}

function DeclineModal({ onClose, onConfirm }) {
  const [r, setR] = React.useState('');
  const reasons = ['غير متاح الآن', 'لدي مهمة أخرى', 'مشكلة في السيارة', 'سبب آخر'];
  return (
    <Modal open onClose={onClose} title="الاعتذار عن المشوار" size="sm">
      <div className="space-y-3">
        <div className="text-sm text-stone">يرجى اختيار سبب الاعتذار:</div>
        <div className="space-y-1.5">
          {reasons.map(x => (
            <button key={x} onClick={()=>setR(x)} className={`w-full text-right p-2.5 rounded-chip hairline text-sm ${r===x?'bg-clayLite text-clay ring-2 ring-clay':'bg-parchment text-ink'}`}>{x}</button>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Btn variant="ghost" className="flex-1" onClick={onClose}>إلغاء</Btn>
          <Btn variant="clay" className="flex-1" disabled={!r} onClick={()=>onConfirm(r)}>إرسال الاعتذار</Btn>
        </div>
      </div>
    </Modal>
  );
}
/* ==========================================================================
   ADMIN DASHBOARD — full-width, sidebar layout
   ========================================================================== */
function AdminApp() {
  const [nav, setNav] = React.useState('overview');
  const [detailId, setDetailId] = React.useState(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const items = [
    { key:'overview',    label:'نظرة عامة',    Icon:I.Grid },
    { key:'dispatch',    label:'لوحة التوزيع', Icon:I.Layers },
    { key:'appts',       label:'المواعيد',     Icon:I.Cal },
    { key:'drivers',     label:'السائقون',     Icon:I.Car },
    { key:'users',       label:'المستخدمون',   Icon:I.Users },
    { key:'log',         label:'سجل النشاط',   Icon:I.Activity },
    { key:'reports',     label:'التقارير',     Icon:I.Report },
    { key:'settings',    label:'الإعدادات',    Icon:I.Settings },
  ];
  const currentItem = items.find(i => i.key === nav) || items[0];

  return (
    <div className="w-full bg-parchment flex flex-col rounded-hero hairline overflow-hidden shadow-pop" style={{maxWidth:'1400px', minHeight:'600px'}}>
      <AdminTopbar/>

      {/* Mobile: horizontal scrollable tabs */}
      <div className="lg:hidden hairline-b bg-paper overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {items.map(it => (
            <button key={it.key} onClick={()=>setNav(it.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-chip transition-colors ${nav===it.key?'bg-ink text-parchment':'text-stone hover:bg-line2'}`}>
              <it.Icon size={14} stroke={nav===it.key?2:1.7}/> {it.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden lg:flex w-56 shrink-0 bg-paper hairline-l flex-col py-3">
          <nav className="flex-1">
            {items.map(it => (
              <button key={it.key} onClick={()=>setNav(it.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${nav===it.key?'bg-parchment text-ink border-r-2 border-brass':'text-stone hover:bg-line2/50'}`}>
                <it.Icon size={17} stroke={nav===it.key?2:1.7}/> {it.label}
              </button>
            ))}
          </nav>
          <div className="px-3 pt-3 hairline-t">
            <div className="text-[10px] text-stone2 leading-relaxed">
              الإصدار 1.0 — MVP<br/>
              تريم، حضرموت · Asia/Aden
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-3 lg:p-6 min-w-0" style={{background:'#F5EFDF'}}>
          {/* Mobile page title */}
          <div className="lg:hidden mb-3 flex items-center gap-2">
            <currentItem.Icon size={18} stroke={2} className="text-brass"/>
            <h2 className="text-base font-bold text-ink">{currentItem.label}</h2>
          </div>

          {nav==='overview' && <AdminOverview onOpen={setDetailId}/>}
          {nav==='dispatch' && <AdminDispatch onOpen={setDetailId}/>}
          {nav==='appts'    && <AdminAppointments onOpen={setDetailId}/>}
          {nav==='drivers'  && <AdminDrivers/>}
          {nav==='users'    && <AdminUsers/>}
          {nav==='log'      && <AdminLog/>}
          {nav==='reports'  && <AdminReports/>}
          {nav==='settings' && <AdminSettings/>}
        </main>
      </div>
      {detailId && <AppointmentDetail id={detailId} onClose={()=>setDetailId(null)}/>}
    </div>
  );
}

function AdminTopbar() {
  const { users, notifs } = useApp();
  const admin = users.find(u => u.role==='admin');
  const unread = notifs.filter(n => !n.read).length;
  return (
    <header className="h-14 bg-ink text-parchment px-5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-brass"><img src={LOGO} alt="" className="w-full h-full object-cover"/></div>
        <div>
          <div className="text-sm font-bold serif leading-tight">مواعيد حامد بن عمر</div>
          <div className="text-[10px] text-parchment/60 leading-tight">لوحة الإدارة</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="text-parchment/80"><I.Bell size={19}/></div>
          {unread>0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brass text-white text-[9px] font-bold flex items-center justify-center">{unread}</span>}
        </div>
        <div className="w-px h-6 bg-white/10"></div>
        <div className="flex items-center gap-2">
          <Avatar name={admin.name} size={28}/>
          <div>
            <div className="text-xs font-bold">{admin.name}</div>
            <div className="text-[10px] text-parchment/60">مدير</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminOverview({ onOpen }) {
  const { appts, drivers, now, log } = useApp();
  const today = startOfDay(now);
  const todaysA = appts.filter(a => sameDay(new Date(a.startISO), today));
  const upcomingTrips = appts.filter(a => a.needsDriver && new Date(a.startISO) > now && !['cancelled','completed'].includes(a.status));
  const activeD = drivers.filter(d => d.status==='available' || d.status==='busy').length;
  const pending = appts.filter(a => a.needsDriver && !a.driverId).length;
  const urgent  = appts.filter(a => (a.priority==='urgent' || a.type==='urgent') && new Date(a.endISO) > now).length;
  const conflicts = detectConflicts(appts);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink serif">نظرة عامة</h1>
        <div className="text-sm text-stone mt-1">{fmtDate(now)}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <BigStat label="مواعيد اليوم"    n={todaysA.length}         tone="ink"/>
        <BigStat label="مشاوير قادمة"   n={upcomingTrips.length}    tone="brass"/>
        <BigStat label="سائقون فعّالون" n={activeD}                  tone="sage"/>
        <BigStat label="بحاجة تعيين"    n={pending}                 tone="clay"    highlight={pending>0}/>
        <BigStat label="مواعيد عاجلة"   n={urgent}                  tone="clay"/>
        <BigStat label="تعارضات"        n={conflicts.length}         tone="clay"    highlight={conflicts.length>0}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <Card pad={false}>
            <div className="px-5 py-4 hairline-b flex items-center justify-between">
              <h3 className="text-base font-bold text-ink">العمليات الحيّة</h3>
              <div className="flex items-center gap-1.5 text-xs text-sage font-bold"><StatusDot tone="sage" pulse/> مباشر</div>
            </div>
            <div className="divide-hair">
              {drivers.map(d => <LiveDriverRow key={d.id} driver={d}/>)}
            </div>
          </Card>

          <Card pad={false}>
            <div className="px-5 py-4 hairline-b">
              <h3 className="text-base font-bold text-ink">مواعيد اليوم</h3>
            </div>
            <div className="divide-hair">
              {todaysA.length===0 && <div className="p-6 text-center text-sm text-stone">لا مواعيد اليوم</div>}
              {todaysA.sort((a,b)=>new Date(a.startISO)-new Date(b.startISO)).map(a => (
                <AdminApptRow key={a.id} appt={a} onOpen={()=>onOpen(a.id)}/>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {conflicts.length>0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-chip bg-clayLite text-clay flex items-center justify-center"><I.Warn size={17}/></div>
                <h3 className="text-sm font-bold text-clay">تعارضات مكتشفة</h3>
              </div>
              <div className="space-y-2">
                {conflicts.slice(0,3).map(([a,b], i)=>(
                  <div key={i} className="text-xs text-ink bg-clayLite/50 rounded-chip p-2.5">
                    <div className="font-bold">تعارض عند {a.driverId ? (drivers.find(d=>d.id===a.driverId)?.name?.split(' ')[0] || '—') : '—'}</div>
                    <div className="text-stone mt-1">{a.title} · {fmtTimeShortFromISO(a.startISO)}</div>
                    <div className="text-stone">{b.title} · {fmtTimeShortFromISO(b.startISO)}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card pad={false}>
            <div className="px-4 py-3 hairline-b flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">آخر النشاطات</h3>
            </div>
            <div className="divide-hair max-h-[380px] overflow-y-auto">
              {log.slice(0, 12).map(l => (
                <div key={l.id} className="px-4 py-3">
                  <div className="text-[13px] text-ink leading-snug">{l.label}</div>
                  <div className="text-[10px] text-stone mt-0.5">{fmtDateAndTime(l.ts)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, n, tone='ink', highlight=false }) {
  return (
    <div className={`bg-paper hairline rounded-card p-4 ${highlight?'ring-2 ring-clay/40':''}`}>
      <div className="text-[11px] font-medium text-stone">{label}</div>
      <div className={`text-3xl font-bold serif num mt-1 ${toneFg(tone)}`}>{n}</div>
    </div>
  );
}

function LiveDriverRow({ driver }) {
  const { appts, now, driverName } = useApp();
  const current = appts.find(a => a.driverId===driver.id && ['onway','arrived'].includes(a.status));
  const next    = appts.filter(a => a.driverId===driver.id && new Date(a.startISO) > now && ['awaiting','confirmed'].includes(a.status))
                       .sort((a,b)=>new Date(a.startISO)-new Date(b.startISO))[0];
  const ds = DRIVER_STATUS[driver.status];
  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <Avatar name={driver.name} size={40}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-ink">{driver.name}</div>
          <Badge tone={ds.tone} dot size="sm">{ds.label}</Badge>
        </div>
        <div className="text-xs text-stone mt-0.5">
          {current ? (
            <span className="text-indigo">
              <StatusDot tone="indigo" pulse/> جارٍ الآن: {current.title} — {current.location.split(' — ')[0]}
            </span>
          ) : next ? (
            <span>قادم: {next.title} — {fmtTimeShortFromISO(next.startISO)}</span>
          ) : <span className="text-stone2">لا مهام حالية</span>}
        </div>
      </div>
      <div className="text-left text-xs text-stone">
        <div>{appts.filter(a=>a.driverId===driver.id).length} مهام</div>
        <div className="text-sage">{appts.filter(a=>a.driverId===driver.id && a.status==='completed').length} مكتمل</div>
      </div>
    </div>
  );
}

function AdminApptRow({ appt, onOpen }) {
  const { driverName, flashId } = useApp();
  const t = typeInfo(appt.type);
  const st = TRIP_STATUS[appt.status];
  const flashed = flashId===appt.id;
  return (
    <button onClick={onOpen} className={`w-full text-right px-5 py-3 hover:bg-parchment/60 flex items-center gap-4 transition-colors ${flashed?'bg-brass/10':''}`}>
      <div className="w-14 text-center shrink-0">
        <div className="text-sm font-bold num text-ink">{fmtTimeShortFromISO(appt.startISO)}</div>
        <div className="text-[10px] text-stone">{new Date(appt.startISO).getHours()>=12?'م':'ص'}</div>
      </div>
      <div className="w-1 h-9 rounded-full" style={{background:`${toneDotBg(t.tone)}`}}></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink truncate">{appt.title}</div>
        <div className="text-[11px] text-stone truncate mt-0.5"><I.Pin size={10} className="inline"/> {appt.location}</div>
      </div>
      <TypeChip type={appt.type}/>
      {appt.needsDriver && (
        <div className="min-w-[140px] text-xs">
          <div className="flex items-center gap-1.5">
            {appt.driverId ? <><I.Car size={12}/> <span className="text-ink">{driverName(appt.driverId).split(' ')[0]}</span></>
                          : <span className="text-clay flex items-center gap-1"><I.Warn size={12}/> بدون سائق</span>}
          </div>
          <Badge tone={st.tone} dot size="sm">{st.label}</Badge>
        </div>
      )}
    </button>
  );
}
function toneDotBg(t) {
  return ({sage:'#6F8067',brass:'#A87E4A',indigo:'#3A4B8C',clay:'#B34A3B',stone:'#9C978D',ink:'#14192B'})[t]||'#9C978D';
}

/* ---------- DISPATCH BOARD ---------- */
function AdminDispatch({ onOpen }) {
  const { appts, drivers, now, assignDriver } = useApp();
  const active = appts.filter(a => a.needsDriver && !['cancelled','completed'].includes(a.status))
                      .sort((a,b)=>new Date(a.startISO)-new Date(b.startISO));
  const unassigned = active.filter(a => !a.driverId);
  const byDriver = Object.fromEntries(drivers.map(d => [d.id, active.filter(a => a.driverId === d.id)]));
  const completed = appts.filter(a => a.status==='completed').slice(0,6);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink serif">لوحة التوزيع</h1>
          <div className="text-sm text-stone mt-1">عرض كل المشاوير حسب السائق — يمكن التعيين المباشر</div>
        </div>
        <Btn variant="ghost"><I.Refresh size={15}/> تحديث</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unassigned column */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-clay pulse"></div>
              <h3 className="text-sm font-bold text-ink">بدون تعيين</h3>
              <Badge tone="clay" size="sm">{unassigned.length}</Badge>
            </div>
          </div>
          <div className="space-y-2 min-h-[300px] bg-clayLite/30 rounded-card p-2 hairline">
            {unassigned.length===0 && <div className="text-center text-xs text-stone py-6">جميع المشاوير معيّنة ✓</div>}
            {unassigned.map(a => (
              <DispatchCard key={a.id} appt={a} onOpen={()=>onOpen(a.id)} showAssign={true} drivers={drivers} onAssign={(did)=>assignDriver(a.id, did)}/>
            ))}
          </div>
        </div>

        {/* Driver columns */}
        {drivers.map(d => {
          const ds = DRIVER_STATUS[d.status];
          return (
            <div key={d.id}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={d.name} size={26}/>
                  <h3 className="text-sm font-bold text-ink truncate">{d.name.split(' ').slice(0,2).join(' ')}</h3>
                </div>
                <Badge tone={ds.tone} dot size="sm">{ds.label}</Badge>
              </div>
              <div className="space-y-2 min-h-[300px] bg-paper/60 rounded-card p-2 hairline">
                {byDriver[d.id].length===0 && <div className="text-center text-xs text-stone py-6">لا مشاوير معيّنة</div>}
                {byDriver[d.id].map(a => (
                  <DispatchCard key={a.id} appt={a} onOpen={()=>onOpen(a.id)}/>
                ))}
              </div>
            </div>
          );
        })}

        {/* Completed column */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <I.Check className="text-sage" size={14}/>
              <h3 className="text-sm font-bold text-ink">مكتمل مؤخراً</h3>
            </div>
          </div>
          <div className="space-y-2 min-h-[300px] bg-sageLite/30 rounded-card p-2 hairline">
            {completed.map(a => <DispatchCard key={a.id} appt={a} onOpen={()=>onOpen(a.id)}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DispatchCard({ appt, onOpen, showAssign=false, drivers=[], onAssign }) {
  const { flashId, driverName } = useApp();
  const st = TRIP_STATUS[appt.status];
  const t = typeInfo(appt.type);
  const flashed = flashId===appt.id;
  return (
    <div className={`bg-paper rounded-chip p-3 hairline transition-all ${flashed?'ring-2 ring-brass':''}`}>
      <button onClick={onOpen} className="w-full text-right">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] font-bold text-stone num">{fmtDateShort(new Date(appt.startISO))} · {fmtTimeShortFromISO(appt.startISO)}</div>
          <TypeChip type={appt.type}/>
        </div>
        <div className="text-sm font-bold text-ink truncate">{appt.title}</div>
        <div className="text-[11px] text-stone mt-0.5 flex items-center gap-1"><I.Pin size={10}/> {appt.location.split(' — ')[0]}</div>
        <div className="mt-2"><Badge tone={st.tone} dot size="sm">{st.label}</Badge></div>
      </button>
      {showAssign && (
        <div className="mt-2 pt-2 hairline-t flex gap-1.5">
          {drivers.map(d => (
            <button key={d.id} onClick={()=>onAssign(d.id)}
              className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-chip bg-brass/10 text-brass hover:bg-brass hover:text-white transition-colors">
              تعيين {d.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- APPOINTMENTS TABLE ---------- */
function AdminAppointments({ onOpen }) {
  const { appts, driverName } = useApp();
  const [q, setQ] = React.useState('');
  const [statusF, setStatusF] = React.useState('all');
  const filtered = appts
    .filter(a => !q || a.title.includes(q) || a.location.includes(q))
    .filter(a => statusF==='all' || a.status===statusF)
    .sort((a,b)=>new Date(b.startISO)-new Date(a.startISO));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink serif">جميع المواعيد</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <I.Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone2"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="بحث..." className="bg-paper hairline rounded-chip pr-9 pl-3 py-2 text-sm w-56"/>
          </div>
          <select value={statusF} onChange={e=>setStatusF(e.target.value)} className="bg-paper hairline rounded-chip px-3 py-2 text-sm">
            <option value="all">كل الحالات</option>
            {Object.values(TRIP_STATUS).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <Card pad={false}>
        <table className="w-full">
          <thead className="bg-parchment/60 text-xs text-stone">
            <tr>
              <th className="text-right px-4 py-3 font-bold">التاريخ والوقت</th>
              <th className="text-right px-4 py-3 font-bold">العنوان</th>
              <th className="text-right px-4 py-3 font-bold">النوع</th>
              <th className="text-right px-4 py-3 font-bold">الموقع</th>
              <th className="text-right px-4 py-3 font-bold">السائق</th>
              <th className="text-right px-4 py-3 font-bold">الحالة</th>
              <th className="text-right px-4 py-3 font-bold"></th>
            </tr>
          </thead>
          <tbody className="divide-hair">
            {filtered.map(a => {
              const st = TRIP_STATUS[a.status];
              return (
                <tr key={a.id} className="hover:bg-parchment/40 cursor-pointer" onClick={()=>onOpen(a.id)}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-ink num">{fmtDateShort(new Date(a.startISO))}</div>
                    <div className="text-[11px] text-stone num">{fmtTimeShortFromISO(a.startISO)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-ink">{a.title}</td>
                  <td className="px-4 py-3"><TypeChip type={a.type}/></td>
                  <td className="px-4 py-3 text-xs text-stone">{a.location}</td>
                  <td className="px-4 py-3 text-xs text-ink">{a.driverId?driverName(a.driverId):'—'}</td>
                  <td className="px-4 py-3"><Badge tone={st.tone} dot size="sm">{st.label}</Badge></td>
                  <td className="px-4 py-3 text-stone2"><I.ChevronR size={14}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- DRIVERS ---------- */
function AdminDrivers() {
  const { drivers, appts, setDriverStatus } = useApp();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink serif">إدارة السائقين</h1>
        <Btn><I.Plus size={15}/> إضافة سائق</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drivers.map(d => {
          const ds = DRIVER_STATUS[d.status];
          const dTrips = appts.filter(a => a.driverId === d.id);
          const completed = dTrips.filter(t => t.status==='completed').length;
          const rate = dTrips.length ? Math.round((completed / dTrips.length) * 100) : 0;
          return (
            <Card key={d.id}>
              <div className="flex items-start gap-4">
                <Avatar name={d.name} size={64}/>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-base font-bold text-ink">{d.name}</div>
                    <Badge tone={ds.tone} dot size="sm">{ds.label}</Badge>
                  </div>
                  <div className="text-xs text-stone mt-0.5"><I.Phone size={11} className="inline"/> {d.phone}</div>
                  <div className="text-[11px] text-stone2 mt-0.5">انضم {d.joined}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="bg-parchment rounded-chip p-2"><div className="text-lg font-bold num text-ink">{dTrips.length}</div><div className="text-[10px] text-stone">إجمالي</div></div>
                <div className="bg-parchment rounded-chip p-2"><div className="text-lg font-bold num text-sage">{completed}</div><div className="text-[10px] text-stone">مكتمل</div></div>
                <div className="bg-parchment rounded-chip p-2"><div className="text-lg font-bold num text-clay">{dTrips.filter(t=>t.status==='declined'||t.status==='cancelled').length}</div><div className="text-[10px] text-stone">ملغى</div></div>
                <div className="bg-parchment rounded-chip p-2"><div className="text-lg font-bold num text-brass">{rate}%</div><div className="text-[10px] text-stone">الإنجاز</div></div>
              </div>
              <div className="mt-4 pt-4 hairline-t flex items-center justify-between">
                <div className="flex gap-1">
                  {Object.values(DRIVER_STATUS).map(s => (
                    <button key={s.key} onClick={()=>setDriverStatus(d.id, s.key)}
                      className={`text-[11px] px-2 py-1 rounded-chip ${d.status===s.key?`${toneBg(s.tone)} ${toneFg(s.tone)} font-bold`:'text-stone hover:bg-line2'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <Btn size="sm" variant="ghost"><I.Edit size={13}/> تعديل</Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- USERS ---------- */
function AdminUsers() {
  const { users } = useApp();
  const roles = { owner:'صاحب الحساب', assistant:'مساعد', admin:'مدير', viewer:'مشاهد' };
  const tones = { owner:'brass', assistant:'indigo', admin:'ink', viewer:'stone' };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink serif">المستخدمون</h1>
        <Btn><I.Plus size={15}/> إضافة مستخدم</Btn>
      </div>
      <Card pad={false}>
        <table className="w-full">
          <thead className="bg-parchment/60 text-xs text-stone">
            <tr>
              <th className="text-right px-4 py-3 font-bold">المستخدم</th>
              <th className="text-right px-4 py-3 font-bold">الدور</th>
              <th className="text-right px-4 py-3 font-bold">الهاتف</th>
              <th className="text-right px-4 py-3 font-bold">الحالة</th>
              <th className="text-right px-4 py-3 font-bold"></th>
            </tr>
          </thead>
          <tbody className="divide-hair">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size={36}/>
                    <div className="text-sm font-bold text-ink">{u.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge tone={tones[u.role]} size="sm">{roles[u.role]}</Badge></td>
                <td className="px-4 py-3 text-xs text-stone">{u.phone}</td>
                <td className="px-4 py-3"><Badge tone="sage" dot size="sm">نشط</Badge></td>
                <td className="px-4 py-3"><Btn size="sm" variant="ghost"><I.Dots size={15}/></Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-ink mb-3">الصلاحيات (RBAC)</h3>
        <table className="w-full text-xs">
          <thead className="text-stone">
            <tr>
              <th className="text-right py-2 font-bold">الصلاحية</th>
              <th className="py-2 font-bold text-center">صاحب الحساب</th>
              <th className="py-2 font-bold text-center">مساعد</th>
              <th className="py-2 font-bold text-center">مدير</th>
              <th className="py-2 font-bold text-center">سائق</th>
            </tr>
          </thead>
          <tbody className="divide-hair">
            {[
              ['إنشاء موعد', 1,1,1,0],
              ['تعديل موعد', 1,1,1,0],
              ['حذف موعد', 1,0,1,0],
              ['تعيين سائق', 1,1,1,0],
              ['إدارة المستخدمين', 1,0,1,0],
              ['قبول/رفض المشاوير', 0,0,0,1],
              ['تحديث حالة المشوار', 0,0,0,1],
              ['عرض التقارير', 1,0,1,0],
              ['تعديل الإعدادات', 1,0,1,0],
            ].map((row,i)=>(
              <tr key={i}>
                <td className="py-2 text-ink font-medium">{row[0]}</td>
                {[1,2,3,4].map(j => (
                  <td key={j} className="py-2 text-center">
                    {row[j]?<I.Check className="inline text-sage" size={14} stroke={2.5}/>:<span className="text-stone2">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- ACTIVITY LOG ---------- */
function AdminLog() {
  const { log, userName } = useApp();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink serif">سجل النشاط</h1>
      <Card pad={false}>
        <div className="divide-hair">
          {log.map(l => (
            <div key={l.id} className="px-5 py-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-line2 flex items-center justify-center shrink-0"><I.Activity size={14}/></div>
              <div className="flex-1">
                <div className="text-sm text-ink">{l.label}</div>
                <div className="text-xs text-stone mt-1 flex items-center gap-2">
                  <span>{l.actorName || '—'}</span>
                  <span className="text-stone2">·</span>
                  <span>{fmtDateAndTime(l.ts)}</span>
                  <span className="text-stone2">·</span>
                  <span className="text-brass font-mono text-[10px]">{l.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------- REPORTS ---------- */
function AdminReports() {
  const { appts, drivers, now } = useApp();
  const totalA = appts.length;
  const compA = appts.filter(a => a.status==='completed').length;
  const cancA = appts.filter(a => a.status==='cancelled'||a.status==='declined').length;
  const urg   = appts.filter(a => a.priority==='urgent' || a.type==='urgent').length;
  const trips = appts.filter(a => a.needsDriver);
  const byType = Object.keys(APPT_TYPES).map(k => ({
    key:k, label:APPT_TYPES[k].label, tone:APPT_TYPES[k].tone,
    n:appts.filter(a=>a.type===k).length
  }));
  const maxT = Math.max(...byType.map(x=>x.n), 1);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink serif">التقارير</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BigStat label="إجمالي المواعيد"    n={totalA} tone="ink"/>
        <BigStat label="مواعيد مكتملة"     n={compA}  tone="sage"/>
        <BigStat label="ملغاة/مرفوضة"      n={cancA}  tone="clay"/>
        <BigStat label="مواعيد عاجلة"      n={urg}    tone="brass"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <h3 className="text-sm font-bold text-ink mb-4">المواعيد حسب النوع</h3>
          <div className="space-y-3">
            {byType.map(t => (
              <div key={t.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink">{t.label}</span>
                  <span className="text-stone num font-bold">{t.n}</span>
                </div>
                <div className="h-2 bg-line2 rounded-full overflow-hidden">
                  <div className={`h-full ${toneDot(t.tone)} rounded-full`} style={{width:`${(t.n/maxT)*100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-ink mb-4">أداء السائقين</h3>
          <div className="space-y-4">
            {drivers.map(d => {
              const t = trips.filter(a => a.driverId===d.id);
              const done = t.filter(x => x.status==='completed').length;
              const rate = t.length ? Math.round((done/t.length)*100) : 0;
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <Avatar name={d.name} size={36}/>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink truncate">{d.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-line2 rounded-full overflow-hidden">
                        <div className="h-full bg-sage rounded-full" style={{width:`${rate}%`}}></div>
                      </div>
                      <span className="text-xs num font-bold text-ink">{rate}%</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold num text-ink">{done}<span className="text-stone2">/{t.length}</span></div>
                    <div className="text-[10px] text-stone">مكتمل</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-bold text-ink mb-4">توزيع الأولوية</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(PRIORITIES).map(p => {
            const n = appts.filter(a=>a.priority===p.key).length;
            return (
              <div key={p.key} className="bg-parchment rounded-chip p-3 text-center">
                <div className={`text-2xl font-bold num ${toneFg(p.tone)}`}>{n}</div>
                <div className="text-xs text-stone mt-1">{p.label}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------- SETTINGS ---------- */
function AdminSettings() {
  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-bold text-ink serif">الإعدادات</h1>

      <Card>
        <h3 className="text-sm font-bold text-ink mb-4">النظام</h3>
        <div className="space-y-3">
          <SettingsRow label="اسم النظام" value="مواعيد حامد بن عمر"/>
          <SettingsRow label="الشعار" value={<div className="w-10 h-10 rounded-full overflow-hidden hairline"><img src={LOGO} className="w-full h-full object-cover"/></div>}/>
          <SettingsRow label="المدينة الافتراضية" value="تريم، حضرموت، اليمن"/>
          <SettingsRow label="المنطقة الزمنية" value="Asia/Aden (UTC+3)"/>
          <SettingsRow label="اللغة" value="العربية · RTL"/>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-ink mb-4">التذكيرات والإشعارات</h3>
        <div className="space-y-3">
          <SettingsRow label="تذكير قبل يوم" value={<Toggle on/>}/>
          <SettingsRow label="تذكير قبل ساعتين" value={<Toggle on/>}/>
          <SettingsRow label="تذكير قبل ٣٠ دقيقة" value={<Toggle on/>}/>
          <SettingsRow label="تذكير قبل ١٥ دقيقة" value={<Toggle/>}/>
          <SettingsRow label="إشعارات الواتساب" value={<Toggle on/>}/>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-ink mb-4">الأمان</h3>
        <div className="space-y-3">
          <SettingsRow label="تسجيل العمليات الحساسة" value={<Toggle on/>}/>
          <SettingsRow label="مصادقة ثنائية للإدارة" value={<Toggle/>}/>
          <SettingsRow label="جلسات صالحة لـ" value="٣٠ يوم"/>
        </div>
      </Card>
    </div>
  );
}
function SettingsRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-ink">{label}</span>
      <span className="text-sm text-stone">{value}</span>
    </div>
  );
}
function Toggle({ on=false }) {
  const [v, setV] = React.useState(on);
  return (
    <button onClick={()=>setV(!v)} className={`w-10 h-6 rounded-full p-0.5 transition-colors ${v?'bg-sage':'bg-line'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${v?'-translate-x-4':''}`}></div>
    </button>
  );
}

/* ==========================================================================
   Role Switcher + Top-level App
   ========================================================================== */
function ConnectionStatus() {
  const { connected, loading, error } = useApp();
  if (loading) return <span className="text-xs text-parchment/60">جاري التحميل...</span>;
  if (error) return <span className="text-xs text-clay bg-clayLite px-2 py-1 rounded-chip">{error}</span>;
  return (
    <span className="text-xs text-parchment/60 flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-sage' : 'bg-clay'} ${connected ? 'pulse' : ''}`} />
      {connected ? 'متصل' : 'غير متصل'}
    </span>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useApp();
  const roles = [
    { key:'owner',  label:'المستخدم الرئيسي', sub:'الحبيب / المساعد', Icon:I.User },
    { key:'driver', label:'تطبيق السائق',     sub:'أحمد أو محمد',    Icon:I.Car },
    { key:'admin',  label:'لوحة الإدارة',    sub:'Desktop dashboard', Icon:I.Grid },
  ];
  return (
    <div className="w-full flex flex-col items-center gap-3 py-4 px-4 bg-ink text-parchment">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-brass">
          <img src={LOGO} alt="" className="w-full h-full object-cover"/>
        </div>
        <div>
          <div className="text-base font-bold serif leading-tight">مواعيد حامد بن عمر</div>
          <div className="text-[10px] text-parchment/60 leading-tight flex items-center gap-2">
            <span>Maw3idi · منظومة متكاملة</span>
            <span>·</span>
            <ConnectionStatus/>
          </div>
        </div>
      </div>
      <div className="inline-flex bg-white/5 rounded-chip p-1 hairline border-white/10">
        {roles.map(r => {
          const active = role === r.key;
          return (
            <button key={r.key} onClick={()=>setRole(r.key)}
              className={`px-4 py-2 rounded-[5px] text-xs font-medium flex items-center gap-2 transition-colors ${active?'bg-brass text-white':'text-parchment/80 hover:bg-white/5'}`}>
              <r.Icon size={15} stroke={active?2.2:1.7}/>
              <div className="text-right">
                <div className="font-bold">{r.label}</div>
                <div className="text-[10px] opacity-70">{r.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StageContent() {
  const { role, loading, error } = useApp();
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-brass border-t-transparent animate-spin mx-auto"></div>
          <div className="text-sm text-stone">جاري تحميل البيانات من Supabase...</div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center p-8">
        <div className="bg-clayLite border border-clay/30 rounded-card p-6 max-w-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-clay text-white flex items-center justify-center mx-auto">
            <I.Warn size={24}/>
          </div>
          <div className="text-base font-bold text-clay">تعذّر الاتصال</div>
          <div className="text-sm text-ink whitespace-pre-wrap">{error}</div>
          <div className="text-xs text-stone bg-paper rounded-chip p-3 text-right">
            راجع ملف <span className="font-mono">.env</span> وتأكد من ضبط:
            <div className="font-mono text-[11px] mt-1 space-y-0.5">
              <div>VITE_SUPABASE_URL</div>
              <div>VITE_SUPABASE_ANON_KEY</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const isMobileApp = role === 'owner' || role === 'driver';
  return (
    <div className={`w-full ${isMobileApp?'flex items-start justify-center py-8':'p-4'} stage-pad`}>
      {role === 'owner'  && <UserApp/>}
      {role === 'driver' && <DriverApp/>}
      {role === 'admin'  && <AdminApp/>}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen app-wash">
        <RoleSwitcher/>
        <StageContent/>
        <Toast/>
      </div>
    </AppProvider>
  );
}
