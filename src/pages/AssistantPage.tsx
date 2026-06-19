import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisApi } from '../utils/api';
import { PageHeader, Card } from '../components/ui';

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
  default: `Based on the available forensic evidence, here is the analysis:

**Key Findings:**
- The suspect image (risk score 78/100) displays inconsistent JPEG compression artifacts in the lower-right quadrant, indicating digital manipulation via Error Level Analysis.
- The video evidence yields a 91% deepfake confidence rating. A StyleGAN2 GAN fingerprint was identified.
- Server logs indicate a brute-force attack followed by successful authentication and 2.3GB data exfiltration.

**Recommended Actions:**
1. Isolate affected servers to prevent further data loss.
2. Submit physical copies of storage media to a certified forensics lab.
3. Document chain-of-custody for all evidence artifacts.

Please specify a module or finding for further elaboration.`,
};

function getAIResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('ela') || q.includes('error level')) {
    return `**Error Level Analysis (ELA)** identifies areas of different compression levels in a JPEG image.

**Technical Overview:**
When a JPEG image is saved, the compression algorithm applies consistent compression across the image. If a region has been edited (composited), it will have a different compression history. ELA re-compresses the image at a known quality level and measures the error — regions with higher error are likely original, while unexpectedly low-error regions suggest tampering.

**Current Case Context:**
The ELA scan of suspect_image_001.jpg shows a risk score of 78/100. The lower-right quadrant displays significantly lower ELA error, strongly suggesting that portion was inserted from a different source image. This is recognized as admissible supporting evidence in digital forensics.`;
  }
  if (q.includes('deepfake') || q.includes('confidence')) {
    return `**Deepfake Detection Analysis — 91% Confidence**

Our model uses a multi-stage detection pipeline:

**1. Facial Landmark Analysis:**
Tracks 68 facial landmarks. Deepfakes show micro-inconsistencies in landmark positioning between consecutive frames.

**2. GAN Fingerprint Detection:**
Identified a **StyleGAN2 fingerprint** in the frequency domain. GANs leave unique statistical artifacts during synthesis.

**3. Temporal Coherence:**
The analyzed video shows unnatural blink patterns (0.4x normal rate) and inconsistent skin tone responses to lighting changes.

**Reliability:**
At 91%, the model exceeds the industry standard (85%+) for confirmed deepfakes. A secondary review by a certified lab is recommended for legal proceedings.`;
  }
  if (q.includes('log') || q.includes('analysis') || q.includes('credential')) {
    return `**Server Access Log — Forensic Summary**

The log file analysis identified critical events:

**1. Brute Force Attack (High Risk)**
IP 192.168.1.45 attempted 247 failed logins against the admin account in a 3-minute window, consistent with automated credential-stuffing tools.

**2. Successful Compromise (Critical)**
Following the brute-force, successful authentication occurred.

**3. Data Exfiltration (High Risk)**
2.3GB transferred to external IP 185.234.x.x (geolocated: Eastern Europe) at 03:46 UTC.

**4. Privilege Escalation (Critical)**
The attacker executed \`sudo -i\` gaining root access.

**Recommended Actions:**
- Isolate the affected system immediately.
- Preserve the full log file.
- Run memory forensics for in-memory rootkits.`;
  }
  if (q.includes('next') || q.includes('step') || q.includes('protocol')) {
    return `**Recommended Investigation Protocol:**

**Immediate Actions (0-2 hours):**
1. Isolate affected servers from the network to prevent ongoing data loss.
2. Preserve volatile memory (RAM dump) before any system restart.
3. Revoke all credentials of compromised accounts.

**Short-term Actions (24-48 hours):**
4. Submit physical storage media to a certified forensics lab for chain-of-custody imaging.
5. Begin threat intelligence correlation against known APT infrastructure.
6. Conduct network-wide scan for similar compromise indicators (IOCs).

**Medium-term Actions (1 week):**
7. Review access control policies across all admin accounts.
8. Implement MFA for all privileged accounts.
9. Prepare the legal evidence package.`;
  }
  
  return MOCK_RESPONSES.default;
}

