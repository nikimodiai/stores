import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, X, Send, Image as ImageIcon, ArrowUp, AlertTriangle, ChevronDown, User, Phone, MapPin,
} from 'lucide-react';
import { db } from '../lib/config';

// ── Constants ────────────────────────────────────────────────────────
const WEBHOOK_URL = 'https://n8n.srv1639765.hstgr.cloud/webhook/swarnix-web-chat';
const SESSION_KEY = 'swarnix_sid';
const SESSION_TS_KEY = 'swarnix_sid_ts';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const VISITOR_KEY = 'swarnix_visitor'; // stores { name, phone, city } after first submission

// Common country codes — India first, then alphabetical.
const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+93',  flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+355', flag: '🇦🇱', name: 'Albania' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+374', flag: '🇦🇲', name: 'Armenia' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+375', flag: '🇧🇾', name: 'Belarus' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+975', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+673', flag: '🇧🇳', name: 'Brunei' },
  { code: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: '+53',  flag: '🇨🇺', name: 'Cuba' },
  { code: '+357', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+372', flag: '🇪🇪', name: 'Estonia' },
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+679', flag: '🇫🇯', name: 'Fiji' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+995', flag: '🇬🇪', name: 'Georgia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: '+354', flag: '🇮🇸', name: 'Iceland' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+98',  flag: '🇮🇷', name: 'Iran' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+1876',flag: '🇯🇲', name: 'Jamaica' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+7',   flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+856', flag: '🇱🇦', name: 'Laos' },
  { code: '+371', flag: '🇱🇻', name: 'Latvia' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+960', flag: '🇲🇻', name: 'Maldives' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+356', flag: '🇲🇹', name: 'Malta' },
  { code: '+230', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+373', flag: '🇲🇩', name: 'Moldova' },
  { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+95',  flag: '🇲🇲', name: 'Myanmar' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+970', flag: '🇵🇸', name: 'Palestine' },
  { code: '+507', flag: '🇵🇦', name: 'Panama' },
  { code: '+51',  flag: '🇵🇪', name: 'Peru' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+48',  flag: '🇵🇱', name: 'Poland' },
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+40',  flag: '🇷🇴', name: 'Romania' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+221', flag: '🇸🇳', name: 'Senegal' },
  { code: '+381', flag: '🇷🇸', name: 'Serbia' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+252', flag: '🇸🇴', name: 'Somalia' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+963', flag: '🇸🇾', name: 'Syria' },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
];

// ── Session helpers ──────────────────────────────────────────────────
function getOrCreateSessionId() {
  const now = Date.now();
  const existingId = localStorage.getItem(SESSION_KEY);
  const existingTs = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0', 10);
  if (existingId && now - existingTs < SESSION_TIMEOUT_MS) {
    localStorage.setItem(SESSION_TS_KEY, String(now));
    return existingId;
  }
  const newId = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, newId);
  localStorage.setItem(SESSION_TS_KEY, String(now));
  return newId;
}

function touchSession() {
  localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
}

function getSavedVisitor() {
  try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); } catch { return null; }
}

function saveVisitorLocally(data) {
  localStorage.setItem(VISITOR_KEY, JSON.stringify(data));
}

function normalisePhone(num) {
  return String(num || '').replace(/\D/g, '');
}

// Upsert customer into Supabase — insert if number+owner not found, skip if exists.
async function upsertCustomer({ ownerId, name, whatsappNumber, city }) {
  const norm = normalisePhone(whatsappNumber);
  if (!norm || !ownerId || !name) return;

  // Check if already exists (match on normalised digits — same approach as try-on gate).
  const { data: existing } = await db
    .from('customers')
    .select('id, whatsapp_number')
    .eq('owner_id', ownerId);

  const alreadySaved = (existing || []).some(
    c => normalisePhone(c.whatsapp_number) === norm,
  );
  if (alreadySaved) return;

  await db.from('customers').insert({
    owner_id: ownerId,
    name: name.trim(),
    whatsapp_number: whatsappNumber.trim(),
    city: city?.trim() || null,
    tier: 'Regular',
  });
}

