import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, SectionHeader, Badge, Spinner } from '../components/ui';
import { analysisApi, casesApi } from '../utils/api';
import type { NexusCase } from '../types';

export default function ReportsPage() {
  const [cases, setCases] = useState<NexusCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successCase, setSuccessCase] = useState('');

  useEffect(() => {
    casesApi.list().then(res => setCases(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const generate = async (caseId: number, caseNum: string) => {
    setGenerating(caseId);
    setError('');
    setSuccessCase('');
    try {
      const res = await analysisApi.generateReport(caseId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `${caseNum}_report.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      setSuccessCase(caseNum);
      setTimeout(() => setSuccessCase(''), 4000);
    } catch {
      setError(`PDF generation failed for ${caseNum}. Ensure the FastAPI backend is running on port 8000.`);
      setTimeout(() => setError(''), 6000);
    } finally {
      setGenerating(null);
    }
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Report Generator" subtitle="Professional forensic reports for all cases" icon="📑" />

      {/* Inline Toast Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="toast-error"
          >
            <span className="text-lg flex-shrink-0">⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400/60 hover:text-red-400 transition-colors text-lg leading-none"
            >✕</button>
          </motion.div>
        )}
        {successCase && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="toast-success"
          >
            <span className="text-lg flex-shrink-0">✅</span>
            <span>Report for <strong>{successCase}</strong> generated and downloaded successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Report list */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-4">
          <SectionHeader title="Available Cases for Reporting" icon="📄" />
          {loading ? <Spinner /> : cases.length === 0 ? (
            <p className="text-navy-400 text-sm">No cases available. Create a case first.</p>
          ) : cases.map((c) => (
            <motion.div
              key={c.id}
              variants={itemVariants}
              whileHover={{ y: -2, boxShadow: '0 12px 36px rgba(0,0,0,0.38)' }}
              className="glass glass-hover p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="w-12 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(220,38,38,0.04))',
                      border: '1px solid rgba(220,38,38,0.18)',
                    }}
                  >
                    <span className="text-lg">📄</span>
                    <span className="text-[9px] font-bold" style={{ color: '#DC2626' }}>PDF</span>
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-navy-200 font-display">{c.title}</p>
                    <p className="text-xs mono" style={{ color: '#3B82F6' }}>{c.case_id}</p>
                    <p className="text-xs text-navy-500 mt-1">{new Date(c.created_at).toLocaleDateString()} · {c.evidence_count} evidence files</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={c.status} variant="badge-success" dot />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => generate(c.id, c.case_id)}
                    disabled={generating === c.id}
                    id={`btn-generate-report-${c.id}`}
                    className="btn-cyber btn-primary text-xs py-1.5"
                  >
                    {generating === c.id ? <Spinner size="sm" /> : '⬇'} Generate Report
                  </motion.button>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

        {/* Generate new report panel */}
        <div>
          <SectionHeader title="Report Options" icon="✨" />
          <Card className="space-y-4">
            <p className="text-sm text-navy-300">Generate a comprehensive PDF forensic report for an active case. The report includes chain-of-custody logs, AI analysis findings, and recommendations.</p>
            <div className="space-y-2 mt-4">
              <label className="label-cyber">Include Sections</label>
              {['Executive Summary','Evidence Chain-of-Custody','Image Analysis','Deepfake Detection','Log Analysis','Risk Assessment','Recommendations','Timeline'].map(s => (
                <label key={s} className="flex items-center gap-2 text-xs text-navy-300 cursor-pointer hover:text-navy-100 transition-colors">
                  <input type="checkbox" defaultChecked
                    className="rounded"
                    style={{ accentColor: '#DC2626' }}
                  />
                  {s}
                </label>
              ))}
            </div>
            <div
              className="mt-4 p-3 rounded-xl text-xs text-navy-400"
              style={{
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.12)',
              }}
            >
              <span style={{ color: '#3B82F6' }}>ℹ</span> Reports require the FastAPI backend running on port 8000. PDF generation uses ReportLab.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
