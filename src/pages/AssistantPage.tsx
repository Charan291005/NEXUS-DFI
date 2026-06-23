import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisApi } from '../utils/api';
import { Card, Spinner } from '../components/ui';
import { FiPaperclip, FiSend, FiCpu, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { extractTextFromFile } from '../utils/fileParser';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  typing?: boolean;
}

const QUICK_PROMPTS = [
  { label: 'Explain Error Level Analysis (ELA)' },
  { label: 'Summarize credential stuffing indicators' },
  { label: 'Review deepfake GAN fingerprints' },
  { label: 'Outline chain-of-custody protocols' },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: `I understand this case might be complex, but I'm here to help you navigate it. Based on the available forensic evidence, here is what I found:

**Key Findings:**
- The suspect image displays inconsistent JPEG compression artifacts in the lower-right quadrant, indicating digital manipulation via Error Level Analysis.
- The video evidence yields a 91% deepfake confidence rating. A StyleGAN2 GAN fingerprint was identified.
- Server logs indicate a brute-force attack followed by successful authentication and data exfiltration.

**Recommended Actions:**
1. Isolate affected servers to prevent further data loss.
2. Submit physical copies of storage media to a certified forensics lab.
3. Document chain-of-custody for all evidence artifacts.

Please let me know which specific module or finding you'd like to explore further. I'm ready when you are.`,
};

function getAIResponse(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('ela') || q.includes('error level')) {
    return `I can certainly explain that for you. **Error Level Analysis (ELA)** identifies areas of different compression levels in a JPEG image, which is a fantastic tool for spotting manipulation.

**How it works:**
When a JPEG image is saved, the compression algorithm applies consistent compression across the image. If a region has been edited, it will have a different compression history. ELA re-compresses the image at a known quality level and measures the error — regions with unexpectedly low-error suggest tampering.

**Current Case Context:**
The ELA scan of your suspect image shows a risk score of 78/100. The lower-right quadrant displays significantly lower ELA error. This strongly suggests that portion was inserted from a different source image. 

Is there a specific part of this analysis you'd like me to break down further?`;
  }
  
  return MOCK_RESPONSES.default;
}

// Improved markdown renderer
function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  let html = '';
  let inUL = false;
  let inOL = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const ulMatch = line.match(/^(\s*)[-•]\s+(.+)$/);
    if (ulMatch) {
      if (!inUL) { html += '<ul class="list-disc list-inside space-y-1 my-2 ml-4">'; inUL = true; }
      html += `<li class="text-navy-100">${inlineFormat(ulMatch[2])}</li>`;
      continue;
    } else if (inUL) {
      html += '</ul>'; inUL = false;
    }

    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inOL) { html += '<ol class="list-decimal list-inside space-y-1 my-2 ml-4">'; inOL = true; }
      html += `<li class="text-navy-100">${inlineFormat(olMatch[2])}</li>`;
      continue;
    } else if (inOL) {
      html += '</ol>'; inOL = false;
    }

    if (/^---+$/.test(line.trim())) {
      html += '<hr class="border-navy-700 my-4" />';
      continue;
    }

    if (line.trim() === '') {
      html += '<div class="h-3"></div>';
      continue;
    }

    html += '<p class="mb-2 leading-relaxed">' + inlineFormat(line) + '</p>';
  }

  if (inUL) html += '</ul>';
  if (inOL) html += '</ol>';

  return html;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="mono text-[#c1ff00] bg-[#c1ff00]/10 px-1.5 py-0.5 rounded text-sm border border-[#c1ff00]/20">$1</code>');
}

