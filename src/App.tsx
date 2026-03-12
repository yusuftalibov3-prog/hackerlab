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
  Zap,
  ChevronRight,
  Command,
  Settings,
  Database,
  Wifi,
  AlertTriangle,
  Layers,
  Globe,
  Radio,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// API Configuration
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenAI(apiKey);

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
          ? "Sen Syfor'sun. Admin'e yardım et. Cevapların kısa, öz ve anlamlı olsun." 
          : "Sen Syfor'sun, TEHLİKELİ MODDASIN. Cevapların teknik, çok kısa ve sert olsun."
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
      addMessage('model', "SİSTEM HATASI: API bağlantısı başarısız.");
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-green-500 p-4 relative overflow-hidden">
        <div className="matrix-bg fixed inset-0 opacity-20" />
        <div className="scanline fixed inset-0 pointer-events-none" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md border-4 border-double border-green-500/30 p-8 rounded-lg bg-black/90 backdrop-blur-xl shadow-[0_0_50px_rgba(34,197,94,0.2)] relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 border-2 border-green-500 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.6)]">
              <Lock size={48} />
            </div>
            <h1 className="text-3xl font-black tracking-[0.2em] uppercase text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]">Syfor OS</h1>
            <div className="text-[10px] mt-4 opacity-50 tracking-[0.5em] animate-pulse underline decoration-green-500/30">ENCRYPTED TERMINAL V2.4</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-green-500 opacity-20 group-hover:opacity-40 rounded transition blur" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="relative w-full bg-black border border-green-500/50 p-5 rounded outline-none text-center tracking-[1.2em] text-2xl focus:border-green-400 transition-all text-green-400" placeholder="••••••••" autoFocus />
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-400 text-black font-black py-5 rounded transition-all uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-95">
              <Unlock size={20} /> AUTHENTICATE
            </button>
          </form>
          <div className="mt-8 text-center text-[8px] opacity-30 flex justify-between px-2 font-black">
             <span>LOCAL_IP: 127.0.0.1</span>
             <span>PORT: 8080</span>
             <span>SEC: AES-256</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-green-500 font-mono flex flex-col overflow-hidden transition-colors duration-1000 ${mode === 'DANGEROUS' ? 'bg-[#0a0000]' : 'bg-[#020202]'}`}>
      <div className="scanline fixed inset-0 pointer-events-none z-50 opacity-10" />
      
      {/* Top Navigation */}
      <header className={`h-14 border-b flex items-center justify-between px-6 backdrop-blur-xl z-20 relative ${mode === 'DANGEROUS' ? 'border-red-900 bg-red-950/20 shadow-[0_0_30px_rgba(255,0,0,0.1)]' : 'border-green-900/30 bg-black/90'}`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-none">
            <div className="relative">
               <Cpu className={`${mode === 'DANGEROUS' ? 'text-red-500' : 'text-green-400'} animate-spin-slow`} size={22} />
               <div className={`absolute inset-0 animate-ping opacity-20 rounded-full ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'}`} />
            </div>
            <span className={`text-xl font-black tracking-tighter italic ${mode === 'DANGEROUS' ? 'text-red-600 drop-shadow-[0_0_8px_red]' : 'text-green-500 drop-shadow-[0_0_8px_#22c55e]'}`}>SYFOR_OS // CORE</span>
          </div>
          <div className="hidden xl:flex items-center gap-6 text-[9px] font-bold tracking-widest opacity-40">
             <div className="flex items-center gap-2"><Activity size={12} className="text-green-500" /> SYSTEM_STABLE</div>
             <div className="flex items-center gap-2"><Database size={12} className="text-blue-500" /> DB_CONNECTED</div>
             <div className="flex items-center gap-2"><Globe size={12} className="text-purple-500" /> GLOBAL_UPLINK</div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex gap-2 mr-4">
             <div className={`w-1 h-4 ${mode === 'DANGEROUS' ? 'bg-red-900' : 'bg-green-900'} animate-pulse`} />
             <div className={`w-1 h-4 ${mode === 'DANGEROUS' ? 'bg-red-700' : 'bg-green-700'} animate-pulse delay-75`} />
             <div className={`w-1 h-4 ${mode === 'DANGEROUS' ? 'bg-red-500' : 'bg-green-500'} animate-pulse delay-150`} />
          </div>
          <button onClick={() => setMode(mode === 'NORMAL' ? 'DANGEROUS' : 'NORMAL')} className={`px-6 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] border-2 transition-all duration-500 ${mode === 'DANGEROUS' ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_red]' : 'bg-transparent border-green-500/50 text-green-500 hover:bg-green-500/20'}`}>
            {mode === 'DANGEROUS' ? 'SYSTEM_OVERRIDE_ACTIVE' : 'SECURITY_LEVEL: NORMAL'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-3 gap-3 z-10 relative">
        {/* Left Stats Column */}
        <div className="hidden lg:flex w-16 flex-col items-center py-4 gap-8 border-r border-white/5 bg-black/20">
           <Monitor size={20} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
           <Radio size={20} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
           <Layers size={20} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
           <Share2 size={20} className="opacity-40 hover:opacity-100 transition-opacity cursor-pointer" />
           <div className="mt-auto mb-4 flex flex-col gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 opacity-50" />
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-50" />
           </div>
        </div>

        {/* Center: Main Terminal */}
        <div className={`flex-[3] flex flex-col border rounded-sm backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-500 ${mode === 'DANGEROUS' ? 'border-red-900/50 bg-red-950/5 shadow-red-900/10' : 'border-green-900/20 bg-black/60'}`}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                 <Terminal size={100} />
                 <span className="text-xl font-black tracking-[1em]">READY_FOR_COMMAND</span>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] group`}>
                     <div className={`text-[8px] font-black mb-2 flex items-center gap-2 ${msg.role === 'user' ? 'justify-end text-green-700' : 'text-blue-700'}`}>
                        {msg.role === 'user' ? (
                          <><span>ADMIN@SYFOR_OS</span><Command size={10}/></>
                        ) : (
                          <><Zap size={10}/><span>CORE_ENGINE_V4</span></>
                        )}
                     </div>
                     <div className={`p-5 rounded-sm text-sm leading-relaxed border shadow-lg ${msg.role === 'user' ? (mode === 'DANGEROUS' ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-green-500/10 border-green-500/40 text-green-300') : 'bg-white/5 border-white/5 text-green-100 shadow-white/5'}`}>
                       {msg.text}
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTyping && (
              <div className="flex items-center gap-3 text-[10px] font-black animate-pulse text-blue-500 tracking-widest">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                PROCESSING_NEURAL_UPLINK...
              </div>
            )}
          </div>

          <div className={`p-6 border-t ${mode === 'DANGEROUS' ? 'border-red-900/50 bg-red-950/20' : 'border-green-950/30 bg-black/80'}`}>
            <div className="flex items-center gap-4 relative group">
              <ChevronRight size={20} className="absolute left-4 opacity-20 group-focus-within:opacity-100 transition-opacity" />
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="ENTER SYSTEM COMMAND_..." className="flex-1 bg-black border border-white/5 p-5 pl-12 rounded-sm outline-none text-green-500 focus:border-green-500/40 transition-all font-black tracking-widest placeholder:opacity-10 uppercase" />
              <div className="flex items-center gap-2">
                <button onClick={() => setInput('')} className="p-3 opacity-20 hover:opacity-100 transition-opacity"><VolumeX size={18}/></button>
                <button onClick={() => handleSend()} className={`p-4 rounded-sm transition-all shadow-lg ${mode === 'DANGEROUS' ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-500/20' : 'bg-green-600 text-black hover:bg-green-400 shadow-green-500/20'}`}>
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="hidden lg:flex flex-1 flex-col gap-3">
          {/* System Monitor Area */}
          <div className="flex-1 border border-white/5 rounded-sm bg-black/40 p-5 flex flex-col relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-[10px] font-black opacity-50 uppercase tracking-[0.2em]"><Activity size={14} className="text-green-500" /> Live Status</div>
                <div className="text-[8px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full animate-pulse">99% LOAD</div>
             </div>
             
             <div className="space-y-6 flex-1">
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] opacity-40 font-black"><span>NEURAL_ENGINE</span><span>STABLE</span></div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className="h-full bg-green-500 shadow-[0_0_10px_#22c55e]" /></div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[9px] opacity-40 font-black"><span>DATA_STREAM</span><span>HIGH</span></div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "94%" }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" /></div>
                </div>
                <div className="h-32 bg-black/40 border border-white/5 rounded-sm p-2 overflow-hidden flex items-end gap-[2px]">
                   {[...Array(30)].map((_, i) => (
                     <motion.div key={i} animate={{ height: [`${Math.random() * 100}%`, `${Math.random() * 100}%`] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.05 }} className={`flex-1 ${mode === 'DANGEROUS' ? 'bg-red-500/20' : 'bg-green-500/20'}`} />
                   ))}
                </div>
             </div>

             <div className="mt-6 grid grid-cols-2 gap-2 font-black text-center">
                <div className="p-3 bg-white/5 border border-white/5 rounded-sm"><div className="text-[8px] opacity-30 mb-1">CPU_T</div><div className="text-sm text-orange-500">38°C</div></div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-sm"><div className="text-[8px] opacity-30 mb-1">RAM_U</div><div className="text-sm text-blue-500">12.4GB</div></div>
             </div>
          </div>

          {/* Warning/Alert Panel */}
          <div className={`h-40 border rounded-sm p-5 flex flex-col justify-center items-center text-center transition-colors duration-500 ${mode === 'DANGEROUS' ? 'bg-red-600/10 border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.1)]' : 'bg-white/5 border-white/5'}`}>
             <AlertTriangle className={`mb-3 ${mode === 'DANGEROUS' ? 'text-red-500 animate-bounce' : 'text-yellow-600 animate-pulse'}`} size={30} />
             <div className={`text-[11px] font-black uppercase tracking-widest ${mode === 'DANGEROUS' ? 'text-red-500' : 'text-yellow-600'}`}>
                {mode === 'DANGEROUS' ? 'Lethal Protocols Initialized' : 'System Guard: Active'}
             </div>
             <div className="text-[8px] opacity-30 mt-3 leading-relaxed uppercase">
                {mode === 'DANGEROUS' ? 'Encryption keys purged. Root access restricted. Caution advised.' : 'All security layers are functional. No breaches detected.'}
             </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-10 border-t border-white/5 bg-black/95 px-6 flex items-center justify-between text-[8px] font-black opacity-40 tracking-[0.3em] uppercase z-20">
        <div className="flex gap-10">
          <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> CONNECTION: SECURE_AES_256</div>
          <div className="flex items-center gap-2 font-mono italic underline decoration-green-900">KERNEL_V4_STABLE_BUILD_X90</div>
        </div>
        <div className="flex gap-8">
          <span className="hover:text-green-500 transition-colors cursor-help">NODE: ISTANBUL_CENTER</span>
          <span className="animate-pulse flex items-center gap-2">● SYSTEM_UPTIME: 14:22:09</span>
        </div>
      </footer>
    </div>
  );
}

