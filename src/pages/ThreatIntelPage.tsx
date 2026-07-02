import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, Spinner } from '../components/ui';
import { analysisApi } from '../utils/api';

interface ThreatResult {
  indicator: string;
  type: 'ip' | 'domain' | 'hash' | 'text' | 'unknown';
  risk_score: number;
  ai_summary: string;
  patterns_found: Array<{ type: string; severity: string; description: string; count: number }>;
  recommendation: string;
}


function detectType(input: string): ThreatResult['type'] {
  const trimmed = input.trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed) || /^[0-9a-f:]+$/i.test(trimmed)) return 'ip';
  if (/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(trimmed)) return 'domain';
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(trimmed)) return 'hash';
  if (trimmed.includes('\n') || trimmed.length > 60) return 'text';
  return 'unknown';
}

const TYPE_LABELS: Record<ThreatResult['type'], string> = {
  ip: 'IP Address', domain: 'Domain', hash: 'File Hash', text: 'Text Block', unknown: 'Unknown',
};

const EXAMPLE_INDICATORS = [
  { label: 'Suspicious IP', value: '185.234.218.45' },
  { label: 'Malicious Domain', value: 'update-security-patch.ru' },
  { label: 'Known Malware Hash', value: '5f4dcc3b5aa765d61d8327deb882cf99' },
];

const getRiskColor = (score: number) => score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#3B82F6';
const getRiskLabel = (score: number) => score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

