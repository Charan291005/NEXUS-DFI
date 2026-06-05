import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { analysisApi } from '../utils/api';
import { PageHeader, Card, Spinner } from '../components/ui';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  typing?: boolean; // true while typing animation is running
}

const QUICK_PROMPTS = [
  { icon: '🖼️', label: 'Why is this image suspicious?' },
  { icon: '🤖', label: 'Explain deepfake detection findings' },
  { icon: '📋', label: 'Summarize log analysis results' },
  { icon: '🧭', label: 'What are the next investigation steps?' },
  { icon: '🔬', label: 'What is Error Level Analysis (ELA)?' },
  { icon: '📊', label: 'How reliable is the confidence score?' },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: `Based on the available forensic evidence in this case, here is my analysis:

**Key Findings:**
- The suspect image (risk score 78/100) shows clear signs of digital manipulation via Error Level Analysis. Inconsistent JPEG compression artifacts in the lower-right quadrant suggest regions were composited from different source images.
- The video evidence has a 91% deepfake confidence rating. A StyleGAN2 GAN fingerprint was identified, and facial blending artifacts are visible across frames.
- Server logs reveal a sophisticated intrusion pattern: 247 brute-force attempts followed by successful authentication, privilege escalation, and 2.3GB exfiltration.

**Recommended Actions:**
1. Prioritize review of the deepfake video — highest risk item in the case.
2. Isolate affected servers immediately to prevent further data loss.
3. Submit physical copies of storage media to a certified forensics lab.
4. Document chain-of-custody for all 3 pieces of evidence before court proceedings.

Is there a specific module or finding you'd like me to elaborate on?`,
};

function getAIResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('ela') || q.includes('error level')) {
    return `**Error Level Analysis (ELA)** is a forensic technique that identifies areas of different compression levels in a JPEG image.

**How it works:**
When a JPEG image is saved, the compression algorithm applies similar compression across the entire image. If any region has been edited (copy-pasted, cloned, or composited), that region will have a *different compression history* than the rest of the image. ELA re-compresses the image at a known quality level and measures the error — regions with higher error (brighter in ELA visualization) are likely original, while unexpectedly low-error regions suggest tampering.

**In this case:**
The ELA scan of suspect_image_001.jpg shows a risk score of 78/100. The lower-right quadrant displays significantly lower ELA error than surrounding regions, strongly suggesting that portion was inserted from a different source image.

This is a widely accepted technique in digital forensics and courts recognize ELA as admissible supporting evidence.`;
  }
  if (q.includes('deepfake') || q.includes('confidence')) {
    return `**Deepfake Detection Analysis — 91% Confidence**

Our AI model uses a multi-stage detection pipeline:

**Stage 1 — Facial Landmark Analysis:**
Tracks 68 facial landmarks across video frames. Deepfakes often show micro-inconsistencies in landmark positioning between consecutive frames that are imperceptible to humans but detectable by AI.

**Stage 2 — GAN Fingerprint Detection:**
Every AI image generator (GAN) leaves a unique statistical fingerprint in the frequency domain of generated images. In this case, we identified a **StyleGAN2 fingerprint** — a state-of-the-art GAN used for photorealistic face synthesis.

**Stage 3 — Temporal Coherence:**
Real videos maintain consistent skin texture, lighting response, and eye movement patterns over time. The analyzed video shows unnatural blink patterns (0.4x normal rate) and inconsistent skin tone responses to lighting changes.

**Confidence Score Reliability:**
At 91%, the model has very high confidence this is a deepfake. Industry standard threshold for "confirmed deepfake" is typically 85%+. However, for legal proceedings, a second opinion from a certified forensics lab is always recommended.`;
  }
  if (q.includes('log') || q.includes('analysis')) {
    return `**Server Access Log — Forensic Summary**

The log file analysis identified **14 suspicious events** across 4 categories:

**1. Brute Force Attack (High)**
IP 192.168.1.45 attempted 247 failed logins against the admin account in a 3-minute window. This is consistent with automated credential-stuffing tools like Hydra or Medusa.

**2. Successful Compromise (Critical)**
Following the brute-force, a successful authentication occurred — likely using a valid credential obtained from a prior data breach or phishing campaign.

**3. Data Exfiltration (High)**
2.3GB transferred to external IP 185.234.x.x (geolocated: Eastern Europe). Transfer timing (03:46 UTC) aligns with the attacker's active session.

**4. Privilege Escalation (Critical)**
The attacker executed \`sudo -i\` gaining root access — enabling them to access all system files, install rootkits, or modify audit logs.

**Recommended Next Steps:**
- Immediately isolate the affected system
- Preserve the full log file as forensic evidence
- Run memory forensics to check for in-memory rootkits
- Review all systems the compromised account had access to`;
  }
  if (q.includes('next') || q.includes('step')) {
    return `**Recommended Investigation Steps — Priority Order:**

**🔴 IMMEDIATE (Next 2 hours):**
1. Isolate affected server from network to prevent ongoing data loss
2. Preserve volatile memory (RAM dump) before any system restart
3. Revoke all credentials of the compromised admin account
4. Notify management and legal team about potential data breach obligations

**🟠 SHORT-TERM (24-48 hours):**
5. Submit physical storage media to certified forensics lab for chain-of-custody imaging
6. Begin threat intelligence correlation — match 185.234.x.x against known APT infrastructure
7. Conduct network-wide scan for similar compromise indicators (IOCs)
8. Interview the account holder to determine if credentials were phished

**🟡 MEDIUM-TERM (1 week):**
9. Review access control policies across all admin accounts
10. Implement MFA for all privileged accounts immediately
11. Prepare legal evidence package for potential prosecution
12. Draft executive summary report for board briefing

Would you like me to elaborate on any specific step?`;
  }
  return MOCK_RESPONSES.default;
}

