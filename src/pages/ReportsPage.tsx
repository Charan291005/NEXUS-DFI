import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, SectionHeader, Badge, Spinner, SkeletonCard } from '../components/ui';
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
    show: { transition: { staggerChildren: 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -16, filter: 'blur(4px)' },
    show:   { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Report Generator" subtitle="Professional forensic reports for all cases" />

      {/* Inline Toast Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="toast-error"
          >
            <span className="font-bold">Error:</span>
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">✕</button>
          </motion.div>
        )}
        {successCase && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="toast-success"
          >
            <span className="font-bold">Success:</span>
            <span>Report for <strong>{successCase}</strong> generated and downloaded successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Report list */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-4">
          <SectionHeader title="Available Cases for Reporting" />
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <SkeletonCard key={i} height={70} />)}
            </div>
          ) : cases.length === 0 ? (
            <p className="text-navy-400 text-sm">No cases available. Create a case first.</p>
          ) : cases.map((c) => (
            <motion.div
              key={c.id}
              variants={itemVariants}
              className="glass p-4 hover:border-navy-600 transition-all card-spotlight"
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(26,47,251,0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-12 rounded bg-navy-800 border border-navy-700 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-navy-400">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-display">{c.title}</p>
                    <p className="text-xs mono text-accent-400">{c.case_id}</p>
                    <p className="text-[10px] text-navy-400 mt-1 uppercase tracking-wider">{new Date(c.created_at).toLocaleDateString()} · {c.evidence_count} evidence files</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={c.status} variant="badge-success" dot />
                  <button
                    onClick={() => generate(c.id, c.case_id)}
                    disabled={generating === c.id}
                    id={`btn-generate-report-${c.id}`}
                    className="btn-cyber btn-primary text-xs py-1.5 min-w-[120px] justify-center"
                    style={{ transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => { if (generating !== c.id) e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {generating === c.id ? <Spinner size="sm" /> : 'Generate Report'}
                  </button>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

        {/* Generate new report panel */}
        <div>
          <SectionHeader title="Report Configuration" />
          <Card className="space-y-4 animated-border">
            <p className="text-sm text-navy-300 leading-relaxed">
              Generate a comprehensive PDF forensic report for an active case. The report includes chain-of-custody logs, AI analysis findings, and tactical recommendations.
            </p>
            <div className="space-y-2 mt-4">
              <label className="label-cyber">Include Sections</label>
              {['Executive Summary','Chain-of-Custody Log','Image Forensics','Deepfake Detection','Log Analysis','Risk Assessment','Recommendations','Timeline Events'].map(s => (
                <label key={s} className="flex items-center gap-2 text-xs text-navy-300 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" defaultChecked
                    className="rounded border-navy-600 bg-navy-900"
                  />
                  {s}
                </label>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg text-xs text-navy-300 border border-navy-700 bg-navy-900/50">
              <span className="text-accent-400 font-bold mr-1">INFO:</span> Reports require the FastAPI backend running on port 8000. PDF generation uses ReportLab.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
