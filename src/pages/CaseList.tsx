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

// ── Mock data ─────────────────────────────────────────────
const MOCK_CASES: NexusCase[] = [
  { id:1, case_id:'NXDFI-2605-4821', title:'Operation Shadow Storm',   description:'Multi-vector phishing campaign targeting financial institutions with deepfake CEO audio.',   status:'Active',   priority:'Critical', created_at: new Date(Date.now()-86400000*3).toISOString(),  updated_at: new Date().toISOString(), owner_id:1, evidence_count:24 },
  { id:2, case_id:'NXDFI-2605-3317', title:'Insider Threat – DevOps', description:'Suspicious data exfiltration detected from internal DevOps repository access logs.',          status:'Active',   priority:'High',     created_at: new Date(Date.now()-86400000*7).toISOString(),  updated_at: new Date().toISOString(), owner_id:1, evidence_count:12 },
  { id:3, case_id:'NXDFI-2605-9102', title:'Deepfake Political Video', description:'Viral video suspected to contain AI-generated content of public figure. Under analysis.',     status:'Open',     priority:'High',     created_at: new Date(Date.now()-86400000*1).toISOString(),  updated_at: new Date().toISOString(), owner_id:1, evidence_count:6  },
  { id:4, case_id:'NXDFI-2605-1244', title:'Ransomware Incident R9X', description:'Post-incident forensic analysis of ransomware attack on healthcare provider.',                 status:'Closed',   priority:'Critical', created_at: new Date(Date.now()-86400000*14).toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:48 },
  { id:5, case_id:'NXDFI-2605-7763', title:'Social Engineering Probe', description:'Image-based social engineering artifacts for employee training exercise.',                     status:'Archived', priority:'Low',      created_at: new Date(Date.now()-86400000*30).toISOString(), updated_at: new Date().toISOString(), owner_id:1, evidence_count:9  },
  { id:6, case_id:'NXDFI-2605-5528', title:'Supply Chain Compromise',  description:'Suspected software supply chain attack via compromised NPM package with obfuscated payload.', status:'Active',   priority:'Critical', created_at: new Date(Date.now()-86400000*2).toISOString(),  updated_at: new Date().toISOString(), owner_id:1, evidence_count:31 },
];

const STATUS_OPTIONS: CaseStatus[]   = ['Open','Active','Closed','Archived'];
const PRIORITY_OPTIONS: CasePriority[] = ['Low','Medium','High','Critical'];

interface CaseFormData extends CreateCaseDto {}

// ── Memoized table row ────────────────────────────────────
const CaseRow = memo(function CaseRow({ c, onView, onDelete }: {
  c: NexusCase;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr>
      <td className="mono text-blue-400 text-xs font-medium">{c.case_id}</td>
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
          <button
            id={`btn-view-case-${c.id}`}
            onClick={(e) => { e.stopPropagation(); onView(c.id); }}
            className="btn-cyber btn-cyan py-1 text-xs"
          >View</button>
          <button
            id={`btn-delete-case-${c.id}`}
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="btn-cyber btn-danger py-1 text-xs"
          >Delete</button>
        </div>
      </td>
    </tr>
  );
});

export default function CaseList() {
  const navigate = useNavigate();
  const [cases,    setCases]    = useState<NexusCase[]>(MOCK_CASES);
  const [loading,  setLoading]  = useState(false);
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
      .catch(() => setCases(MOCK_CASES))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: CaseFormData) => {
    setSubmitting(true);
    try {
      const res = await casesApi.create({ ...data, case_id: generateCaseId() });
      setCases(prev => [res.data, ...prev]);
      setShowForm(false);
      reset();
    } catch {
      // offline: add locally
      const fakeCase: NexusCase = {
        id: Date.now(), case_id: generateCaseId(), ...data,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        owner_id: 1, evidence_count: 0,
      };
      setCases(prev => [fakeCase, ...prev]);
      setShowForm(false);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await casesApi.delete(deleteId); } catch {}
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
        <button id="btn-new-case" onClick={() => setShowForm(true)} className="btn-cyber btn-primary">
          + New Case
        </button>
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
              <button
                key={s}
                id={`filter-status-${s.toLowerCase()}`}
                onClick={() => setFilterStatus(s as any)}
                className={`btn-cyber text-xs py-1.5 ${filterStatus === s ? 'btn-cyan' : 'btn-ghost'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cases table — NO AnimatePresence on tr */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" label="Loading cases..." /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📂" title="No cases found" description="No investigations match your filter criteria." action={
          <button className="btn-cyber btn-primary" onClick={() => setShowForm(true)}>Create First Case</button>
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
              {filtered.map(c => (
                <CaseRow
                  key={c.id}
                  c={c}
                  onView={handleView}
                  onDelete={handleDeleteClick}
                />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Case Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass p-6 w-full max-w-lg mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">New Investigation Case</h2>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-navy-400 hover:text-white text-xl transition-colors">✕</button>
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
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-cyber btn-ghost">Cancel</button>
                <button id="btn-submit-case" type="submit" disabled={submitting} className="btn-cyber btn-primary">
                  {submitting ? <Spinner size="sm" /> : null}
                  {submitting ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
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
