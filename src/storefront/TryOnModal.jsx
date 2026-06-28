import { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload, Sparkles, RefreshCw, Download, Share2, MessageCircle, Mail, Copy, Check, Phone, Lock, ChevronDown } from 'lucide-react';
import { runTryOn, checkTryOnAccess } from '../lib/storefront';

// ── Styling options ──────────────────────────────────────────────────
// All of these only restyle AROUND the customer's own face — the selfie's
// identity (face, features, expression) is always preserved by the n8n
// "Build Prompt" node. Each list's '' value means "leave as-is / let AI decide".

// Occasion — a quick preset. Mirrors the outfit map in "Build Prompt".
// Attire & Background can still be set independently below for finer control.
const OCCASIONS = [
  { value: '', label: 'Just the jewellery' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'party', label: 'Party' },
  { value: 'festive', label: 'Festive' },
  { value: 'casual', label: 'Casual' },
];

const MAKEUP = [
  { value: '', label: 'As is' },
  { value: 'natural', label: 'Natural' },
  { value: 'soft_glam', label: 'Soft glam' },
  { value: 'bridal_glam', label: 'Bridal glam' },
];

const BINDI = [
  { value: '', label: 'None' },
  { value: 'small_red', label: 'Small red', dot: '#b4232a' },
  { value: 'maroon', label: 'Maroon', dot: '#7a1f2b' },
  { value: 'decorative', label: 'Decorative' },
];

const BACKGROUND = [
  { value: '', label: 'Keep mine' },
  { value: 'studio_white', label: 'Studio white' },
  { value: 'beige', label: 'Beige' },
  { value: 'gradient', label: 'Soft gradient' },
  { value: 'mandap', label: 'Wedding mandap' },
  { value: 'palace', label: 'Palace' },
  { value: 'outdoor', label: 'Outdoor bokeh' },
];

const ATTIRE = [
  { value: '', label: 'As is' },
  { value: 'saree', label: 'Saree' },
  { value: 'lehenga', label: 'Lehenga' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'indo_western', label: 'Indo-western' },
  { value: 'gown', label: 'Gown' },
  { value: 'plain', label: 'Plain neutral' },
];

const ATTIRE_COLOR = [
  { value: '', label: 'Auto' },
  { value: 'neutral', label: 'Neutral', dot: '#cfcfcf' },
  { value: 'red', label: 'Red', dot: '#b4232a' },
  { value: 'pastel', label: 'Pastel', dot: '#f2c9d4' },
  { value: 'jewel', label: 'Jewel-tone', dot: '#1f5c4d' },
  { value: 'black', label: 'Black', dot: '#111111' },
];

const ASPECT = [
  { value: '', label: 'Auto' },
  { value: '1:1', label: 'Square' },
  { value: '4:5', label: 'Portrait' },
  { value: '9:16', label: 'Story' },
  { value: '16:9', label: 'Landscape' },
];

const LIGHTING = [
  { value: '', label: 'As is' },
  { value: 'clean', label: 'Clean' },
  { value: 'soft', label: 'Soft studio' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'golden', label: 'Golden hour' },
  { value: 'moody', label: 'Moody' },
];

// Initial styling selection — everything "leave as-is" except occasion.
const DEFAULT_STYLE = {
  makeup: '',
  bindi: '',
  background: '',
  attire: '',
  attire_color: '',
  aspect: '',
  lighting: '',
};

