import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AiChat.module.css';

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

  // If session exists and hasn't timed out, reuse it
  if (existingId && now - existingTs < SESSION_TIMEOUT_MS) {
    localStorage.setItem(SESSION_TS_KEY, String(now)); // refresh timestamp
    return existingId;
  }

  // Create fresh session
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
      // Strip the data URI prefix, e.g. "data:image/jpeg;base64,"
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Sparkle SVG icon ─────────────────────────────────────────────────
function SparkleIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 19 L10.5 12 L4 10.5 L10.5 9 Z" />
      <path d="M19 3 L19.7 5.3 L22 6 L19.7 6.7 L19 9 L18.3 6.7 L16 6 L18.3 5.3 Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, onClearAiFilter }) {
  if (msg.role === 'user') {
    return (
      <div className={styles.userRow}>
        {msg.imagePreview && (
          <div className={styles.userImagePreview}>
            <img src={msg.imagePreview} alt="Uploaded" />
          </div>
        )}
        {msg.text && <div className={styles.userBubble}>{msg.text}</div>}
      </div>
    );
  }

  // Bot message — render the ordered messages array
  return (
    <div className={styles.botRow}>
      <div className={styles.botAvatar}>
        <SparkleIcon size={14} />
      </div>
      <div className={styles.botMessages}>
        {msg.messages.map((m, i) => {
          if (m.type === 'text') {
            return (
              <div key={i} className={styles.botBubble}>
                {m.text}
              </div>
            );
          }
          if (m.type === 'image') {
            return (
              <div key={i} className={styles.botImageCard}>
                <img src={m.imageUrl} alt={m.caption || 'Product'} />
                {m.caption && <p className={styles.botImageCaption}>{m.caption}</p>}
              </div>
            );
          }
          if (m.type === 'page_filter') {
            return (
              <div key={i} className={styles.pageFilterNote}>
                <span className={styles.pageFilterArrow}>↑</span>
                <span>
                  <strong>{m.count} item{m.count !== 1 ? 's' : ''}</strong> filtered on the page above
                </span>
                <button
                  className={styles.pageFilterClear}
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
    <div className={styles.botRow}>
      <div className={styles.botAvatar}>
        <SparkleIcon size={14} />
      </div>
      <div className={styles.typingBubble}>
        <span /><span /><span />
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

  // Scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setShowBadge(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Show welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0 && store) {
      setMessages([{
        id: Date.now(),
        role: 'bot',
        messages: [
          {
            type: 'text',
            text: `Hello! Welcome to ${store.store_name || 'our store'} ✨\n\nI'm your personal jewellery assistant. Ask me anything about our collection — I can help you find rings, earrings, necklaces, and much more. You can also send me an image to search by look!`,
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

    // Optimistic user message
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
      // Pull every SKU the AI included in an image message, pass them
      // to Storefront which does a sku→id lookup and filters the grid.
      // onAiResults returns the number of products actually matched so
      // the in-chat note shows the correct count (not the raw SKU count).
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
          // Filter out the image messages since they are shown on the website
          filteredBotMessages = botMessages.filter(m => m.type !== 'image');
        }
      }

      // Append the page-filter note as a final message so the user
      // sees the link between chat and the filtered catalogue above.
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
      // Remove optimistic user message on error
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
      <div className={styles.fabWrap}>
        {showBadge && !open && (
          <div className={styles.fabTooltip}>How can I help you?</div>
        )}
        <button
          className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close chat' : 'Open AI chat'}
          id="swarnix-chat-fab"
        >
          {open ? <CloseIcon /> : <SparkleIcon size={24} />}
        </button>
      </div>

      {/* ── Chat window ── */}
      <div className={`${styles.chatWindow} ${open ? styles.chatWindowOpen : ''}`} role="dialog" aria-label="AI Jewellery Assistant">

        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderIcon}>
            <SparkleIcon size={16} />
          </div>
          <div className={styles.chatHeaderText}>
            <span className={styles.chatHeaderTitle}>AI Jewellery Assistant</span>
            <span className={styles.chatHeaderSub}>
              <span className={styles.onlineDot} /> Powered by Swarnix
            </span>
          </div>
          <button className={styles.chatCloseBtn} onClick={() => setOpen(false)} aria-label="Close chat">
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className={styles.chatBody} id="swarnix-chat-messages">
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onClearAiFilter={onClearAiFilter} />
          ))}
          {loading && <TypingIndicator />}
          {error && (
            <div className={styles.errorBanner}>
              ⚠ {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview strip */}
        {imagePreview && (
          <div className={styles.imagePreviewStrip}>
            <img src={imagePreview} alt="Selected" className={styles.imagePreviewThumb} />
            <span className={styles.imagePreviewName}>{imageFile?.name}</span>
            <button className={styles.imagePreviewRemove} onClick={removeImage} aria-label="Remove image">
              <XSmallIcon />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className={styles.chatInputArea}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageSelect}
            id="swarnix-chat-file"
          />
          <button
            className={styles.imageBtn}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image for visual search"
            title="Search by image"
          >
            <ImageIcon />
          </button>
          <textarea
            ref={inputRef}
            className={styles.chatInput}
            placeholder="Ask about rings, earrings, necklaces…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            id="swarnix-chat-input"
          />
          <button
            className={`${styles.sendBtn} ${canSend ? styles.sendBtnActive : ''}`}
            onClick={sendMessage}
            disabled={!canSend}
            aria-label="Send message"
            id="swarnix-chat-send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </>
  );
}
