import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, X, Send, Image as ImageIcon, ArrowUp, AlertTriangle,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────
const WEBHOOK_URL = 'https://n8n.srv1639765.hstgr.cloud/webhook/swarnix-web-chat';
const SESSION_KEY = 'swarnix_sid';
const SESSION_TS_KEY = 'swarnix_sid_ts';
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

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

  // Bot message — render the ordered messages array
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

// ── Typing indicator ─────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
        <Sparkles size={14} />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-line bg-white px-4 py-3.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ChatWidget component ─────────────────────────────────────────
export default function AiChat({ store, products, onAiResults, onClearAiFilter }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [visitorName] = useState('Website Visitor');
  const [showBadge, setShowBadge] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setShowBadge(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-grow the input: stays one line at rest, expands with multi-line
  // text up to the max height, and only then reveals a scrollbar.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 112; // px — matches max-h-28
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [input, open]);

  // Show welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0 && store) {
      setMessages([{
        id: Date.now(),
        role: 'bot',
        messages: [
          {
            type: 'text',
            text: `Hello! Welcome to ${store.store_name || 'our store'}.\n\nI'm your personal jewellery assistant. Ask me anything about our collection — I can help you find rings, earrings, necklaces, and much more. You can also send me an image to search by look!`,
          },
        ],
      }]);
    }
  }, [open, store]); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage() {
    const text = input.trim();
    if (!text && !imageFile) return;
    if (!store?.owner_id) return;
    if (loading) return;

    setError(null);
    touchSession();
    const sessionId = getOrCreateSessionId();

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      imagePreview,
    };
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
          owner_id:     store.owner_id,
          session_id:   sessionId,
          image_base64: base64,
          mime_type:    mimeType,
          visitor_name: visitorName,
        };
        if (text) body.message = text;
      } else {
        body = {
          owner_id:     store.owner_id,
          session_id:   sessionId,
          message:      text,
          visitor_name: visitorName,
        };
      }

      const res = await fetch(WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || 'Unexpected response from server');

      const botMessages = data.messages || [];

      // ── AI → Page filter bridge (SKU-based) ──────────────────────
      const skusSet = new Set();
      const addSkusFromString = (str) => {
        if (!str) return;
        String(str)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(s => skusSet.add(s));
      };

      if (data.sku) addSkusFromString(data.sku);
      if (data.skus) addSkusFromString(data.skus);
      botMessages.forEach(m => {
        if (m.sku) addSkusFromString(m.sku);
      });

      const skus = Array.from(skusSet);

      let pageFilterNote = null;
      let filteredBotMessages = botMessages;
      if (skus.length > 0 && typeof onAiResults === 'function') {
        const matchedCount = onAiResults(skus, text || 'your search');
        if (matchedCount > 0) {
          pageFilterNote = {
            type:  'page_filter',
            count: matchedCount,
          };
          filteredBotMessages = botMessages.filter(m => m.type !== 'image');
        }
      }

      const finalMessages = pageFilterNote
        ? [...filteredBotMessages, pageFilterNote]
        : botMessages;

      setMessages(prev => [...prev, {
        id:       Date.now() + 1,
        role:     'bot',
        messages: finalMessages,
      }]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
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
      {/* ── Floating trigger button ── */}
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
          id="swarnix-chat-fab"
        >
          {open ? <X size={24} /> : <Sparkles size={24} />}
        </button>
      </div>

      {/* ── Chat window ── */}
      <div
        className={`fixed bottom-0 right-0 z-[95] flex w-full flex-col bg-cream shadow-[0_-10px_60px_-15px_rgba(42,33,24,.4)] transition-all duration-300 sm:bottom-24 sm:right-6 sm:h-[600px] sm:max-h-[80vh] sm:w-[390px] sm:rounded-3xl sm:border sm:border-line ${
          open
            ? 'pointer-events-auto h-[85vh] translate-y-0 rounded-t-3xl opacity-100'
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

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" id="swarnix-chat-messages">
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

        {/* Image preview strip */}
        {imagePreview && (
          <div className="flex items-center gap-2.5 border-t border-line bg-ivory px-4 py-2.5">
            <img src={imagePreview} alt="Selected" className="h-10 w-10 rounded-lg object-cover" />
            <span className="flex-1 truncate text-xs text-ink-mid">{imageFile?.name}</span>
            <button
              className="grid h-6 w-6 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
              onClick={removeImage}
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-2 border-t border-line bg-cream px-3 py-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageSelect}
            id="swarnix-chat-file"
          />
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-gold-700"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image for visual search"
            title="Search by image"
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
            id="swarnix-chat-input"
          />
          <button
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
              canSend ? 'bg-gold-sheen text-white shadow-gold hover:scale-105' : 'bg-sand text-ink-soft'
            }`}
            onClick={sendMessage}
            disabled={!canSend}
            aria-label="Send message"
            id="swarnix-chat-send"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </>
  );
}
