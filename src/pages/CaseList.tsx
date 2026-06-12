import { useEffect, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

// ── Memoized table row ────────────────────────────────────
const CaseRow = memo(function CaseRow({ c, onView, onDelete, index }: {
  c: NexusCase;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <td className="mono text-sky-400 text-xs font-medium">{c.case_id}</td>
      <td>
        <p className="text-navy-100 font-medium">{c.title}</p>
        <p className="text-xs text-navy-400 truncate max-w-xs">{c.description}</p>
      </td>
      <td><Badge label={c.status} variant={STATUS_COLORS[c.status]} dot /></td>
      <td><Badge label={c.priority} variant={PRIORITY_COLORS[c.priority]} /></td>
      <td><span className="mono text-navy-300 text-sm">{c.evidence_count ?? 0} files</span></td>
      <td><span className="text-xs text-navy-400 mono">{fmtDate(c.created_at)}</span></td>
      <td>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id={`btn-view-case-${c.id}`}
            onClick={(e) => { e.stopPropagation(); onView(c.id); }}
            className="btn-cyber btn-cyan py-1 text-xs"
          >View</motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id={`btn-delete-case-${c.id}`}
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="btn-cyber btn-danger py-1 text-xs"
          >Delete</motion.button>
        </div>
      </td>
    </motion.tr>
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

  const handleView = (id: number) => {
    navigate(`/cases/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const filtered = cases.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.case_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Management"
        subtitle="Track and manage all forensic investigations"
        icon="📂"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          id="btn-new-case"
          onClick={() => setShowForm(true)}
          className="btn-cyber btn-primary"
        >
          + New Case
        </motion.button>
      </PageHeader>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            id="input-search-cases"
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-cyber flex-1 min-w-[200px]"
          />
          <div className="flex gap-2 flex-wrap">
            {(['All', ...STATUS_OPTIONS] as const).map(s => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                id={`filter-status-${s.toLowerCase()}`}
                onClick={() => setFilterStatus(s as CaseStatus | 'All')}
                className={`btn-cyber text-xs py-1.5 ${filterStatus === s ? 'btn-cyan' : 'btn-ghost'}`}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cases table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" label="Loading cases..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📂" title="No cases found" description="No investigations match your filter criteria." action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-cyber btn-primary" onClick={() => setShowForm(true)}>Create First Case</motion.button>
        } />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="table-cyber">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Evidence</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <CaseRow
                  key={c.id}
                  c={c}
                  onView={handleView}
                  onDelete={handleDeleteClick}
                  index={i}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Case Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="glass p-6 w-full max-w-lg mx-4"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white font-display">New Investigation Case</h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                onClick={() => { setShowForm(false); reset(); }}
                className="text-navy-400 hover:text-white text-xl transition-colors"
              >
                ✕
              </motion.button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label-cyber">Case Title *</label>
                <input
                  id="input-case-title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="e.g. Operation Shadow Storm"
                  className="input-cyber"
                />
                {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="label-cyber">Description</label>
                <textarea
                  id="input-case-description"
                  {...register('description')}
                  placeholder="Describe the investigation scope..."
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
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-cyber btn-ghost">Cancel</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} id="btn-submit-case" type="submit" disabled={submitting} className="btn-cyber btn-primary">
                  {submitting ? <Spinner size="sm" /> : null}
                  {submitting ? 'Creating...' : 'Create Case'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

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