// ── Improved markdown renderer ────────────────────────────
function renderMarkdown(text: string): string {
  const lines = text.split('\n');
  let html = '';
  let inUL = false;
  let inOL = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const ulMatch = line.match(/^(\s*)[-•]\s+(.+)$/);
    if (ulMatch) {
      if (!inUL) { html += '<ul class="list-disc list-inside space-y-0.5 my-1">'; inUL = true; }
      html += `<li class="text-navy-200">${inlineFormat(ulMatch[2])}</li>`;
      continue;
    } else if (inUL) {
      html += '</ul>'; inUL = false;
    }

    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inOL) { html += '<ol class="list-decimal list-inside space-y-0.5 my-1">'; inOL = true; }
      html += `<li class="text-navy-200">${inlineFormat(olMatch[2])}</li>`;
      continue;
    } else if (inOL) {
      html += '</ol>'; inOL = false;
    }

    if (/^---+$/.test(line.trim())) {
      html += '<hr class="border-navy-700 my-2" />';
      continue;
    }

    if (line.trim() === '') {
      html += '<br/>';
      continue;
    }

    html += inlineFormat(line) + '<br/>';
  }

  if (inUL) html += '</ul>';
  if (inOL) html += '</ol>';

  return html;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="mono text-accent-400 bg-accent-400/10 px-1.5 py-0.5 rounded text-xs border border-accent-400/20">$1</code>');
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const WELCOME_MESSAGE = `**Forensic Analysis Assistant** — NexusDFI Intelligence Engine
System Online and ready for queries.

Capabilities:
- **Explain forensic findings** from image, deepfake, and log analysis
- **Summarize evidence** across active cases
- **Recommend investigation protocols** based on threat indicators
- **Assist in report generation**

Currently analyzing context for active cases. Select a prompt below or type your query.`;