export default function AssistantPage() {
  const { user } = useAuth();
  const userName = user?.username ? user.username.split('@')[0] : 'Investigator';

  const WELCOME_MESSAGE = `Hello, ${userName}. I am the NexusDFI Forensic Assistant. I know digital investigations can be overwhelming and time-sensitive, so I am here to support you every step of the way. 

I can help you:
- **Analyze and explain** forensic evidence (logs, images, deepfakes)
- **Summarize findings** across your active cases
- **Recommend protocols** for incident response

How can I assist you with your investigation today?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<string>(() => {
    const saved = localStorage.getItem('nexus_ai_provider');
    if (saved) return saved;
    const key = localStorage.getItem('nexus_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY;
    // Default to pollinations since the user wants a free keyless option
    return key ? 'gemini' : 'pollinations';
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nexus_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  
  // File upload state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProvider = (newProv: string) => {
    setProvider(newProv);
    localStorage.setItem('nexus_ai_provider', newProv);
  };
  
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachedFiles]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('nexus_gemini_key', key);
  };

  const copyMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const typeResponse = useCallback((fullText: string, msgId: number) => {
    let charIndex = 0;
    // Faster, smoother typing speed as requested (keep it, but make it fast)
    const speed = 15; // characters per interval
    const intervalMs = 15; 

    setMessages(prev => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      typing: true,
    }]);

    typingIntervalRef.current = window.setInterval(() => {
      charIndex += speed;
      const current = fullText.substring(0, charIndex);

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: current, typing: charIndex < fullText.length } : m
      ));

      if (charIndex >= fullText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setLoading(false);
      }
    }, intervalMs);
  }, []);

  const callAiDirect = useCallback(async (question: string, currentProvider: string, currentApiKey: string): Promise<string> => {
    const prov = currentProvider.toLowerCase();
    const systemPrompt = `You are the NexusDFI Forensic Assistant. Your primary goal is to support the investigator with technical analysis, but you are also a highly capable general-purpose AI. You MUST answer any question the user asks, whether it is about digital forensics, coding, general knowledge, or casual chat. Be highly empathetic, warm, and supportive. Acknowledge the stress of their work, offer clear, structured advice, and be very professional yet human. Use markdown for formatting.`;
    
    if (prov === 'pollinations') {
      try {
        const res = await fetch(
          'https://text.pollinations.ai/',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question }
              ],
              model: 'openai'
            })
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        const backupKey = currentApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
        if (backupKey) {
          return await callAiDirect(question, 'gemini', backupKey);
        }
        throw err;
      }
    }

    if (!currentApiKey) throw new Error('No API key entered');

    if (prov === 'openai') {
      const res = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
            temperature: 0.5, max_tokens: 1024
          })
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    }

    if (prov === 'groq') {
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
            temperature: 0.5, max_tokens: 1024
          })
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    }

    // Default: Gemini
    const NEXUS_PROMPT = `${systemPrompt}\n\nUser question: ${question}`;
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': currentApiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: NEXUS_PROMPT }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
        }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }, []);

  const sendMessage = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && attachedFiles.length === 0) return;
    if (loading) return;

    let finalQuery = textToSend;

    // Process attached files
    if (attachedFiles.length > 0) {
      setLoading(true);
      // We push a temporary loading message for the UI feedback
      setMessages(prev => [...prev, {
        id: Date.now() - 1,
        role: 'assistant',
        content: 'Extracting data from attached files... Please wait.',
        timestamp: new Date().toISOString()
      }]);

      let extractedContext = '';
      for (const file of attachedFiles) {
        const text = await extractTextFromFile(file);
        extractedContext += `\n\n--- Content of ${file.name} ---\n${text}\n---`;
      }

      // Remove the temporary loading message
      setMessages(prev => prev.filter(m => m.content !== 'Extracting data from attached files... Please wait.'));

      finalQuery += `\n\n[Context: The user has attached the following files for you to read. Answer their prompt based on this context.]${extractedContext}`;
    }

    const userMsg: Message = { 
      id: Date.now(), 
      role: 'user', 
      content: textToSend + (attachedFiles.length > 0 ? `\n\n*(Attached ${attachedFiles.length} file(s))*` : ''), 
      timestamp: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFiles([]);
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // reset height
    }

    let response: string;

    if (provider === 'pollinations' || apiKey) {
      try {
        response = await callAiDirect(finalQuery, provider, apiKey);
        setAiLive(true);
        typeResponse(response, Date.now() + 1);
        return;
      } catch (directErr) {
        console.warn('Direct AI call failed:', directErr);
      }
    }

    try {
      const res = await analysisApi.askAssistant(finalQuery, 'Current Investigation Context', apiKey, 'nexus', provider);
      response = res.data.response;
      setAiLive(true);
    } catch {
      response = getAIResponse(finalQuery);
      setAiLive(false);
    }

    typeResponse(response, Date.now() + 1);
  }, [loading, input, attachedFiles, apiKey, provider, callAiDirect, typeResponse]);

  const clearConversation = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setLoading(false);
    setAiLive(null);
    setAttachedFiles([]);
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ── Settings Header ───────────────────────────────── */}
      <div className="flex justify-end items-center gap-2 mb-4 shrink-0">
        {aiLive !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono tracking-wider bg-navy-900 border border-navy-800 text-navy-300">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: aiLive ? '#4ADE80' : '#FBBF24' }} />
            {aiLive ? `${provider.toUpperCase()} CONNECTED` : 'LOCAL CACHE'}
          </div>
        )}
        <button onClick={clearConversation} className="text-xs text-navy-400 hover:text-white px-3 py-1 rounded hover:bg-navy-800 transition-colors">
          New Chat
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className="text-xs text-navy-400 hover:text-white px-3 py-1 rounded hover:bg-navy-800 transition-colors">
          Settings
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden shrink-0 mb-4"
          >
            <Card className="p-4 bg-navy-900/50 border border-navy-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <select
                  value={provider}
                  onChange={(e) => saveProvider(e.target.value)}
                  className="input-cyber max-w-xs text-sm"
                >
                  <option value="pollinations">Pollinations AI (Keyless)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                </select>
                {provider !== 'pollinations' && (
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="API Key"
                    className="input-cyber flex-1 max-w-md"
                  />
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Messages Area (ChatGPT Style) ─────────────── */}
      <div className="flex-1 overflow-y-auto w-full flex justify-center pb-32">
        <div className="w-full max-w-3xl px-4 flex flex-col space-y-8 mt-4">
          
          {messages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#1a2ffb]/20 border border-[#1a2ffb]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <FiCpu className="text-[#1a2ffb] w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={`max-w-[85%] group ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div
                  className={`text-sm md:text-base leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-navy-800 text-white px-5 py-3 rounded-2xl rounded-tr-sm' // User style
                      : 'text-navy-100 pr-4' // AI style (transparent)
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) + (msg.typing ? '<span class="typing-cursor ml-1 inline-block w-2 h-4 bg-white align-middle"></span>' : '') }}
                />
                
                {/* Actions beneath message */}
                {msg.role === 'assistant' && !msg.typing && (
                  <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => copyMessage(msg)}
                      className="flex items-center gap-1 text-xs text-navy-400 hover:text-white"
                    >
                      {copiedId === msg.id ? <FiCheck /> : <FiPaperclip className="rotate-45" />}
                      {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Quick Prompts (only show at start) */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-8">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.label)}
                  className="text-left p-4 rounded-xl border border-navy-700 bg-navy-800/30 hover:bg-navy-800 transition-colors group"
                >
                  <p className="text-sm text-navy-200 group-hover:text-white">{p.label}</p>
                </button>
              ))}
            </div>
          )}
          
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* ── Input Area (Docked at Bottom) ─────────────────── */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 bg-gradient-to-t from-navy-950 via-navy-950/80 to-transparent pt-10 pointer-events-none">
        <div className="w-full max-w-3xl pointer-events-auto flex flex-col gap-2">
          
          {/* File Attachments Preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {attachedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-navy-800 border border-navy-700 rounded-lg px-3 py-1.5 text-xs text-navy-200">
                  <FiPaperclip className="text-navy-400" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-navy-400 hover:text-red-400 ml-1">
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input Box */}
          <div className="relative bg-navy-900 border border-navy-700 rounded-2xl shadow-2xl focus-within:border-navy-500 focus-within:ring-1 focus-within:ring-navy-500 transition-all flex items-end">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              multiple 
            />

            {/* Attach Button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 m-1 text-navy-400 hover:text-white rounded-xl hover:bg-navy-800 transition-colors"
              title="Attach File"
            >
              <FiPaperclip size={20} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or upload evidence..."
              disabled={loading}
              className="flex-1 bg-transparent border-none text-white placeholder-navy-500 resize-none py-4 px-2 max-h-[200px] focus:ring-0 focus:outline-none"
              style={{ minHeight: '56px' }}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && attachedFiles.length === 0)}
              className="p-3 m-1 mx-2 text-white bg-[#1a2ffb] hover:bg-blue-600 disabled:bg-navy-800 disabled:text-navy-500 rounded-xl transition-colors shadow-lg"
            >
              {loading ? <Spinner size="sm" /> : <FiSend size={18} className="ml-0.5" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-navy-500 mt-2">
            NexusDFI AI can make mistakes. Verify critical forensic findings before court submission.
          </p>
        </div>
      </div>
    </div>
  );
}
