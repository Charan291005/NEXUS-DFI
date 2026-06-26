import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { casesApi } from '../utils/api';
import type { NexusCase, CaseStatus, CasePriority, CreateCaseDto } from '../types';
import {
  PageHeader, Card, Badge, Spinner, EmptyState, ConfirmModal
} from '../components/ui';
import {
  STATUS_COLORS, PRIORITY_COLORS, fmtDate, generateCaseId
} from '../utils/helpers';
import { useForm } from 'react-hook-form';


const STATUS_OPTIONS: CaseStatus[]   = ['Open','Active','Closed','Archived'];
const PRIORITY_OPTIONS: CasePriority[] = ['Low','Medium','High','Critical'];

type CaseFormData = CreateCaseDto;

// ── Memoized Glassmorphism Case Card ────────────────────────────────────
const CaseCard = memo(function CaseCard({ c, onView, onDelete, index }: {
  c: NexusCase;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="glass glass-hover p-5 flex flex-col justify-between group relative overflow-hidden text-left"
      onClick={() => onView(c.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Absolute subtle gradient edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-500 via-neon to-accent-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="mono text-accent-400 text-xs font-semibold bg-accent-500/10 px-2.5 py-1 rounded-md border border-accent-500/20">
            {c.case_id}
          </span>
          <div className="flex items-center gap-2">
            <Badge label={c.status} variant={STATUS_COLORS[c.status]} dot />
            <Badge label={c.priority} variant={PRIORITY_COLORS[c.priority]} />
          </div>
        </div>

        <h3 className="text-base font-bold text-white font-display mb-1.5 group-hover:text-accent-200 transition-colors">
          {c.title}
        </h3>
        <p className="text-xs text-navy-400 line-clamp-2 mb-6 leading-relaxed">
          {c.description || 'No description provided for this investigation.'}
        </p>
      </div>

      <div className="pt-4 border-t border-navy-800/80 flex items-center justify-between text-xs text-navy-400">
        <div className="flex items-center gap-2">
          <span className="text-navy-300 font-medium mono bg-navy-900/60 px-2 py-0.5 rounded border border-navy-800">
            🗂️ {c.evidence_count ?? 0} files
          </span>
          <span className="mono text-[11px]">{fmtDate(c.created_at)}</span>
        </div>
        <div className="flex gap-2">
          <button
            id={`btn-delete-case-${c.id}`}
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="btn-cyber btn-danger py-1 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default function CaseList() {
  const navigate = useNavigate();
  const [cases,    setCases]    = useState<NexusCase[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'All'>('All');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CaseFormData>({
    defaultValues: { status: 'Open', priority: 'Medium' },
  });

  useEffect(() => {
    casesApi.list()
      .then(r => setCases(r.data))
      .catch((e) => { console.error(e); setCases([]); })
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: CaseFormData) => {
    setSubmitting(true);
    try {
      const res = await casesApi.create({ ...data, case_id: generateCaseId() });
      setCases(prev => [res.data, ...prev]);
      setShowForm(false);
      reset();
    } catch (e) {
      console.error('Failed to create case', e);
      alert('Failed to create case. Ensure backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await casesApi.delete(deleteId); } catch (e) { console.error('Delete case failed', e); }
    setCases(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
  };

  const handleView = useCallback((id: number) => { navigate(`/cases/${id}`); }, [navigate]);
  const handleDeleteClick = useCallback((id: number) => { setDeleteId(id); }, []);

  const filtered = useMemo(() => {
    return cases.filter(c => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.case_id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [cases, search, filterStatus]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Management"
        subtitle="Track, filter, and manage high-fidelity forensic investigations"
      >
        <button
          id="btn-new-case"
          onClick={() => setShowForm(true)}
          className="btn-cyber btn-primary"
        >
          + New Case
        </button>
      </PageHeader>

      {/* Top Metrics HUD */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-xl border border-navy-800 border-l-4 border-l-accent-500 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold">Total Investigations</p>
              <p className="text-2xl font-bold text-white font-display mt-1">{cases.length}</p>
            </div>
            <span className="text-2xl opacity-20">📁</span>
          </div>
          <div className="glass p-4 rounded-xl border border-navy-800 border-l-4 border-l-neon flex items-center justify-between">
            <div>
              <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold">Active Cases</p>
              <p className="text-2xl font-bold text-white font-display mt-1">{cases.filter(c => c.status === 'Open' || c.status === 'Active').length}</p>
            </div>
            <span className="text-2xl opacity-20">⚡</span>
          </div>
          <div className="glass p-4 rounded-xl border border-navy-800 border-l-4 border-l-warning-500 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-navy-400 uppercase tracking-widest font-mono font-semibold">Evidence Secured</p>
              <p className="text-2xl font-bold text-white font-display mt-1">{cases.reduce((acc, c) => acc + (c.evidence_count ?? 0), 0)}</p>
            </div>
            <span className="text-2xl opacity-20">🔒</span>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <input
            id="input-search-cases"
            type="text"
            placeholder="Search by title or Case ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-cyber flex-1 min-w-[240px]"
          />
          <div className="flex gap-1.5 flex-wrap">
            {(['All', ...STATUS_OPTIONS] as const).map(s => (
              <button
                key={s}
                id={`filter-status-${s.toLowerCase()}`}
                onClick={() => setFilterStatus(s as CaseStatus | 'All')}
                className={`btn-cyber text-xs py-1.5 px-3.5 ${filterStatus === s ? 'btn-cyan' : 'btn-ghost'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cases grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" label="Loading cases vault..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📂" title="No investigations found" description="No cases match your search or filter criteria." action={
          <button className="btn-cyber btn-primary" onClick={() => setShowForm(true)}>Create First Case</button>
        } />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => (
            <CaseCard
              key={c.id}
              c={c}
              onView={handleView}
              onDelete={handleDeleteClick}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass p-6 w-full max-w-lg mx-4 border border-navy-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-white font-display">New Investigation Case</h2>
                <button
                  onClick={() => { setShowForm(false); reset(); }}
                  className="text-navy-400 hover:text-white text-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label-cyber">Case Title *</label>
                  <input
                    id="input-case-title"
                    {...register('title', { required: 'Title is required' })}
                    placeholder="e.g. USB Data Exfiltration Investigation"
                    className="input-cyber"
                  />
                  {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="label-cyber">Description</label>
                  <textarea
                    id="input-case-description"
                    {...register('description')}
                    placeholder="Describe the investigation scope and objectives..."
                    className="input-cyber resize-none h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-cyber">Status</label>
                    <select id="select-case-status" {...register('status')} className="input-cyber">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-cyber">Priority</label>
                    <select id="select-case-priority" {...register('priority')} className="input-cyber">
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-cyber btn-ghost">Cancel</button>
                  <button id="btn-submit-case" type="submit" disabled={submitting} className="btn-cyber btn-primary">
                    {submitting ? 'Creating...' : 'Create Case'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete Case"
        message="This will permanently delete the case and all associated evidence. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </div>
  );
}
