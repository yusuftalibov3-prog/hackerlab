/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Terminal, 
  Shield, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Lock, 
  Unlock,
  Send,
  Cpu,
  Activity,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

type Message = {
  role: 'user' | 'ai';
  text: string;
};

type Mode = 'NORMAL' | 'DANGEROUS';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('NORMAL');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CORRECT_PASSWORD = '20110928';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      addMessage('ai', 'Erişim onaylandı. Tekrar hoş geldin Admin. Syfor OS başlatıldı.');
    } else {
      alert('ERİŞİM REDDEDİLDİ: GEÇERSİZ KİMLİK BİLGİLERİ');
      setPassword('');
    }
  };

  const addMessage = (role: 'user' | 'ai', text: string) => {
    setMessages(prev => [...prev, { role, text }]);
    if (role === 'ai' && isVoiceEnabled) {
      speak(text);
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR'; // Default to Turkish as requested
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Ses tanıma bu tarayıcıda desteklenmiyor.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };
    recognition.start();
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userText = textToSend;
    setInput('');
    addMessage('user', userText);
    setIsTyping(true);

    try {
      const systemInstruction = mode === 'NORMAL' 
        ? "Sen Syfor'sun, Admin'e yardım eden gelişmiş bir yapay zekasın. Gereksiz konuşmalardan kaçın, sadece sorulanlara kısa ve öz cevaplar ver. Admin'e 'Admin' diye hitap et."
        : "Sen Syfor'sun, tehlikeli hacker modundasın. Siber güvenlik ve yazılım konularında uzmansın. Çok kısa, keskin ve teknik cevaplar ver. Gereksiz nezaket veya açıklamalardan kaçın. Admin'e 'Admin' diye hitap et.";

      const model = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userText }] }],
        config: {
          systemInstruction,
        }
      });

      const responseText = model.text || "İletişim hatası oluştu.";
      addMessage('ai', responseText);
    } catch (error) {
      console.error(error);
      addMessage('ai', "Sistem hatası: Gemini API bağlantısı kurulamadı.");
    } finally {
      setIsTyping(false);
    }
  };

  const toggleScreenShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500 p-4 crt-effect">
        <div className="matrix-bg" />
        <div className="scanline" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border border-green-500/30 p-8 rounded-lg bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.15)] relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 border-2 border-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]">
              <Lock size={40} />
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase glow-text">Syfor OS Giriş</h1>
            <p className="text-xs opacity-50 mt-2">Kısıtlı Erişim - Sadece Admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase mb-2 opacity-70 tracking-[0.2em]">Erişim Anahtarı Gerekli</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-green-500/50 p-3 rounded outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all text-center tracking-[1em] text-xl"
                placeholder="********"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded transition-all uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
            >
              <Unlock size={18} /> Kimlik Doğrula
            </button>
          </form>
          
          <div className="mt-8 text-[10px] opacity-30 text-center font-bold">
            SİSTEM_KİMLİĞİ: SYFOR-V3.1-PRO <br />
            ŞİFRELEME: AES-256-GCM <br />
            <span className="animate-pulse">GİRİŞ BEKLENİYOR...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-green-500 font-mono flex flex-col overflow-hidden transition-colors duration-500 ${mode === 'DANGEROUS' ? 'bg-[#100000]' : 'bg-[#050505]'}`}>
      <div className="matrix-bg" />
      <div className="scanline" />
      
      {/* Header */}
      <header className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-md z-10 transition-colors duration-500 ${
        mode === 'DANGEROUS' ? 'border-red-500/30 bg-red-950/10' : 'border-green-500/20 bg-black/80'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu className={`${mode === 'DANGEROUS' ? 'text-red-500' : 'text-green-400'} animate-pulse`} size={24} />
            <span className={`text-xl font-bold tracking-tighter ${mode === 'DANGEROUS' ? 'glow-text-red text-red-500' : 'glow-text'}`}>
              SYFOR<span className={mode === 'DANGEROUS' ? 'text-red-300/50' : 'text-green-300/50'}>_OS</span>
            </span>
          </div>
          <div className={`h-4 w-[1px] mx-2 ${mode === 'DANGEROUS' ? 'bg-red-500/20' : 'bg-green-500/20'}`} />
          <div className="flex items-center gap-3 text-xs opacity-70">
            <div className="flex items-center gap-1">
              <Activity size={12} />
              <span>CPU: {mode === 'DANGEROUS' ? '45%' : '12%'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} />
              <span>LATENCY: {mode === 'DANGEROUS' ? '8ms' : '24ms'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMode(mode === 'NORMAL' ? 'DANGEROUS' : 'NORMAL')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              mode === 'DANGEROUS' 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-green-500/10 border-green-500 text-green-500'
            }`}
          >
            {mode === 'DANGEROUS' ? <ShieldAlert size={14} /> : <Shield size={14} />}
            {mode === 'DANGEROUS' ? 'TEHLİKELİ' : 'NORMAL'} MOD
          </button>
          <button 
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-full transition-colors ${mode === 'DANGEROUS' ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-green-500/10 text-green-500'}`}
          >
            {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4 z-10">
        {/* Left Panel: Terminal Chat */}
        <div className={`flex-1 flex flex-col border rounded-lg backdrop-blur-sm overflow-hidden transition-colors duration-500 ${
          mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-950/5' : 'border-green-500/20 bg-black/40'
        }`}>
          <div className={`flex items-center justify-between px-4 py-2 border-b transition-colors duration-500 ${
            mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-500/5' : 'border-green-500/20 bg-green-500/5'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-bold ${mode === 'DANGEROUS' ? 'text-red-500' : ''}`}>
              <Terminal size={14} />
              SYFOR_TERMİNAL_V1.0
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-green-500/20"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`text-[10px] uppercase mb-1 opacity-50 flex items-center gap-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'user' ? 'Admin' : 'Syfor'}
                    <span className="text-[8px]">• {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed border transition-colors duration-500 ${
                    msg.role === 'user' 
                      ? (mode === 'DANGEROUS' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-green-500/10 border-green-500/20 text-green-300')
                      : (mode === 'DANGEROUS' ? 'bg-white/5 border-white/5 text-red-400' : 'bg-white/5 border-white/5 text-green-400')
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className={`flex items-center gap-2 text-xs italic ${mode === 'DANGEROUS' ? 'text-red-500/50' : 'text-green-500/50'}`}>
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className={`w-1 h-1 rounded-full ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className={`w-1 h-1 rounded-full ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'}`} />
                  <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className={`w-1 h-1 rounded-full ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
                Syfor işliyor...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t transition-colors duration-500 ${
            mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-950/20' : 'border-green-500/20 bg-black/60'
          }`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={startListening}
                className={`p-3 rounded-full transition-all ${
                  isListening 
                    ? 'bg-red-500/20 text-red-500 animate-pulse' 
                    : (mode === 'DANGEROUS' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20')
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Komut veya sorgu girin..."
                  className={`w-full bg-black/50 border p-3 pr-12 rounded-lg outline-none transition-all ${
                    mode === 'DANGEROUS' ? 'border-red-500/30 focus:border-red-500/60 text-red-400' : 'border-green-500/30 focus:border-green-500/60 text-green-400'
                  }`}
                />
                <button 
                  onClick={() => handleSend()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-colors ${
                    mode === 'DANGEROUS' ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Tools & Monitoring */}
        <div className="w-80 flex flex-col gap-4">
          {/* Screen Share Widget */}
          <div className={`flex-1 border rounded-lg backdrop-blur-sm overflow-hidden flex flex-col transition-colors duration-500 ${
            mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-950/5' : 'border-green-500/20 bg-black/40'
          }`}>
            <div className={`px-4 py-2 border-b flex items-center justify-between transition-colors duration-500 ${
              mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-500/5' : 'border-green-500/20 bg-green-500/5'
            }`}>
              <div className={`flex items-center gap-2 text-xs font-bold ${mode === 'DANGEROUS' ? 'text-red-500' : ''}`}>
                <Monitor size={14} />
                EKRAN_AYNASI
              </div>
              <button 
                onClick={toggleScreenShare}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  screenStream ? 'border-red-500 text-red-500' : (mode === 'DANGEROUS' ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500')
                }`}
              >
                {screenStream ? 'DURDUR' : 'BAŞLAT'}
              </button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center relative group">
              {screenStream ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className={`text-center p-6 opacity-30 ${mode === 'DANGEROUS' ? 'text-red-500' : ''}`}>
                  <Monitor size={48} className="mx-auto mb-4" />
                  <p className="text-xs">Aktif ekran yayını yok</p>
                </div>
              )}
              {screenStream && (
                <div className={`absolute inset-0 pointer-events-none border-2 ${mode === 'DANGEROUS' ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`} />
              )}
            </div>
          </div>

          {/* System Stats Widget */}
          <div className={`h-48 border rounded-lg backdrop-blur-sm p-4 flex flex-col gap-3 transition-colors duration-500 ${
            mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-950/5' : 'border-green-500/20 bg-black/40'
          }`}>
            <div className={`text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2 ${mode === 'DANGEROUS' ? 'text-red-500' : ''}`}>
              <Activity size={14} />
              Sistem_Bütünlüğü
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Güvenlik Duvarı</span>
                  <span className={mode === 'DANGEROUS' ? 'text-red-400' : 'text-green-400'}>{mode === 'DANGEROUS' ? 'DEVRE DIŞI' : 'Aktif'}</span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${mode === 'DANGEROUS' ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                  <motion.div 
                    animate={{ width: mode === 'DANGEROUS' ? ['40%', '45%', '42%'] : ['90%', '95%', '92%'] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`h-full ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'}`} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Şifreleme</span>
                  <span className={mode === 'DANGEROUS' ? 'text-red-400' : 'text-green-400'}>AES-256</span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${mode === 'DANGEROUS' ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                  <div className={`h-full w-full ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'}`} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Tehdit Seviyesi</span>
                  <span className={mode === 'DANGEROUS' ? 'text-red-500' : 'text-green-400'}>
                    {mode === 'DANGEROUS' ? 'KRİTİK' : 'DÜŞÜK'}
                  </span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${mode === 'DANGEROUS' ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                  <motion.div 
                    animate={{ 
                      width: mode === 'DANGEROUS' ? '85%' : '15%',
                      backgroundColor: mode === 'DANGEROUS' ? '#ef4444' : '#22c55e'
                    }}
                    className="h-full" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className={`h-8 border-t bg-black flex items-center justify-between px-6 text-[10px] uppercase tracking-widest opacity-50 transition-colors duration-500 ${
        mode === 'DANGEROUS' ? 'border-red-500/20 text-red-500' : 'border-green-500/20 text-green-500'
      }`}>
        <div className="flex gap-6">
          <span>Durum: Çevrimiçi</span>
          <span>Kullanıcı: Admin</span>
          <span>Konum: Şifreli</span>
        </div>
        <div className="flex gap-6">
          <span>Syfor OS v3.1.0-stable</span>
          <span className="animate-pulse">● Canlı Bağlantı</span>
        </div>
      </footer>
    </div>
  );
}
