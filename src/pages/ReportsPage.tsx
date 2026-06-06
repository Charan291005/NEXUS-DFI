import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, SectionHeader, Badge, Spinner } from '../components/ui';
import { analysisApi, casesApi } from '../utils/api';
import type { NexusCase } from '../types';

export default function ReportsPage() {
  const [cases, setCases] = useState<NexusCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    casesApi.list().then(res => setCases(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

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

      {/* Report section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Report list */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-4">
          <SectionHeader title="Available Cases for Reporting" icon="📄" />
          {loading ? <Spinner /> : cases.length === 0 ? <p className="text-navy-400 text-sm">No cases available.</p> : cases.map((c) => (
            <motion.div
              key={c.id}
              variants={itemVariants}
              whileHover={{ y: -2, boxShadow: '0 12px 36px rgba(0,0,0,0.35)' }}
              className="glass glass-hover p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="w-12 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))',
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}
                  >
                    <span className="text-lg">📄</span>
                    <span className="text-[9px] text-red-400 font-bold">PDF</span>
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-navy-200 font-display">{c.title}</p>
                    <p className="text-xs text-blue-400 mono">{c.case_id}</p>
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
                    className="btn-cyber btn-primary text-xs py-1.5"
                  >
                    {generating === c.id ? <Spinner size="sm" /> : '⬇'} Generate Report
                  </motion.button>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>

        {/* Generate new report */}
        <div>
          <SectionHeader title="Generate New Report" icon="✨" />
          <Card className="space-y-4">
            <p className="text-sm text-navy-300">Generate a comprehensive PDF forensic report for an active case. The report includes chain-of-custody logs, AI analysis findings, and recommendations.</p>
            <div className="space-y-2 mt-4">
              <label className="label-cyber">Include Sections</label>
              {['Executive Summary','Evidence Chain-of-Custody','Image Analysis','Deepfake Detection','Log Analysis','Risk Assessment','Recommendations','Timeline'].map(s => (
                <label key={s} className="flex items-center gap-2 text-xs text-navy-300 cursor-pointer hover:text-navy-100 transition-colors">
                  <input type="checkbox" defaultChecked className="accent-blue-500 rounded" />
                  {s}
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