// ── Improved markdown renderer ────────────────────────────
function renderMarkdown(text: string): string {
  // Process line by line for list handling
  const lines = text.split('\n');
  let html = '';
  let inUL = false;
  let inOL = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Unordered list item
    const ulMatch = line.match(/^(\s*)[-•]\s+(.+)$/);
    if (ulMatch) {
      if (!inUL) { html += '<ul class="list-disc list-inside space-y-0.5 my-1">'; inUL = true; }
      html += `<li class="text-slate-300">${inlineFormat(ulMatch[2])}</li>`;
      continue;
    } else if (inUL) {
      html += '</ul>'; inUL = false;
    }

    // Ordered list item
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inOL) { html += '<ol class="list-decimal list-inside space-y-0.5 my-1">'; inOL = true; }
      html += `<li class="text-slate-300">${inlineFormat(olMatch[2])}</li>`;
      continue;
    } else if (inOL) {
      html += '</ol>'; inOL = false;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      html += '<hr class="border-slate-700 my-2" />';
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      html += '<br/>';
      continue;
    }

    // Normal line
    html += inlineFormat(line) + '<br/>';
  }

  // Close any open lists
  if (inUL) html += '</ul>';
  if (inOL) html += '</ol>';

  return html;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="mono text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded text-xs">$1</code>');
}

// ── Format timestamp for hover display ────────────────────
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const WELCOME_MESSAGE = `**NexusDFI AI Assistant** — Ready to assist.

I can help you:
- **Explain forensic findings** from image, deepfake, and log analysis
- **Summarize evidence** across your active cases
- **Answer investigation questions** and provide expert recommendations
- **Guide report writing** with technical terminology

Currently analyzing case **NXDFI-2605-4821**. Select a prompt below or ask anything.`;

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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nexus_gemini_key') || '');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('nexus_gemini_key', key);
  };

  // ── Typing animation ──────────────────────────────────
  const typeResponse = useCallback((fullText: string, msgId: number) => {
    let charIndex = 0;
    const speed = 12; // ms per character

    // Add placeholder message
    setMessages(prev => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      typing: true,
    }]);

    typingIntervalRef.current = window.setInterval(() => {
      charIndex += 3; // type 3 chars at a time for speed
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

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: question, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    let response: string;
    try {
      const res = await analysisApi.askAssistant(question, 'Case NXDFI-2605-4821', apiKey);
      response = res.data.response;
    } catch {
      response = getAIResponse(question);
    }

    const aiMsgId = Date.now() + 1;
    typeResponse(response, aiMsgId);
  };

  const clearConversation = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setLoading(false);
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date().toISOString(),
    }]);
  };

  const messageCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="space-y-4 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex justify-between items-start">
        <PageHeader title="AI Assistant" subtitle="Forensics Intelligence Engine" icon="🤖" />
        <div className="flex items-center gap-2">
          {messageCount > 0 && (
            <button
              id="btn-clear-chat"
              onClick={clearConversation}
              className="btn-cyber btn-ghost text-xs py-1.5"
            >
              🗑 Clear
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="btn-cyber btn-ghost text-xs py-1.5">
            ⚙️ API Key
          </button>
        </div>
      </div>

      {showSettings && (
        <Card className="p-4 bg-navy-800/50 border border-accent-500/20">
          <h3 className="text-sm font-semibold text-white mb-2">Configure Gemini AI</h3>
          <p className="text-xs text-navy-300 mb-3">
            Enter your Google Gemini API key for advanced AI analysis. Without it, the assistant uses built-in forensic heuristics.
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="input-cyber w-full max-w-md"
          />
        </Card>
      )}

      {/* Quick prompts — grid of cards */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              id={`quick-prompt-${i}`}
              onClick={() => sendMessage(p.label)}
              className="quick-prompt-card"
            >
              <span className="text-lg flex-shrink-0">{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat area */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'rgba(11,17,32,0.8)' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`chat-msg chat-bubble flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold ${
                msg.role === 'assistant'
                  ? ''
                  : 'bg-navy-700'
              }`}
              style={msg.role === 'assistant' ? { background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)' } : undefined}
            >
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed inline-block text-left ${
                  msg.role === 'assistant'
                    ? 'bg-navy-800 text-navy-200 border border-navy-700/80'
                    : 'text-white border border-accent-400/60'
                }`}
                style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)' } : undefined}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) + (msg.typing ? '<span class="typing-cursor"></span>' : '') }}
              />
              {/* Timestamp — visible on hover */}
              <p className={`chat-timestamp text-[10px] text-navy-500 mono mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {loading && !messages.some(m => m.typing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f6ef7, #3b5ce4)' }}>🤖</div>
            <div className="p-4 rounded-2xl bg-navy-800 border border-navy-700/80">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </Card>

      {/* Input */}
      <div className="flex gap-3 items-center">
        <input
          id="input-assistant"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about your forensic evidence..."
          className="input-cyber flex-1"
          disabled={loading}
        />
        <button
          id="btn-send-message"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="btn-cyber btn-primary px-6"
        >
          {loading ? <Spinner size="sm" /> : '➤'}
        </button>
        <span className="text-[10px] text-navy-500 hidden sm:inline whitespace-nowrap">Enter ↵</span>
      </div>
    </div>
  );
}