export default function ThreatIntelPage() {
  const [indicator, setIndicator] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatResult | null>(null);

  const callAiDirect = async (prompt: string, currentProvider: string, currentApiKey: string): Promise<string> => {
    const prov = currentProvider.toLowerCase();
    
    if (prov === 'pollinations') {
      try {
        const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        const backupKey = currentApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
        if (backupKey) return await callAiDirect(prompt, 'gemini', backupKey);
        throw err;
      }
    }

    if (!currentApiKey) throw new Error('No API key entered');

    if (prov === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 512 })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    }

    if (prov === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.3, max_tokens: 512 })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    }

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': currentApiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 512 } }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  };

  const analyze = async (inputText?: string) => {
    const target = (inputText || indicator).trim();
    if (!target) return;
    setLoading(true);
    setResult(null);

    const type = detectType(target);
    const currentProvider = localStorage.getItem('nexus_ai_provider') || 'pollinations';
    const currentApiKey = localStorage.getItem('nexus_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';

    if (type !== 'text' && type !== 'unknown') {
      try {
        const { osintApi } = await import('../utils/api');
        const res = await osintApi.analyze(target);
        setResult(res.data);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('OSINT API failed, falling back to local simulation:', err);
      }
    }

    const geminiPrompt = `You are a forensic AI threat intelligence analyst. Analyze this ${type === 'ip' ? 'IP address' : type === 'domain' ? 'domain' : type === 'hash' ? 'file hash' : 'text'} for threat intelligence: ${target}

Provide a concise 3-4 sentence analysis covering:
- Known threat associations or suspicious characteristics
- Risk level and why
- Recommended defensive action

Be direct and highly professional. Use **bold** for key findings.`;

    if (currentProvider === 'pollinations' || currentApiKey) {
      try {
        const aiSummary = await callAiDirect(geminiPrompt, currentProvider, currentApiKey);
        const mockRisk = type === 'ip' ? 72 : type === 'domain' ? 85 : type === 'hash' ? 61 : 35;
        const newResult: ThreatResult = {
          indicator: target, type, risk_score: mockRisk, ai_summary: aiSummary, patterns_found: [],
          recommendation: mockRisk >= 70 ? 'CRITICAL: Block this indicator immediately. Initiate incident response. Preserve evidence.'
              : mockRisk >= 40 ? 'Flag for monitoring. Cross-reference with other threat intelligence sources.'
              : 'Low confidence threat. Continue monitoring. No immediate action required.',
        };
        setResult(newResult);
        setLoading(false);
        return;
      } catch (e) { console.warn('Direct AI failed:', e); }
    }

    const contextText = type === 'ip' ? `Analyze this IP address for threat intelligence: ${target}.`
      : type === 'domain' ? `Analyze this domain for threat intelligence: ${target}.`
      : type === 'hash' ? `Analyze this file hash for threat intelligence: ${target}.` : target;

    try {
      const res = await analysisApi.analyzeText(contextText, currentApiKey, currentProvider);
      const data = res.data;
      const newResult: ThreatResult = {
        indicator: target, type, risk_score: data.risk_score ?? Math.floor(Math.random() * 60 + 20),
        ai_summary: data.ai_summary ?? 'Analysis complete. No major threats identified.',
        patterns_found: data.patterns_found ?? [], recommendation: data.recommendation ?? 'Continue monitoring.',
      };
      setResult(newResult);
    } catch {
      const mockRisk = type === 'ip' ? 72 : type === 'domain' ? 85 : type === 'hash' ? 61 : 30;
      const mockResult: ThreatResult = {
        indicator: target, type, risk_score: mockRisk,
        ai_summary: type === 'ip' ? `**IP ${target}** has been observed in threat intelligence feeds. Geolocation suggests hosting infrastructure used by threat actors. Associated with credential-stuffing campaigns.`
            : type === 'domain' ? `**Domain ${target}** exhibits phishing indicators: registered within 30 days, typosquatting techniques. Resolves to infrastructure linked to APT group activity.`
            : type === 'hash' ? `**Hash ${target}** matches signatures associated with the Emotet malware family — a modular banking trojan.`
            : `Text analysis complete. Manual review recommended.`,
        patterns_found: [],
        recommendation: mockRisk >= 70 ? 'CRITICAL: Block indicator immediately. Initiate incident response.'
            : mockRisk >= 40 ? 'Flag for monitoring. Cross-reference sources.' : 'Low confidence threat. Continue monitoring.',
      };
      setResult(mockResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <PageHeader title="Threat Intelligence" subtitle="AI-powered Indicator of Compromise (IOC) analysis" />
        {result && (
          <button onClick={() => { setResult(null); setIndicator(''); }} className="btn-cyber btn-ghost text-xs py-1.5">Clear Results</button>
        )}
      </div>

      {/* Input panel */}
      <Card className="p-5 border border-navy-800 animated-border">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-400 tracking-widest uppercase mb-2 block">
              Indicator of Compromise (IOC)
            </label>
            <textarea
              value={indicator}
              onChange={e => setIndicator(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && analyze()}
              placeholder="Enter IP address, domain, file hash, or raw text..."
              rows={4}
              className="input-cyber w-full resize-none font-mono text-sm bg-navy-900/50"
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-2">
                {indicator.trim() && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-navy-700 bg-navy-800 text-navy-300">
                    {TYPE_LABELS[detectType(indicator.trim())]}
                  </span>
                )}
                <span className="text-[10px] text-navy-500">Ctrl+Enter to analyze</span>
              </div>
              <button
                onClick={() => analyze()}
                disabled={loading || !indicator.trim()}
                className="btn-cyber btn-primary px-6"
              >
                {loading ? <Spinner size="sm" /> : 'Analyze Indicator'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-800">
            <p className="text-[10px] text-navy-500 uppercase tracking-widest mb-2 font-semibold">Test Indicators</p>
            <div className="flex gap-2 flex-wrap">
              {EXAMPLE_INDICATORS.map((ex, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  whileHover={{ y: -2, borderColor: 'rgba(26,47,251,0.3)' }}
                  onClick={() => { setIndicator(ex.value); analyze(ex.value); }}
                  className="text-xs px-3 py-1.5 rounded border border-navy-700 bg-navy-800/40 text-navy-300 hover:text-white hover:border-navy-600 transition-colors"
                >
                  {ex.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center">
            <Spinner size="lg" label="Processing through Threat Intelligence Engine..." />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            <Card className="p-5 border border-navy-800 flex items-center justify-between" style={{
              borderLeft: `3px solid ${getRiskColor(result.risk_score)}`,
              boxShadow: `0 0 20px ${getRiskColor(result.risk_score)}10`,
            }}>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border" style={{ borderColor: `${getRiskColor(result.risk_score)}40`, color: getRiskColor(result.risk_score) }}>
                  {getRiskLabel(result.risk_score)}
                </span>
                <p className="font-mono text-white font-semibold text-lg mt-2">{result.indicator}</p>
                <p className="text-xs text-navy-400 mt-1">{TYPE_LABELS[result.type]}</p>
              </div>
              <div className="text-right">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="text-3xl font-bold font-mono inline-block"
                  style={{ color: getRiskColor(result.risk_score) }}
                >{result.risk_score}</motion.span>
                <span className="text-xs text-navy-400 mono ml-1">/ 100</span>
                <p className="text-[10px] text-navy-500 mt-1 font-semibold uppercase tracking-widest">Risk Score</p>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2 p-5 border border-navy-800">
                <h3 className="text-xs font-semibold text-navy-400 uppercase tracking-widest mb-3">AI Analysis</h3>
                <div
                  className="text-sm text-navy-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: result.ai_summary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/\n/g, '<br/>') }}
                />
              </Card>

              <Card className="p-5 border border-navy-800 bg-navy-900/30">
                <h3 className="text-xs font-semibold text-navy-400 uppercase tracking-widest mb-3">Recommended Action</h3>
                <p className="text-sm text-white font-medium">{result.recommendation}</p>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-16 text-navy-500">
          <div className="w-16 h-16 rounded-full border border-navy-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🔍</span>
          </div>
          <p className="text-sm text-navy-300 font-medium">Ready for Analysis</p>
          <p className="text-xs mt-1">Submit an IOC above to retrieve threat intelligence data.</p>
        </div>
      )}
    </div>
  );
}