// Common country codes — India first, then alphabetical by name.
const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+93',  flag: '🇦🇫', name: 'Afghanistan' },
  { code: '+355', flag: '🇦🇱', name: 'Albania' },
  { code: '+213', flag: '🇩🇿', name: 'Algeria' },
  { code: '+376', flag: '🇦🇩', name: 'Andorra' },
  { code: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+374', flag: '🇦🇲', name: 'Armenia' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+375', flag: '🇧🇾', name: 'Belarus' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgium' },
  { code: '+501', flag: '🇧🇿', name: 'Belize' },
  { code: '+229', flag: '🇧🇯', name: 'Benin' },
  { code: '+975', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+673', flag: '🇧🇳', name: 'Brunei' },
  { code: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+1',   flag: '🇨🇦', name: 'Canada' },
  { code: '+238', flag: '🇨🇻', name: 'Cape Verde' },
  { code: '+236', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '+235', flag: '🇹🇩', name: 'Chad' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+269', flag: '🇰🇲', name: 'Comoros' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+385', flag: '🇭🇷', name: 'Croatia' },
  { code: '+53',  flag: '🇨🇺', name: 'Cuba' },
  { code: '+357', flag: '🇨🇾', name: 'Cyprus' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+45',  flag: '🇩🇰', name: 'Denmark' },
  { code: '+253', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+240', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+291', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+372', flag: '🇪🇪', name: 'Estonia' },
  { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+679', flag: '🇫🇯', name: 'Fiji' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+220', flag: '🇬🇲', name: 'Gambia' },
  { code: '+995', flag: '🇬🇪', name: 'Georgia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+30',  flag: '🇬🇷', name: 'Greece' },
  { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+224', flag: '🇬🇳', name: 'Guinea' },
  { code: '+245', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '+592', flag: '🇬🇾', name: 'Guyana' },
  { code: '+509', flag: '🇭🇹', name: 'Haiti' },
  { code: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: '+36',  flag: '🇭🇺', name: 'Hungary' },
  { code: '+354', flag: '🇮🇸', name: 'Iceland' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+98',  flag: '🇮🇷', name: 'Iran' },
  { code: '+964', flag: '🇮🇶', name: 'Iraq' },
  { code: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+225', flag: '🇨🇮', name: 'Ivory Coast' },
  { code: '+1876',flag: '🇯🇲', name: 'Jamaica' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+7',   flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+996', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+856', flag: '🇱🇦', name: 'Laos' },
  { code: '+371', flag: '🇱🇻', name: 'Latvia' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+231', flag: '🇱🇷', name: 'Liberia' },
  { code: '+218', flag: '🇱🇾', name: 'Libya' },
  { code: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+960', flag: '🇲🇻', name: 'Maldives' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+356', flag: '🇲🇹', name: 'Malta' },
  { code: '+222', flag: '🇲🇷', name: 'Mauritania' },
  { code: '+230', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+52',  flag: '🇲🇽', name: 'Mexico' },
  { code: '+373', flag: '🇲🇩', name: 'Moldova' },
  { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+382', flag: '🇲🇪', name: 'Montenegro' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: '+95',  flag: '🇲🇲', name: 'Myanmar' },
  { code: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand' },
  { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+47',  flag: '🇳🇴', name: 'Norway' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+970', flag: '🇵🇸', name: 'Palestine' },
  { code: '+507', flag: '🇵🇦', name: 'Panama' },
  { code: '+675', flag: '🇵🇬', name: 'Papua New Guinea' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
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
  { code: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+252', flag: '🇸🇴', name: 'Somalia' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+211', flag: '🇸🇸', name: 'South Sudan' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+249', flag: '🇸🇩', name: 'Sudan' },
  { code: '+597', flag: '🇸🇷', name: 'Suriname' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
  { code: '+963', flag: '🇸🇾', name: 'Syria' },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { code: '+992', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+1868',flag: '🇹🇹', name: 'Trinidad and Tobago' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+90',  flag: '🇹🇷', name: 'Turkey' },
  { code: '+993', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+998', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
];

// ── Selfie Try-On modal ─────────────────────────────────────────────
// Phase flow:
//   When store.selfie_tryon_tier === 'all':
//     phone (skipped) → input → loading → result | error
//   When tier is 'vip_and_vvip' or 'vvip':
//     phone → checking → [blocked | input] → loading → result | error
export default function TryOnModal({ open, ownerId, product, store, customerName, onClose }) {
  const tier = store?.selfie_tryon_tier || 'all';
  const needsGate = tier !== 'all';

  const [phase, setPhase] = useState(needsGate ? 'phone' : 'input');

  // Phone gate state
  const [countryCode, setCountryCode] = useState('+91');
  const [localNumber, setLocalNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Selfie state
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [occasion, setOccasion] = useState('');
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Result state
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [shareFallback, setShareFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileRef = useRef(null);
  const camRef = useRef(null);
  const phoneRef = useRef(null);
  const dropdownRef = useRef(null);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setPhase(needsGate ? 'phone' : 'input');
      setCountryCode('+91');
      setLocalNumber('');
      setPhoneError('');
      setBlockReason('');
      setShowCountryDropdown(false);
      setCountrySearch('');
      setSelfieFile(null);
      setSelfiePreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
      setOccasion('');
      setStyle(DEFAULT_STYLE);
      setShowAdvanced(false);
      setResult(null);
      setErrorMsg('');
      setShareFallback(false);
      setCopied(false);
    }
  }, [open, needsGate]);

  // Focus phone input when gate opens
  useEffect(() => {
    if (open && phase === 'phone') {
      setTimeout(() => phoneRef.current?.focus(), 80);
    }
  }, [open, phase]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showCountryDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCountryDropdown]);

  // Escape to close modal (not during loading/checking)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && phase !== 'loading' && phase !== 'checking') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, phase, onClose]);

  if (!open) return null;

  // ── Phone gate ───────────────────────────────────────────────────

  // Combine country code + local number into one string for the lookup.
  const fullNumber = countryCode + localNumber.trim();

  const verifyPhone = async () => {
    if (!localNumber.trim()) {
      setPhoneError('Please enter your WhatsApp number.');
      return;
    }
    setPhoneError('');
    setShowCountryDropdown(false);
    setPhase('checking');

    const { allowed, reason } = await checkTryOnAccess(ownerId, fullNumber, tier);

    if (allowed) {
      setPhase('input');
    } else {
      setBlockReason(reason);
      setPhase('blocked');
    }
  };

  const retryPhone = () => {
    setLocalNumber('');
    setPhoneError('');
    setBlockReason('');
    setPhase('phone');
  };

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  // ── Selfie ───────────────────────────────────────────────────────

  const pickSelfie = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieFile(file);
    setSelfiePreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const generate = async () => {
    if (!selfieFile) return;
    setPhase('loading');
    setErrorMsg('');
    const res = await runTryOn({ ownerId, product, selfieFile, occasion, style, customerName });
    if (res.success && res.imageUrl) {
      setResult({ imageUrl: res.imageUrl, caption: res.caption });
      setPhase('result');
    } else {
      setErrorMsg(res.message || 'Could not create your try-on. Please try a clearer, front-facing selfie.');
      setPhase('error');
    }
  };

  const startOver = () => {
    setPhase(needsGate ? 'phone' : 'input');
    setSelfieFile(null);
    setSelfiePreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setOccasion('');
    setStyle(DEFAULT_STYLE);
    setShowAdvanced(false);
    setResult(null);
    setErrorMsg('');
    setShareFallback(false);
    setCountryCode('+91');
    setLocalNumber('');
    setPhoneError('');
    setBlockReason('');
  };

  // ── Share ────────────────────────────────────────────────────────

  const shareTitle = 'My Virtual Try-On';
  const shareText = `Check out how this ${product?.name || 'piece'} looks on me — created with Virtual Try-On!`;

  const handleShare = async () => {
    const url = result?.imageUrl;
    if (!url) return;
    if (navigator.canShare) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], 'tryon.jpg', { type: blob.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: shareTitle, text: shareText });
          return;
        }
      } catch (err) { if (err?.name === 'AbortError') return; }
    }
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, text: shareText, url: result.imageUrl }); return; }
      catch (err) { if (err?.name === 'AbortError') return; }
    }
    setShareFallback(v => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  const waShareUrl = result ? `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${result.imageUrl}`)}` : '#';
  const mailShareUrl = result ? `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${result.imageUrl}`)}` : '#';
  const productImg = product?.primary_image_url || (Array.isArray(product?.images) && product.images[0]) || '';

  // ── Reusable single-select chip group ────────────────────────────────
  const setStyleKey = (key) => (v) => setStyle(s => ({ ...s, [key]: v }));

  const ChipRow = ({ label, options, selected, onSelect }) => (
    <div className="mt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-luxe text-ink-mid">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.value || 'none'}
            type="button"
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
              selected === o.value
                ? 'border-gold-700 bg-gold-700 font-semibold text-white'
                : 'border-line bg-white text-ink-mid hover:border-gold-500 hover:text-ink'
            }`}
            onClick={() => onSelect(o.value)}
          >
            {o.dot && (
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                style={{ background: o.dot }}
              />
            )}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-noir-900/72 p-3 backdrop-blur-md sm:p-6 animate-fadeIn"
      onClick={phase === 'loading' || phase === 'checking' ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Virtual try-on"
    >
      <div
        className="my-4 w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-cream shadow-[0_30px_80px_-20px_rgba(42,33,24,.5)] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-line bg-gradient-to-r from-gold-50 to-cream px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-sheen text-white shadow-gold">
              <Sparkles size={17} />
            </span>
            <h2 className="display text-xl">Virtual Try-On</h2>
          </div>
          {phase !== 'loading' && phase !== 'checking' && (
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-ink-mid transition hover:bg-sand hover:text-ink"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </header>

        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">

          {/* Product strip — shown on all phases except blocked */}
          {phase !== 'blocked' && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
              <img src={productImg} alt={product?.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" draggable={false} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-luxe text-gold-700">Trying on</p>
                <p className="truncate text-sm font-medium text-ink">{product?.name}</p>
              </div>
            </div>
          )}

          {/* ── Phone gate ── */}
          {phase === 'phone' && (
            <>
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4">
                <Lock size={17} className="mt-0.5 shrink-0 text-gold-700" />
                <p className="text-sm leading-relaxed text-ink">
                  Virtual Try-On is <strong>restricted</strong> to eligible customers.
                  Enter your WhatsApp number to verify your access.
                </p>
              </div>

              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-luxe text-ink-mid">
                Your WhatsApp Number
              </label>

              {/* Country code + number input */}
              <div className="flex gap-2">
                {/* Country code selector */}
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    className="flex h-[46px] items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm text-ink transition hover:border-gold-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/15"
                    onClick={() => { setShowCountryDropdown(v => !v); setCountrySearch(''); }}
                    aria-label="Select country code"
                  >
                    <span className="text-base leading-none">
                      {COUNTRY_CODES.find(c => c.code === countryCode)?.flag || '🌐'}
                    </span>
                    <span className="font-medium">{countryCode}</span>
                    <ChevronDown size={13} className={`text-ink-mid transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-lift animate-scaleIn">
                      {/* Search */}
                      <div className="border-b border-line px-3 py-2">
                        <input
                          type="text"
                          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
                          placeholder="Search country…"
                          value={countrySearch}
                          onChange={e => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                          <p className="px-3 py-3 text-center text-sm text-ink-mid">No results</p>
                        ) : filteredCountries.map((c, i) => (
                          <button
                            key={`${c.code}-${c.name}`}
                            type="button"
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-sand ${
                              c.code === countryCode && c.name === (COUNTRY_CODES.find(x => x.code === countryCode)?.name) ? 'bg-gold-50 font-semibold text-gold-700' : 'text-ink'
                            }`}
                            onClick={() => {
                              setCountryCode(c.code);
                              setShowCountryDropdown(false);
                              setCountrySearch('');
                              phoneRef.current?.focus();
                            }}
                          >
                            <span className="text-base">{c.flag}</span>
                            <span className="flex-1 truncate">{c.name}</span>
                            <span className="shrink-0 text-ink-mid">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Local number */}
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 transition focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/15">
                  <Phone size={15} className="shrink-0 text-gold-700" />
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="tel"
                    className="flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-ink-soft"
                    placeholder="98765 43210"
                    value={localNumber}
                    onChange={e => { setLocalNumber(e.target.value); setPhoneError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') verifyPhone(); }}
                  />
                </div>
              </div>

              {phoneError && (
                <p className="mt-2 text-[13px] text-maroon-600">{phoneError}</p>
              )}

              <button
                className="btn-gold mt-5 w-full"
                onClick={verifyPhone}
                disabled={!localNumber.trim()}
              >
                <Sparkles size={16} /> Verify Access
              </button>
              <p className="mt-2.5 text-center text-xs text-ink-soft">
                Your number is used only to verify eligibility.
              </p>
            </>
          )}

          {/* ── Checking ── */}
          {phase === 'checking' && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="spinner" />
              <p className="mt-1 text-sm text-ink-mid">Verifying your access…</p>
            </div>
          )}

          {/* ── Blocked ── */}
          {phase === 'blocked' && (
            <div className="flex flex-col items-center gap-4 px-2 py-6 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-50 text-gold-400">
                <Lock size={32} strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-serif text-lg font-bold text-ink">
                  {blockReason === 'error' ? 'Could Not Verify' : 'Access Not Available'}
                </p>
                <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-ink-mid">
                  {blockReason === 'error'
                    ? "We couldn't verify your number right now. Please try again in a moment."
                    : `This number isn't on our Try-On access list. Please connect with ${store?.store_name || 'the store'} to request access.`}
                </p>
              </div>
              <button className="btn-outline mt-1" onClick={retryPhone}>
                <Phone size={16} /> Try a different number
              </button>
            </div>
          )}

          {/* ── Selfie input ── */}
          {phase === 'input' && (
            <>
              {/* Camera capture (mobile opens the camera directly) */}
              <input ref={camRef} type="file" accept="image/*" capture="user" className="hidden" onChange={pickSelfie} />
              {/* Plain file picker (mobile shows gallery/files, desktop shows file browser) */}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickSelfie} />

              {selfiePreview ? (
                <button
                  type="button"
                  className="grid w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-gold-200 bg-ivory/70 transition hover:border-gold-400 hover:bg-ivory"
                  onClick={() => fileRef.current?.click()}
                >
                  <img src={selfiePreview} alt="Your selfie" className="max-h-64 w-full object-contain" />
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gold-200 bg-ivory/70 px-4 py-8 text-center transition hover:border-gold-400 hover:bg-ivory"
                    onClick={() => camRef.current?.click()}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-gold-100 text-gold-700">
                      <Camera size={26} />
                    </span>
                    <span className="text-sm font-semibold text-ink">Take a selfie</span>
                    <span className="text-xs text-ink-mid">Use your camera</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gold-200 bg-ivory/70 px-4 py-8 text-center transition hover:border-gold-400 hover:bg-ivory"
                    onClick={() => fileRef.current?.click()}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-gold-100 text-gold-700">
                      <Upload size={26} />
                    </span>
                    <span className="text-sm font-semibold text-ink">Upload a photo</span>
                    <span className="text-xs text-ink-mid">From your gallery or files</span>
                  </button>
                </div>
              )}
              {selfiePreview && (
                <div className="mt-2 flex justify-center gap-4">
                  <button className="text-center text-[13px] font-medium text-gold-700 transition hover:text-gold-800" onClick={() => camRef.current?.click()}>
                    Retake selfie
                  </button>
                  <button className="text-center text-[13px] font-medium text-gold-700 transition hover:text-gold-800" onClick={() => fileRef.current?.click()}>
                    Upload a different photo
                  </button>
                </div>
              )}

              {/* Your face always stays yours — these only restyle around it. */}
              <ChipRow label="Styling for" options={OCCASIONS} selected={occasion} onSelect={setOccasion} />
              <ChipRow label="Makeup" options={MAKEUP} selected={style.makeup} onSelect={setStyleKey('makeup')} />
              <ChipRow label="Bindi" options={BINDI} selected={style.bindi} onSelect={setStyleKey('bindi')} />
              <ChipRow label="Background" options={BACKGROUND} selected={style.background} onSelect={setStyleKey('background')} />
              <ChipRow label="Outfit" options={ATTIRE} selected={style.attire} onSelect={setStyleKey('attire')} />
              {style.attire && (
                <ChipRow label="Outfit colour" options={ATTIRE_COLOR} selected={style.attire_color} onSelect={setStyleKey('attire_color')} />
              )}

              {/* Advanced — aspect ratio & lighting */}
              <button
                type="button"
                className="mt-5 flex items-center gap-1 text-[13px] font-semibold text-gold-700 transition hover:text-gold-800"
                onClick={() => setShowAdvanced(v => !v)}
              >
                <ChevronDown size={15} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced options
              </button>
              {showAdvanced && (
                <div className="animate-scaleIn">
                  <ChipRow label="Photo shape" options={ASPECT} selected={style.aspect} onSelect={setStyleKey('aspect')} />
                  <ChipRow label="Lighting / look" options={LIGHTING} selected={style.lighting} onSelect={setStyleKey('lighting')} />
                </div>
              )}

              <button className="btn-gold mt-6 w-full" onClick={generate} disabled={!selfieFile}>
                <Sparkles size={16} /> Create my look
              </button>
              <p className="mt-2.5 text-center text-xs text-ink-soft">
                Your selfie is used only to generate this try-on — your face stays exactly as it is.
              </p>
            </>
          )}

          {/* ── Generating ── */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <div className="spinner" />
              <p className="mt-1 font-serif text-lg font-bold text-ink">Creating your look…</p>
              <p className="max-w-[40ch] text-sm leading-relaxed text-ink-mid">
                This usually takes about 30–40 seconds. Please don&apos;t close this window.
              </p>
            </div>
          )}

          {/* ── Result ── */}
          {phase === 'result' && result && (
            <div className="flex flex-col items-center gap-4">
              <img src={result.imageUrl} alt="Your try-on" className="max-h-[55vh] w-full rounded-2xl object-contain shadow-card" draggable={false} />
              {result.caption && (
                <p className="text-center text-sm italic leading-relaxed text-ink-mid">{result.caption}</p>
              )}
              <div className="flex w-full flex-col gap-2.5 sm:flex-row">
                <button className="btn-gold flex-1" onClick={handleShare}><Share2 size={16} /> Share</button>
                <a className="btn-outline flex-1" href={result.imageUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download size={15} /> Save image
                </a>
              </div>
              {shareFallback && (
                <div className="w-full rounded-2xl border border-line bg-white p-2 animate-scaleIn">
                  <div className="grid grid-cols-3 gap-1.5">
                    <a href={waShareUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-green-600"><MessageCircle size={18} /></span>
                      WhatsApp
                    </a>
                    <a href={mailShareUrl} className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-50 text-gold-700"><Mail size={18} /></span>
                      Email
                    </a>
                    <button onClick={copyLink} className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium text-ink-mid transition hover:bg-sand hover:text-ink">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink">
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </span>
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
              )}
              <button className="text-[13px] font-medium text-gold-700 transition hover:text-gold-800" onClick={startOver}>
                <RefreshCw size={14} className="mr-1 inline" /> Try another selfie
              </button>
            </div>
          )}

          {/* ── Generation error ── */}
          {phase === 'error' && (
            <div className="flex flex-col items-center gap-4 px-4 py-6 text-center">
              <p className="max-w-[44ch] text-sm leading-relaxed text-maroon-600">{errorMsg}</p>
              <button className="btn-gold" onClick={startOver}><RefreshCw size={16} /> Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