export default function AssistantPage() {
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
    return key ? 'gemini' : 'pollinations';
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nexus_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [aiLive, setAiLive] = useState<boolean | null>(null);

  const saveProvider = (newProv: string) => {
    setProvider(newProv);
    localStorage.setItem('nexus_ai_provider', newProv);
  };
  
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

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

  const exportChat = () => {
    const text = messages
      .map(m => `[${formatTime(m.timestamp)}] ${m.role === 'assistant' ? 'System' : 'Investigator'}: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusdfi-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeResponse = useCallback((fullText: string, msgId: number) => {
    let charIndex = 0;
    const speed = 8; // Faster, more professional typing speed

    setMessages(prev => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      typing: true,
    }]);

    typingIntervalRef.current = window.setInterval(() => {
      charIndex += 4;
      const current = fullText.substring(0, charIndex);

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: current, typing: charIndex < fullText.length } : m
      ));

      if (charIndex >= fullText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setLoading(false);
      }
    }, speed);
  }, []);

  const callAiDirect = useCallback(async (question: string, currentProvider: string, currentApiKey: string): Promise<string> => {
    const prov = currentProvider.toLowerCase();
    const systemPrompt = `You are a forensic analysis AI assistant for NexusDFI. Be highly professional, concise, and technical. Use bolding for key terms. Provide actionable recommendations. Avoid humor or casual language.`;
    
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
            temperature: 0.3, max_tokens: 1024
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
            temperature: 0.3, max_tokens: 1024
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
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }, []);

  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: question, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let response: string;

    if (provider === 'pollinations' || apiKey) {
      try {
        response = await callAiDirect(question, provider, apiKey);
        setAiLive(true);
        typeResponse(response, Date.now() + 1);
        return;
      } catch (directErr) {
        console.warn('Direct AI call failed:', directErr);
      }
    }

    try {
      const res = await analysisApi.askAssistant(question, 'Current Investigation Context', apiKey, 'nexus', provider);
      response = res.data.response;
      setAiLive(true);
    } catch {
      response = getAIResponse(question);
      setAiLive(false);
    }

    typeResponse(response, Date.now() + 1);
  }, [loading, apiKey, provider, callAiDirect, typeResponse]);

  const clearConversation = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setLoading(false);
    setAiLive(null);
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
    }]);
  };

  const messageCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <PageHeader title="Forensic Analysis Assistant" subtitle="AI-powered investigation context and technical guidance" />
        <div className="flex items-center gap-2 flex-wrap mt-2 lg:mt-0">

          {/* AI status badge */}
          {aiLive !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-semibold font-mono tracking-wider"
              style={aiLive
                ? { background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4ADE80' }
                : { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#FBBF24' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: aiLive ? '#4ADE80' : '#FBBF24' }} />
              {aiLive ? `${provider.toUpperCase()} ONLINE` : 'LOCAL CACHE'}
            </motion.div>
          )}

          {messageCount > 1 && (
            <button onClick={exportChat} className="btn-cyber btn-ghost text-xs py-1.5">Export Log</button>
          )}
          {messageCount > 0 && (
            <button onClick={clearConversation} className="btn-cyber btn-ghost text-xs py-1.5">Clear Session</button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="btn-cyber btn-ghost text-xs py-1.5">Settings</button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="p-4 bg-navy-900/80 border border-navy-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white font-display">Engine Configuration</h3>
                  <p className="text-xs text-navy-400">Select AI provider for analysis.</p>
                </div>
                <select
                  value={provider}
                  onChange={(e) => saveProvider(e.target.value)}
                  className="input-cyber max-w-xs text-xs font-semibold"
                >
                  <option value="pollinations">Pollinations AI (Keyless)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              {provider !== 'pollinations' && (
                <div className="space-y-2 pt-2 border-t border-navy-800">
                  <p className="text-xs text-navy-400">API Key ({provider.toUpperCase()}):</p>
                  <div className="flex gap-2 items-center max-w-md">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => saveApiKey(e.target.value)}
                      placeholder="Enter API Key"
                      className="input-cyber flex-1"
                    />
                    {apiKey && <span className="text-xs text-green-400">✓ Set</span>}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p.label)}
              className="text-left text-xs text-navy-300 p-3 rounded-lg border border-navy-700 bg-navy-900/50 hover:bg-navy-800 hover:text-white transition-colors"
            >
              <span className="text-accent-400 mr-2">▶</span> {p.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Chat area */}
      <Card className="flex-1 overflow-y-auto p-0 flex flex-col bg-navy-950/30">
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.role === 'assistant' 
                    ? 'bg-accent-500/10 border-accent-500/30 text-accent-400 font-mono' 
                    : 'bg-navy-800 border-navy-700 text-navy-300'
                }`}
              >
                {msg.role === 'assistant' ? 'AI' : 'US'}
              </div>

              <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`p-4 rounded-lg text-sm leading-relaxed inline-block text-left border ${
                    msg.role === 'assistant'
                      ? 'bg-navy-900/80 text-navy-200 border-navy-800'
                      : 'bg-accent-600 text-white border-accent-500'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) + (msg.typing ? '<span class="typing-cursor"></span>' : '') }}
                />

                <div className={`flex items-center gap-2 mt-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <p className="text-[10px] text-navy-500 mono">{formatTime(msg.timestamp)}</p>
                  {!msg.typing && (
                    <button
                      onClick={() => copyMessage(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-navy-400 hover:text-white"
                    >
                      {copiedId === msg.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-navy-800 bg-navy-900/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask for analysis, summarization, or investigation protocols..."
              disabled={loading}
              className="input-cyber flex-1 bg-navy-950"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="btn-cyber btn-primary px-6"
            >
              Send
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