// ── Image helpers ────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, onClearAiFilter }) {
  if (msg.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {msg.imagePreview && (
          <div className="overflow-hidden rounded-2xl rounded-br-md border border-gold-200">
            <img src={msg.imagePreview} alt="Uploaded" className="max-h-44 w-auto object-cover" />
          </div>
        )}
        {msg.text && (
          <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gold-sheen px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-gold">
            {msg.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
        <Sparkles size={14} />
      </span>
      <div className="flex max-w-[85%] flex-col gap-2">
        {msg.messages.map((m, i) => {
          if (m.type === 'text') {
            return (
              <div key={i} className="whitespace-pre-line rounded-2xl rounded-tl-md border border-line bg-white px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                {m.text}
              </div>
            );
          }
          if (m.type === 'image') {
            return (
              <div key={i} className="overflow-hidden rounded-2xl rounded-tl-md border border-line bg-white">
                <img src={m.imageUrl} alt={m.caption || 'Product'} className="w-full object-cover" />
                {m.caption && <p className="px-3 py-2 text-xs text-ink-mid">{m.caption}</p>}
              </div>
            );
          }
          if (m.type === 'page_filter') {
            return (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-ink">
                <ArrowUp size={14} className="shrink-0 text-gold-700" />
                <span>
                  <strong>{m.count} item{m.count !== 1 ? 's' : ''}</strong> filtered on the page above
                </span>
                <button
                  className="ml-auto shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gold-700 transition hover:bg-gold-100"
                  onClick={onClearAiFilter}
                  aria-label="Clear AI filter"
                >
                  Clear
                </button>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
        <Sparkles size={14} />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-400" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Customer intake form ─────────────────────────────────────────────
function IntakeForm({ onSubmit, storeName }) {
  const [name, setName]               = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [localPhone, setLocalPhone]   = useState('');
  const [city, setCity]               = useState('');
  const [errors, setErrors]           = useState({});
  const [showDd, setShowDd]           = useState(false);
  const [ddSearch, setDdSearch]       = useState('');
  const ddRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => { setTimeout(() => nameRef.current?.focus(), 80); }, []);

  useEffect(() => {
    if (!showDd) return;
    const handler = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) {
        setShowDd(false); setDdSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDd]);

  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(ddSearch.toLowerCase()) || c.code.includes(ddSearch)
  );

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Please enter your name.';
    if (!localPhone.trim()) e.phone = 'Please enter your WhatsApp number.';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({
      name: name.trim(),
      whatsappNumber: countryCode + localPhone.trim(),
      city: city.trim(),
    });
  };

  return (
    <div className="flex flex-col gap-4 px-1">
      <div className="flex items-start gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-sheen text-white shadow-gold mt-0.5">
          <Sparkles size={14} />
        </span>
        <p className="text-sm leading-relaxed text-ink">
          Welcome to <strong>{storeName || 'our store'}</strong>! Before we start, tell us a little about yourself.
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-luxe text-ink-mid">Your Name *</label>
        <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/15 ${errors.name ? 'border-maroon-500' : 'border-line'}`}>
          <User size={14} className="shrink-0 text-gold-700" />
          <input
            ref={nameRef}
            type="text"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            placeholder="e.g. Priya Sharma"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          />
        </div>
        {errors.name && <p className="mt-1 text-[12px] text-maroon-600">{errors.name}</p>}
      </div>

      {/* WhatsApp number */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-luxe text-ink-mid">WhatsApp / Phone *</label>
        <div className="flex gap-2">
          {/* Country code dropdown */}
          <div className="relative shrink-0" ref={ddRef}>
            <button
              type="button"
              className="flex h-[42px] items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 text-sm text-ink transition hover:border-gold-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/15"
              onClick={() => { setShowDd(v => !v); setDdSearch(''); }}
            >
              <span className="text-base leading-none">{COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🌐'}</span>
              <span className="font-medium">{countryCode}</span>
              <ChevronDown size={12} className={`text-ink-mid transition-transform ${showDd ? 'rotate-180' : ''}`} />
            </button>
            {showDd && (
              <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-lift animate-scaleIn">
                <div className="border-b border-line px-3 py-2">
                  <input
                    type="text"
                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
                    placeholder="Search country…"
                    value={ddSearch}
                    onChange={e => setDdSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filtered.length === 0
                    ? <p className="px-3 py-3 text-center text-sm text-ink-mid">No results</p>
                    : filtered.map(c => (
                      <button
                        key={`${c.code}-${c.name}`}
                        type="button"
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-sand ${c.code === countryCode ? 'bg-gold-50 font-semibold text-gold-700' : 'text-ink'}`}
                        onClick={() => { setCountryCode(c.code); setShowDd(false); setDdSearch(''); }}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-ink-mid">{c.code}</span>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
          {/* Local number */}
          <div className={`flex flex-1 items-center gap-2 rounded-xl border bg-white px-3 transition focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/15 ${errors.phone ? 'border-maroon-500' : 'border-line'}`}>
            <Phone size={14} className="shrink-0 text-gold-700" />
            <input
              type="tel"
              inputMode="tel"
              className="flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft"
              placeholder="98765 43210"
              value={localPhone}
              onChange={e => { setLocalPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
          </div>
        </div>
        {errors.phone && <p className="mt-1 text-[12px] text-maroon-600">{errors.phone}</p>}
      </div>

      {/* City (optional) */}
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-luxe text-ink-mid">City <span className="normal-case font-normal text-ink-soft">(optional)</span></label>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/15">
          <MapPin size={14} className="shrink-0 text-gold-700" />
          <input
            type="text"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
            placeholder="e.g. Mumbai"
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          />
        </div>
      </div>

      <button className="btn-gold w-full mt-1" onClick={submit}>
        <Sparkles size={15} /> Start Chat
      </button>
      <p className="text-center text-[11px] text-ink-soft">Your details help us personalise your experience.</p>
    </div>
  );
}

// ── Main ChatWidget component ─────────────────────────────────────────
export default function AiChat({ store, onAiResults, onClearAiFilter }) {
  const [open, setOpen]           = useState(false);
  const [phase, setPhase]         = useState('intake'); // 'intake' | 'chat'
  const [visitor, setVisitor]     = useState(null);     // { name, whatsappNumber, city }
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showBadge, setShowBadge] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const fileInputRef   = useRef(null);

  // On mount, check if visitor already filled the form this session
  useEffect(() => {
    const saved = getSavedVisitor();
    if (saved) { setVisitor(saved); setPhase('chat'); }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setShowBadge(false);
      if (phase === 'chat') setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, phase]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 112;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [input, open]);

  // Welcome message after intake
  useEffect(() => {
    if (phase === 'chat' && messages.length === 0 && store && visitor) {
      setMessages([{
        id: Date.now(),
        role: 'bot',
        messages: [{
          type: 'text',
          text: `Hello ${visitor.name}! Welcome to ${store.store_name || 'our store'}.\n\nI'm your personal jewellery assistant. Ask me anything about our collection — rings, earrings, necklaces, and much more. You can also send me an image to search by look!`,
        }],
      }]);
    }
  }, [phase, store, visitor]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIntakeSubmit = async ({ name, whatsappNumber, city }) => {
    const v = { name, whatsappNumber, city };
    setVisitor(v);
    saveVisitorLocally(v);
    setPhase('chat');
    // Fire-and-forget upsert; don't block the UX on it
    if (store?.owner_id) {
      upsertCustomer({ ownerId: store.owner_id, name, whatsappNumber, city }).catch(() => {});
    }
  };

  async function sendMessage() {
    const text = input.trim();
    if (!text && !imageFile) return;
    if (!store?.owner_id) return;
    if (loading) return;

    setError(null);
    touchSession();
    const sessionId = getOrCreateSessionId();

    const userMsg = { id: Date.now(), role: 'user', text, imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImageFile(null);
    setImagePreview(null);
    setLoading(true);

    try {
      let body;
      if (imageFile) {
        const { base64, mimeType } = await fileToBase64(imageFile);
        body = {
          owner_id: store.owner_id,
          session_id: sessionId,
          image_base64: base64,
          mime_type: mimeType,
          visitor_name: visitor?.name || 'Website Visitor',
        };
        if (text) body.message = text;
      } else {
        body = {
          owner_id: store.owner_id,
          session_id: sessionId,
          message: text,
          visitor_name: visitor?.name || 'Website Visitor',
        };
      }

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Unexpected response from server');

      const botMessages = data.messages || [];

      const skusSet = new Set();
      const addSkus = (str) => str && String(str).split(',').map(s => s.trim()).filter(Boolean).forEach(s => skusSet.add(s));
      if (data.sku) addSkus(data.sku);
      if (data.skus) addSkus(data.skus);
      botMessages.forEach(m => { if (m.sku) addSkus(m.sku); });

      const skus = Array.from(skusSet);
      let pageFilterNote = null;
      let filteredBotMessages = botMessages;

      if (skus.length > 0 && typeof onAiResults === 'function') {
        const matchedCount = onAiResults(skus, text || 'your search');
        if (matchedCount > 0) {
          pageFilterNote = { type: 'page_filter', count: matchedCount };
          filteredBotMessages = botMessages.filter(m => m.type !== 'image');
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        messages: pageFilterNote ? [...filteredBotMessages, pageFilterNote] : botMessages,
      }]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    inputRef.current?.focus();
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const canSend = (input.trim() || imageFile) && !loading;

  return (
    <>
      {/* ── FAB ── */}
      <div className="fixed bottom-5 right-5 z-[90] flex items-center gap-2 sm:bottom-6 sm:right-6">
        {showBadge && !open && (
          <span className="hidden animate-fadeUp rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-ink shadow-lift ring-1 ring-line sm:block">
            How can I help you?
          </span>
        )}
        <button
          className="grid h-14 w-14 place-items-center rounded-full bg-gold-sheen text-white shadow-[0_8px_24px_-4px_rgba(184,134,11,.55)] transition hover:scale-105 active:scale-95"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close chat' : 'Open AI chat'}
        >
          {open ? <X size={24} /> : <Sparkles size={24} />}
        </button>
      </div>

      {/* ── Chat window ── */}
      <div
        className={`fixed bottom-0 right-0 z-[95] flex w-full flex-col bg-cream shadow-[0_-10px_60px_-15px_rgba(42,33,24,.4)] transition-all duration-300 sm:bottom-24 sm:right-6 sm:max-h-[80vh] sm:w-[390px] sm:rounded-3xl sm:border sm:border-line ${
          open
            ? 'pointer-events-auto translate-y-0 rounded-t-3xl opacity-100 ' + (phase === 'intake' ? 'h-auto' : 'h-[85vh] sm:h-[600px]')
            : 'pointer-events-none h-0 translate-y-4 opacity-0'
        }`}
        role="dialog"
        aria-label="AI Jewellery Assistant"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 rounded-t-3xl border-b border-line bg-gradient-to-r from-gold-50 to-cream px-4 py-3.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
            <Sparkles size={16} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-bold text-ink">AI Jewellery Assistant</span>
            <span className="flex items-center gap-1.5 text-[11px] text-ink-mid">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Powered by Swarnix
            </span>
          </div>
          <button
            className="ml-auto grid h-8 w-8 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Intake form ── */}
        {phase === 'intake' && (
          <div className="overflow-y-auto p-4">
            <IntakeForm onSubmit={handleIntakeSubmit} storeName={store?.store_name} />
          </div>
        )}

        {/* ── Chat ── */}
        {phase === 'chat' && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onClearAiFilter={onClearAiFilter} />
              ))}
              {loading && <TypingIndicator />}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-maroon-50 px-3 py-2.5 text-sm text-maroon-600">
                  <AlertTriangle size={16} className="shrink-0" /> {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {imagePreview && (
              <div className="flex items-center gap-2.5 border-t border-line bg-ivory px-4 py-2.5">
                <img src={imagePreview} alt="Selected" className="h-10 w-10 rounded-lg object-cover" />
                <span className="flex-1 truncate text-xs text-ink-mid">{imageFile?.name}</span>
                <button className="grid h-6 w-6 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink" onClick={removeImage} aria-label="Remove image">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 border-t border-line bg-cream px-3 py-3">
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
              <button
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-gold-700"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload image"
              >
                <ImageIcon size={19} />
              </button>
              <textarea
                ref={inputRef}
                className="max-h-28 flex-1 resize-none overflow-y-hidden rounded-2xl border border-line bg-white px-3.5 py-2.5 text-sm leading-5 text-ink outline-none transition placeholder:text-ink-soft focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
                placeholder="Ask about rings, earrings, necklaces…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
              <button
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${canSend ? 'bg-gold-sheen text-white shadow-gold hover:scale-105' : 'bg-sand text-ink-soft'}`}
                onClick={sendMessage}
                disabled={!canSend}
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
