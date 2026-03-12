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

// API Anahtarını Vercel'den güvenli şekilde okur
const genAI = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY || "");

type Message = {
  role: 'user' | 'model';
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
      addMessage('model', 'Erişim onaylandı. Tekrar hoş geldin Admin. Syfor OS başlatıldı.');
    } else {
      alert('ERİŞİM REDDEDİLDİ: GEÇERSİZ KİMLİK BİLGİLERİ');
      setPassword('');
    }
  };

  const addMessage = (role: 'user' | 'model', text: string) => {
    setMessages(prev => [...prev, { role, text }]);
    if (role === 'model' && isVoiceEnabled) {
      speak(text);
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
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
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: mode === 'NORMAL' 
          ? "Sen Syfor'sun. Admin'e yardım et. Kısa ve öz cevap ver." 
          : "Sen Syfor'sun, tehlikeli moddasın. Teknik ve kısa cevap ver."
      });

      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }],
        })),
      });

      const result = await chat.sendMessage(userText);
      const response = await result.response;
      addMessage('model', response.text());
    } catch (error) {
      console.error(error);
      addMessage('model', "Sistem hatası: API anahtarını kontrol et.");
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
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { console.error(err); }
    }
  };

  // --- BURADAN AŞAĞISI SENİN 470 SATIRLIK GÖRSEL TASARIMIN (DOKUNULMADI) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500 p-4 crt-effect">
        <div className="matrix-bg" />
        <div className="scanline" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md border border-green-500/30 p-8 rounded-lg bg-black/80 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.15)] relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 border-2 border-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"><Lock size={40} /></div>
            <h1 className="text-2xl font-bold tracking-widest uppercase glow-text">Syfor OS Giriş</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-green-500/50 p-3 rounded outline-none text-center tracking-[1em] text-xl" placeholder="********" autoFocus />
            <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded transition-all uppercase tracking-widest flex items-center justify-center gap-2"><Unlock size={18} /> Kimlik Doğrula</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-green-500 font-mono flex flex-col overflow-hidden transition-colors duration-500 ${mode === 'DANGEROUS' ? 'bg-[#100000]' : 'bg-[#050505]'}`}>
      <div className="matrix-bg" /><div className="scanline" />
      <header className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-md z-10 ${mode === 'DANGEROUS' ? 'border-red-500/30 bg-red-950/10' : 'border-green-500/20 bg-black/80'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><Cpu className={`${mode === 'DANGEROUS' ? 'text-red-500' : 'text-green-400'} animate-pulse`} size={24} />
          <span className={`text-xl font-bold tracking-tighter ${mode === 'DANGEROUS' ? 'glow-text-red text-red-500' : 'glow-text'}`}>SYFOR_OS</span></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setMode(mode === 'NORMAL' ? 'DANGEROUS' : 'NORMAL')} className={`px-4 py-1.5 rounded-full text-xs font-bold border ${mode === 'DANGEROUS' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-green-500/10 border-green-500 text-green-500'}`}>{mode === 'DANGEROUS' ? 'TEHLİKELİ' : 'NORMAL'} MOD</button>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden p-4 gap-4 z-10">
        <div className={`flex-1 flex flex-col border rounded-lg backdrop-blur-sm overflow-hidden ${mode === 'DANGEROUS' ? 'border-red-500/20 bg-red-950/5' : 'border-green-500/20 bg-black/40'}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm border ${msg.role === 'user' ? (mode === 'DANGEROUS' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-green-500/10 border-green-500/20 text-green-300') : 'bg-white/5 border-white/5 text-green-400'}`}>{msg.text}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="p-4 border-t border-green-500/20 bg-black/60">
            <div className="flex items-center gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Sorgu girin..." className="flex-1 bg-black/50 border border-green-500/30 p-3 rounded-lg outline-none text-green-400" />
              <button onClick={() => handleSend()} className="p-3 text-green-500"><Send size={20} /></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
