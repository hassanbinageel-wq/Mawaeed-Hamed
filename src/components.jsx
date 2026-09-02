import React from 'react';
import { useApp } from './store';

/* ==========================================================================
   Icons (minimal, hand-picked; no emoji in UI)
   ========================================================================== */
const Icon = {
  base: (path, {size=20, className='', stroke=1.75}={}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>{path}</svg>
  )
};
const I = {
  Home:      (p) => Icon.base(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>, p),
  Cal:       (p) => Icon.base(<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></>, p),
  Car:       (p) => Icon.base(<><path d="M5 17h14M6 13l2-5h8l2 5"/><rect x="4" y="13" width="16" height="5" rx="1.5"/><circle cx="8" cy="18" r="1.2"/><circle cx="16" cy="18" r="1.2"/></>, p),
  User:      (p) => Icon.base(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></>, p),
  Users:     (p) => Icon.base(<><circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c1-3.5 4-5 6-5s5 1.5 6 5M15 20c.8-2.5 3-4 5-4"/></>, p),
  Bell:      (p) => Icon.base(<><path d="M6 8a6 6 0 1112 0v5l2 2H4l2-2z"/><path d="M10 19a2 2 0 004 0"/></>, p),
  Plus:      (p) => Icon.base(<path d="M12 5v14M5 12h14"/>, p),
  Menu:      (p) => Icon.base(<><path d="M4 6h16M4 12h16M4 18h16"/></>, p),
  Dots:      (p) => Icon.base(<><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></>, p),
  Check:     (p) => Icon.base(<path d="M4 12l5 5L20 6"/>, p),
  X:         (p) => Icon.base(<path d="M6 6l12 12M18 6L6 18"/>, p),
  Pin:       (p) => Icon.base(<><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></>, p),
  Clock:     (p) => Icon.base(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, p),
  Bolt:      (p) => Icon.base(<path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/>, p),
  Layers:    (p) => Icon.base(<><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/></>, p),
  List:      (p) => Icon.base(<><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>, p),
  Grid:      (p) => Icon.base(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>, p),
  Route:     (p) => Icon.base(<><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 004-4V9"/></>, p),
  Send:      (p) => Icon.base(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>, p),
  Warn:      (p) => Icon.base(<><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></>, p),
  Search:    (p) => Icon.base(<><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>, p),
  Chevron:   (p) => Icon.base(<path d="M15 6l-6 6 6 6"/>, p),
  ChevronR:  (p) => Icon.base(<path d="M9 6l6 6-6 6"/>, p),
  ChevronD:  (p) => Icon.base(<path d="M6 9l6 6 6-6"/>, p),
  Phone:     (p) => Icon.base(<path d="M5 3h4l2 5-3 2a11 11 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 6a2 2 0 012-3z"/>, p),
  Play:      (p) => Icon.base(<path d="M6 4l14 8-14 8z"/>, p),
  Flag:      (p) => Icon.base(<><path d="M4 21V4"/><path d="M4 4h13l-2 4 2 4H4"/></>, p),
  Book:      (p) => Icon.base(<><path d="M4 4h11a4 4 0 014 4v13"/><path d="M4 4v14a3 3 0 003 3h12"/></>, p),
  Handshake: (p) => Icon.base(<><path d="M2 12l4-4 6 6-2 2a3 3 0 01-4 0l-4-4z"/><path d="M12 14l2-2 4 4-2 2a3 3 0 01-4 0z"/></>, p),
  Plane:     (p) => Icon.base(<path d="M2 12l8-2 5-8 2 1-3 8 6-1 2 1-5 3-1 5-2-1 1-6-8 3-2-1 2-2z"/>, p),
  Star:      (p) => Icon.base(<path d="M12 3l2.6 6 6.4.5-4.9 4.2 1.6 6.3L12 16.9 6.3 20l1.6-6.3L3 9.5 9.4 9z"/>, p),
  Settings:  (p) => Icon.base(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.4 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.4-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.4H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></>, p),
  Report:    (p) => Icon.base(<><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 12v5M12 8v9M16 14v3"/></>, p),
  Activity:  (p) => Icon.base(<path d="M3 12h4l3-8 4 16 3-8h4"/>, p),
  LogOut:    (p) => Icon.base(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>, p),
  Refresh:   (p) => Icon.base(<><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></>, p),
  Filter:    (p) => Icon.base(<path d="M3 5h18l-7 8v6l-4 2v-8z"/>, p),
  Zap:       (p) => Icon.base(<path d="M13 2L4 14h7l-1 8 10-14h-8z"/>, p),
  Trash:     (p) => Icon.base(<><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></>, p),
  Edit:      (p) => Icon.base(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>, p),
  Mic:       (p) => Icon.base(<><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></>, p),
  Sparkle:   (p) => Icon.base(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>, p),
};

/* ==========================================================================
   Constants: types, statuses, priority
   ========================================================================== */
const APPT_TYPES = {
  lesson:   { key:'lesson',   label:'درس',       tone:'sage',    icon:I.Book },
  meeting:  { key:'meeting',  label:'اجتماع',    tone:'brass',   icon:I.Handshake },
  visit:    { key:'visit',    label:'زيارة',     tone:'indigo',  icon:I.Users },
  travel:   { key:'travel',   label:'سفر',       tone:'brass',   icon:I.Plane },
  personal: { key:'personal', label:'شخصي',      tone:'stone',   icon:I.User },
  urgent:   { key:'urgent',   label:'طارئ',      tone:'clay',    icon:I.Zap },
};
const PRIORITIES = {
  low:    { key:'low',    label:'منخفضة', tone:'stone'  },
  normal: { key:'normal', label:'عادية',  tone:'ink'    },
  high:   { key:'high',   label:'مهمة',   tone:'brass'  },
  urgent: { key:'urgent', label:'عاجلة',  tone:'clay'   },
};
const TRIP_STATUS = {
  pending:    { key:'pending',    label:'بانتظار التعيين', tone:'stone'   },
  awaiting:   { key:'awaiting',   label:'بانتظار التأكيد', tone:'brass'   },
  confirmed:  { key:'confirmed',  label:'مؤكد',            tone:'indigo'  },
  onway:      { key:'onway',      label:'في الطريق',       tone:'indigo'  },
  arrived:    { key:'arrived',    label:'وصل',             tone:'brass'   },
  completed:  { key:'completed',  label:'مُكتمل',          tone:'sage'    },
  cancelled:  { key:'cancelled',  label:'ملغى',            tone:'clay'    },
  declined:   { key:'declined',   label:'رفض السائق',      tone:'clay'    },
};
const DRIVER_STATUS = {
  available: { key:'available', label:'متاح',       tone:'sage'  },
  busy:      { key:'busy',      label:'مشغول',      tone:'brass' },
  off:       { key:'off',       label:'خارج الخدمة', tone:'stone' },
};

/* Tone → tailwind class helpers */
const toneBg  = (t) => ({sage:'bg-sageLite',brass:'bg-[#F1E4CE]',indigo:'bg-indigoLite',clay:'bg-clayLite',stone:'bg-line2',ink:'bg-[#E1E3EA]'})[t] || 'bg-line2';
const toneFg  = (t) => ({sage:'text-sage',  brass:'text-brass',   indigo:'text-indigo',  clay:'text-clay',  stone:'text-stone',ink:'text-ink'})[t] || 'text-stone';
const toneDot = (t) => ({sage:'bg-sage',    brass:'bg-brass',     indigo:'bg-indigo',    clay:'bg-clay',    stone:'bg-stone2',ink:'bg-ink'})[t] || 'bg-stone2';

/* ==========================================================================
   Time helpers
   ========================================================================== */
const pad = (n) => String(n).padStart(2,'0');
const AR_DAYS   = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const AR_MONTHS_SHORT = ['ينا','فبر','مار','أبر','ماي','يون','يول','أغس','سبت','أكت','نوف','ديس'];

const fmtDate = (d) => `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
const fmtDateShort = (d) => `${pad(d.getDate())} ${AR_MONTHS_SHORT[d.getMonth()]}`;
const fmtTime12 = (h, m) => {
  const period = h >= 12 ? 'م' : 'ص';
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh}:${pad(m)} ${period}`;
};
const fmtTimeFromISO = (iso) => {
  const d = new Date(iso); return fmtTime12(d.getHours(), d.getMinutes());
};
const fmtTimeShortFromISO = (iso) => {
  const d = new Date(iso); return `${d.getHours()%12||12}:${pad(d.getMinutes())}`;
};
const fmtDateAndTime = (iso) => {
  const d = new Date(iso);
  return `${fmtDate(d)} · ${fmtTime12(d.getHours(), d.getMinutes())}`;
};
const sameDay = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const relativeTime = (iso, now) => {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff); const mins = Math.round(abs/60000); const past = diff<0;
  if (mins < 1) return 'الآن';
  if (mins < 60) return past ? `قبل ${mins} د` : `بعد ${mins} د`;
  const hrs = Math.round(mins/60);
  if (hrs < 24) return past ? `قبل ${hrs} س` : `بعد ${hrs} س`;
  const days = Math.round(hrs/24);
  return past ? `قبل ${days} ي` : `بعد ${days} ي`;
};
const closenessOf = (iso, now) => {
  const diffH = (new Date(iso).getTime() - now.getTime()) / 3600000;
  if (diffH < 0) return 'past';
  if (diffH <= 3) return 'urgent';
  if (diffH <= 24) return 'soon';
  return 'far';
};

/* ==========================================================================
   Location suggestions for the datalist
   ========================================================================== */
const LOCATIONS = [
  'مسجد المحضار — تريم',
  'رباط تريم',
  'دار المصطفى للدراسات الإسلامية — تريم',
  'جامعة الأحقاف — تريم',
  'مقبرة زنبل — تريم',
  'المنزل — تريم',
  'مسجد الفتح — سيئون',
  'قصر الكثيري — سيئون',
  'مطار سيئون الدولي',
  'شبام حضرموت',
  'مسجد باعلوي — تريم',
];
function Badge({ tone='stone', children, dot=false, size='md' }) {
  const sz = size === 'sm' ? 'text-[11px] px-2 py-[2px] gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-chip ${sz} ${toneBg(tone)} ${toneFg(tone)} font-medium`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${toneDot(tone)}`} />}
      {children}
    </span>
  );
}
function StatusDot({ tone, pulse }) {
  return (
    <span className="inline-flex items-center justify-center relative">
      <span className={`w-2 h-2 rounded-full ${toneDot(tone)}`} />
      {pulse && <span className={`absolute w-2 h-2 rounded-full ${toneDot(tone)} pulse opacity-60`} style={{transform:'scale(2)'}} />}
    </span>
  );
}
function Btn({ variant='primary', size='md', children, className='', ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-chip disabled:opacity-50 disabled:cursor-not-allowed';
  const sz = size === 'sm' ? 'text-xs px-3 py-1.5' : size==='lg' ? 'text-base px-5 py-3' : 'text-sm px-4 py-2';
  const styles = {
    primary:   'bg-ink text-parchment hover:bg-ink2',
    brass:     'bg-brass text-white hover:bg-[#94703F]',
    sage:      'bg-sage text-white hover:bg-[#5F6F58]',
    clay:      'bg-clay text-white hover:bg-[#9D3E32]',
    ghost:     'text-ink hover:bg-line2',
    outline:   'bg-transparent text-ink hairline hover:bg-line2',
    subtle:    'bg-line2 text-ink hover:bg-line',
  }[variant] || 'bg-ink text-white';
  return <button className={`${base} ${sz} ${styles} ${className}`} {...rest}>{children}</button>;
}
function IconBtn({ children, className='', ...rest }) {
  return <button className={`w-9 h-9 inline-flex items-center justify-center rounded-full text-ink hover:bg-line2 transition-colors ${className}`} {...rest}>{children}</button>;
}
function Card({ children, className='', pad=true }) {
  return <div className={`bg-paper rounded-card hairline shadow-card ${pad?'p-4':''} ${className}`}>{children}</div>;
}
function Section({ title, right, children, className='' }) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between">
          {title && <h3 className="text-[13px] font-bold text-stone tracking-wide">{title}</h3>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
function Modal({ open, onClose, children, title, size='md' }) {
  if (!open) return null;
  const w = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md';
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{background:'rgba(20,25,43,0.45)'}}>
      <div className={`w-full ${w} bg-paper rounded-t-hero sm:rounded-hero shadow-pop max-h-[90vh] overflow-hidden flex flex-col`}>
        <header className="flex items-center justify-between px-5 py-4 hairline-b">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          <IconBtn onClick={onClose}><I.X size={18}/></IconBtn>
        </header>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-stone">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-stone2 block">{hint}</span>}
    </label>
  );
}
const inputCls = 'w-full bg-parchment hairline rounded-chip px-3 py-2.5 text-sm text-ink placeholder:text-stone2 focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass';

