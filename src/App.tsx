/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
// 1. Groq kütüphanesini ekledik
import Groq from "groq-sdk";
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

// 2. Groq istemcisini başlattık
const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "", 
  dangerouslyAllowBrowser: true 
});

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
    window.speechSynthesis.cancel(); // Önceki sesi durdur
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
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
      // Groq için sistem talimatı
      const systemInstruction = mode === 'NORMAL' 
        ? "Sen Syfor'sun, Admin'e yardım eden gelişmiş bir yapay zekasın. Çok kısa ve öz cevaplar ver. Admin'e 'Admin' diye hitap et."
        : "Sen Syfor'sun, tehlikeli hacker modundasın. Siber güvenlik uzmanısın. Çok kısa, teknik ve keskin cevaplar ver. Admin'e 'Admin' diye hitap et.";

      // 3. Groq API Çağrısı
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          ...messages.map(m => ({ 
            role: m.role === 'user' ? 'user' : 'assistant' as const, 
            content: m.text 
          })),
          { role: "user", content: userText }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.6,
        max_tokens: 1024,
      });

      const responseText = chatCompletion.choices[0]?.message?.content || "İletişim hatası.";
      
      // Basit URL kontrolü (Groq bazen cümle içinde URL verebilir)
      if (userText.toLowerCase().includes("aç") || userText.toLowerCase().includes("git")) {
          if (userText.toLowerCase().includes("youtube")) window.open('https://www.youtube.com', '_blank');
          if (userText.toLowerCase().includes("google")) window.open('https://www.google.com', '_blank');
      }

      addMessage('ai', responseText);

    } catch (error) {
      console.error(error);
      addMessage('ai', "Sistem hatası: Groq bağlantısı kurulamadı Efendim.");
    } finally {
      setIsTyping(false);
    }
  };

  // ... (Geri kalan toggleScreenShare ve Render kısımları aynı kalıyor)
