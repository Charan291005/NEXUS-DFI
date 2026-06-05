import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, SectionHeader, Badge, Spinner } from '../components/ui';
import { analysisApi } from '../utils/api';

const MOCK_REPORTS = [
  { id:1, caseId:'NXDFI-2605-4821', title:'Operation Shadow Storm',   date:'2026-05-26', status:'Generated', pages:18 },
  { id:2, caseId:'NXDFI-2605-3317', title:'Insider Threat – DevOps',  date:'2026-05-20', status:'Generated', pages:12 },
  { id:3, caseId:'NXDFI-2605-1244', title:'Ransomware Incident R9X',  date:'2026-05-15', status:'Generated', pages:24 },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const generate = async (caseId: number, caseNum: string) => {
    setGenerating(caseId);
    try {
      const res = await analysisApi.generateReport(caseId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${caseNum}_report.pdf`; a.click();
    } catch {
      await new Promise(r => setTimeout(r, 2000));
      alert('Backend offline — PDF generation requires the FastAPI server running on port 8000.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Report Generator" subtitle="Professional forensic reports for all cases" icon="📑" />

      {/* Report section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Report list */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Generated Reports" icon="📄" />
          {MOCK_REPORTS.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity:0, x:-10 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i*0.08 }}
              className="glass glass-hover p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-14 rounded-lg bg-gradient-to-b from-red-500/20 to-red-500/5 border border-red-500/20 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-lg">📄</span>
                    <span className="text-[9px] text-red-400 font-bold">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{r.title}</p>
                    <p className="text-xs text-blue-400 mono">{r.caseId}</p>
                    <p className="text-xs text-slate-500 mt-1">{r.date} · {r.pages} pages</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={r.status} variant="badge-success" dot />
                  <button
                    id={`btn-preview-${r.id}`}
                    onClick={() => setPreview(preview === r.id ? null : r.id)}
                    className="btn-cyber btn-ghost text-xs py-1.5"
                  >
                    Preview
                  </button>
                  <button
                    id={`btn-download-${r.id}`}
                    onClick={() => generate(r.id, r.caseId)}
                    disabled={generating === r.id}
                    className="btn-cyber btn-primary text-xs py-1.5"
                  >
                    {generating === r.id ? <Spinner size="sm" /> : '⬇'} Download
                  </button>
                </div>
              </div>

              {/* Preview panel */}
              {preview === r.id && (
                <motion.div
                  initial={{ height:0, opacity:0 }}
                  animate={{ height:'auto', opacity:1 }}
                  className="mt-4 pt-4 border-t border-white/[0.05] overflow-hidden"
                >
                  <div className="glass p-6 rounded-xl space-y-3 text-xs text-slate-400 font-mono">
                    <div className="text-center mb-4">
                      <p className="text-lg font-bold text-white">NEXUSDFI FORENSIC REPORT</p>
                      <p className="text-blue-400">CONFIDENTIAL — LAW ENFORCEMENT USE ONLY</p>
                      <div className="divider-cyber" />
                    </div>
                    <p className="text-slate-300 font-semibold">EXECUTIVE SUMMARY</p>
                    <p>Case Reference: {r.caseId}</p>
                    <p>Investigation Title: {r.title}</p>
                    <p>Report Generated: {r.date}</p>
                    <p>Total Evidence Items: 3 files</p>
                    <p>Risk Assessment: CRITICAL</p>
                    <div className="mt-3">
                      <p className="text-slate-300 font-semibold mb-2">KEY FINDINGS</p>
                      <p>• Image tampering detected (ELA risk 78%) — suspect composite imagery</p>
                      <p>• Deepfake video identified (91% confidence) — StyleGAN2 fingerprint</p>
                      <p>• Server log analysis: 14 anomalous events, data exfiltration confirmed</p>
                    </div>
                    <div className="mt-3">
                      <p className="text-slate-300 font-semibold mb-2">RECOMMENDATIONS</p>
                      <p>1. Immediate forensics lab certification of physical evidence</p>
                      <p>2. Legal counsel review prior to court submission</p>
                      <p>3. Preserve chain-of-custody documentation</p>
                    </div>
                    <p className="text-center text-slate-600 mt-4">— Report continues for {r.pages} pages —</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Generate new report */}
        <div>
          <SectionHeader title="Generate New Report" icon="✨" />
          <Card className="space-y-4">
            <div>
              <label className="label-cyber">Case ID</label>
              <select id="select-report-case" className="input-cyber">
                <option>NXDFI-2605-4821 — Shadow Storm</option>
                <option>NXDFI-2605-3317 — Insider Threat</option>
                <option>NXDFI-2605-9102 — Deepfake Video</option>
              </select>
            </div>
            <div>
              <label className="label-cyber">Report Type</label>
              <select id="select-report-type" className="input-cyber">
                <option>Full Forensic Report</option>
                <option>Executive Summary</option>
                <option>Evidence Inventory</option>
                <option>Technical Analysis</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="label-cyber">Include Sections</label>
              {['Executive Summary','Evidence Chain-of-Custody','Image Analysis','Deepfake Detection','Log Analysis','Risk Assessment','Recommendations','Timeline'].map(s => (
                <label key={s} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-cyan-400" />
                  {s}
                </label>
              ))}
            </div>
            <button
              id="btn-generate-new-report"
              onClick={() => generate(1, 'NXDFI-2605-4821')}
              disabled={generating !== null}
              className="btn-cyber btn-primary w-full justify-center"
            >
              {generating !== null ? <Spinner size="sm" /> : '📑'}
              {generating !== null ? 'Generating PDF...' : 'Generate Report'}
            </button>
            <p className="text-[10px] text-slate-600 text-center">Reports use SHA-256 verified evidence data</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