function Avatar({ src, name, size=36, ring=false }) {
  const initials = (name||'').split(' ').map(w => w[0]).slice(0,2).join('');
  const sz = { width:size, height:size };
  if (src) return <img src={src} alt={name} style={sz} className={`rounded-full object-cover ${ring?'ring-2 ring-brass ring-offset-2 ring-offset-parchment':''}`} />;
  return (
    <div style={sz} className={`rounded-full bg-line flex items-center justify-center text-ink font-bold ${ring?'ring-2 ring-brass ring-offset-2 ring-offset-parchment':''}`}>
      <span style={{fontSize: size*0.4}}>{initials}</span>
    </div>
  );
}

/* Type chip with icon */
function typeInfo(type) {
  if (APPT_TYPES[type]) return APPT_TYPES[type];
  // Custom user-defined type: use the string as label, brass tone, generic icon
  return { key: type, label: type, tone: 'brass', icon: I.Edit };
}
function TypeChip({ type }) {
  const t = typeInfo(type);
  const Ico = t.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-chip ${toneBg(t.tone)} ${toneFg(t.tone)}`}>
      <Ico size={13} stroke={2}/> {t.label}
    </span>
  );
}

/* Toast */
function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200]">
      <div className={`px-4 py-2.5 rounded-full shadow-pop text-sm font-medium flex items-center gap-2 ${toneBg(toast.tone)} ${toneFg(toast.tone)} hairline`}>
        <StatusDot tone={toast.tone}/>
        {toast.msg}
      </div>
    </div>
  );
}

export {
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
};
