import { useState, useEffect } from 'react';
import { FiDollarSign, FiPlus, FiTrash, FiEdit2, FiCheck, FiX, FiLayers, FiList, FiUser } from 'react-icons/fi';
import { feeAPI, batchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import Loading from '../../components/Loading';

const Fees = () => {
  const [batches, setBatches] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [structures, setStructures] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState('ledgers'); // 'ledgers', 'structures', 'heads'

  // Modals
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Forms state
  const [newHead, setNewHead] = useState({ name: '', description: '' });
  const [newStructure, setNewStructure] = useState({
    title: '',
    batchId: '',
    dueDate: '',
    selectedHeads: [] // Array of { feeHeadId, amount }
  });
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    itemId: '',
    discount: 0,
    fine: 0
  });

  // Query filter
  const [filterBatchId, setFilterBatchId] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [batchesRes, headsRes, structuresRes, sessionRes] = await Promise.all([
        batchAPI.getAll(),
        feeAPI.getHeads(),
        feeAPI.getStructures(),
        feeAPI.getActiveSession()
      ]);
      setBatches(batchesRes.data.data.batches || []);
      setFeeHeads(headsRes.data.data.feeHeads || []);
      setStructures(structuresRes.data.feeStructures || structuresRes.data.data?.feeStructures || []);
      setActiveSession(sessionRes.data.data?.academicSession || null);
      
      // Load ledgers
      fetchLedgers();
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error('Failed to load billing databases');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      const params = {};
      if (filterStudentId) params.studentId = filterStudentId;
      const res = await feeAPI.getLedgers(params);
      setLedgers(res.data.ledgers || res.data.data?.ledgers || []);
    } catch (error) {
      toast.error('Failed to fetch ledgers');
    }
  };

  // Add Fee Head
  const handleAddHead = async (e) => {
    e.preventDefault();
    if (!newHead.name) return;
    try {
      const res = await feeAPI.createHead(newHead);
      setFeeHeads([...feeHeads, res.data.data.feeHead]);
      setShowHeadModal(false);
      setNewHead({ name: '', description: '' });
      toast.success('Fee Head created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create fee head');
    }
  };

  // Add Structure template
  const handleAddStructure = async (e) => {
    e.preventDefault();
    if (!newStructure.title || !newStructure.batchId || !newStructure.dueDate || newStructure.selectedHeads.length === 0) {
      toast.error('Please fill in all structure requirements');
      return;
    }

    const activeSessionId = batches.find(b => b._id === newStructure.batchId)?.academicSessionId || activeSession?._id;
    
    if (!activeSessionId) {
      toast.error('Cannot resolve a valid active academic session ID.');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        title: newStructure.title,
        academicSessionId: activeSessionId,
        batchId: newStructure.batchId,
        dueDate: newStructure.dueDate,
        heads: newStructure.selectedHeads.map(h => ({
          feeHeadId: h.feeHeadId,
          amount: Number(h.amount)
        }))
      };

      await feeAPI.createStructure(payload);
      toast.success('Fee Structure template created and student ledgers auto-allocated!');
      setShowStructureModal(false);
      setNewStructure({ title: '', batchId: '', dueDate: '', selectedHeads: [] });
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create fee structure');
      setLoading(false);
    }
  };

  // Remove Structure template (Soft Delete)
  const handleDeleteStructure = async (id) => {
    if (!window.confirm('Are you sure you want to delete this structure and all student allocations?')) return;
    try {
      await feeAPI.deleteStructure(id);
      setStructures(structures.filter(s => s._id !== id));
      toast.success('Fee structure template deleted');
      fetchLedgers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete structure');
    }
  };

  // Override Ledger Item (Waivers & Fines)
  const handleAdjustLedger = async (e) => {
    e.preventDefault();
    if (!selectedLedger || !adjustForm.itemId) return;

    try {
      await feeAPI.adjustLedgerItem(selectedLedger._id, {
        headNameOrId: adjustForm.itemId,
        discount: Number(adjustForm.discount),
        fine: Number(adjustForm.fine),
        __v: selectedLedger.__v // Send version key for optimistic lock checks
      });

      toast.success('Fee item adjusted successfully!');
      setShowAdjustModal(false);
      setSelectedLedger(null);
      setAdjustForm({ itemId: '', discount: 0, fine: 0 });
      fetchLedgers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Conflict: Record has been updated since. Refresh.');
    }
  };

  const handleHeadCheck = (headId, isChecked) => {
    if (isChecked) {
      setNewStructure({
        ...newStructure,
        selectedHeads: [...newStructure.selectedHeads, { feeHeadId: headId, amount: 0 }]
      });
    } else {
      setNewStructure({
        ...newStructure,
        selectedHeads: newStructure.selectedHeads.filter(h => h.feeHeadId !== headId)
      });
    }
  };

  const handleHeadAmountChange = (headId, val) => {
    setNewStructure({
      ...newStructure,
      selectedHeads: newStructure.selectedHeads.map(h => 
        h.feeHeadId === headId ? { ...h, amount: val } : h
      )
    });
  };

  if (loading) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/70 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Institutional Billing & Dues</h1>
            <p className="text-muted-foreground text-sm mt-1">Define structure templates, assign batch billing, and manage waivers/fines.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHeadModal(true)}
              className="flex items-center gap-2 bg-muted hover:bg-accent text-foreground px-4 py-2 rounded-xl transition font-medium text-sm border border-border/50"
            >
              <FiPlus /> New Fee Head
            </button>
            <button
              onClick={() => setShowStructureModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition font-medium text-sm shadow-sm"
            >
              <FiPlus /> Define Structure
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveTab('ledgers')}
            className={`pb-4 px-2 font-semibold text-sm transition relative ${
              activeTab === 'ledgers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Student Ledgers ({ledgers.length})
          </button>
          <button
            onClick={() => setActiveTab('structures')}
            className={`pb-4 px-2 font-semibold text-sm transition relative ${
              activeTab === 'structures' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Structures Templates ({structures.length})
          </button>
          <button
            onClick={() => setActiveTab('heads')}
            className={`pb-4 px-2 font-semibold text-sm transition relative ${
              activeTab === 'heads' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Configure Fee Heads ({feeHeads.length})
          </button>
        </div>

        {/* Dynamic Tabs Content */}
        {activeTab === 'ledgers' && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Filters */}
            <div className="p-4 bg-muted/50 border-b border-border flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <FiList className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Filter Ledgers</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search Student ID (User ID)..."
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={fetchLedgers}
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  Apply Filter
                </button>
              </div>
            </div>

            {ledgers.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No student ledgers matching current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead className="bg-muted/70 text-muted-foreground font-medium text-xs uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Structure Info</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Billed Amount</th>
                      <th className="p-4">Collected</th>
                      <th className="p-4">Dues Status</th>
                      <th className="p-4">Override Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {ledgers.map(l => (
                      <tr key={l._id} className="hover:bg-muted/50 transition">
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              {l.studentId?.name || (l.studentId ? (typeof l.studentId === 'string' ? `Student ID: ${l.studentId}` : `Student ID: ${l.studentId._id || 'Unnamed Student'}`) : 'Unnamed Student')}
                            </p>
                            <p className="text-muted-foreground text-xs">{l.studentId?.email || (l.studentId ? 'Profile Linked' : 'No Account email')}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{l.feeStructureId?.title || l.title || 'Dynamic Invoice'}</p>
                            <p className="text-muted-foreground text-xs">Session: {l.academicSessionId?.name || '2026-27'}</p>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-muted-foreground">
                          {new Date(l.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-foreground">
                          ₹{l.totalFinalAmount.toFixed(2)}
                        </td>
                        <td className="p-4 text-emerald-600 font-semibold">
                          ₹{l.amountPaid.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                            l.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            l.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-500' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              setSelectedLedger(l);
                              setShowAdjustModal(true);
                            }}
                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg transition"
                          >
                            <FiEdit2 /> Set Override
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'structures' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {structures.map(s => (
              <div key={s._id} className="bg-card p-6 rounded-2xl border border-border shadow-sm relative group">
                <button
                  onClick={() => handleDeleteStructure(s._id)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition"
                >
                  <FiTrash />
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <FiLayers size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">Session: {s.academicSessionId?.name || '2026-27'} | Batch: {s.batchId?.name}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-border py-4 my-4">
                  {s.heads.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm text-foreground">
                      <span>{item.feeHeadId?.name || 'Standard Head'}</span>
                      <span className="font-semibold text-foreground">₹{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Due Date: {new Date(s.dueDate).toLocaleDateString()}</span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Billed</p>
                    <p className="text-lg font-black text-foreground">₹{s.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'heads' && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden max-w-2xl">
            <div className="p-4 bg-muted/50 border-b border-border font-semibold text-foreground text-sm">
              Current Head Catalog
            </div>
            <div className="divide-y divide-border">
              {feeHeads.map(h => (
                <div key={h._id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition">
                  <div>
                    <h4 className="font-bold text-foreground">{h.name}</h4>
                    <p className="text-xs text-muted-foreground">{h.description || 'No description provided.'}</p>
                  </div>
                  <span className="text-xs bg-muted text-foreground border border-border font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODALS */}

        {/* Modal: New Fee Head */}
        {showHeadModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-popover w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200 text-foreground">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-foreground">Create Fee Head</h3>
                <button onClick={() => setShowHeadModal(false)} className="text-muted-foreground hover:text-foreground"><FiX /></button>
              </div>
              <form onSubmit={handleAddHead} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Head Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tuition Fee, Library Fee"
                    value={newHead.name}
                    onChange={(e) => setNewHead({ ...newHead, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description (Optional)</label>
                  <textarea
                    placeholder="Brief detail of fee usage"
                    value={newHead.description}
                    onChange={(e) => setNewHead({ ...newHead, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm h-20 resize-none"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-xl hover:bg-indigo-700 transition">
                  Create Head
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Define Structure & Allocate */}
        {showStructureModal && (
          <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-popover w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200 text-foreground">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-foreground">Define Structure Template</h3>
                <button onClick={() => setShowStructureModal(false)} className="text-muted-foreground hover:text-foreground"><FiX /></button>
              </div>
              <form onSubmit={handleAddStructure} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Structure Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Class 10 Term 1"
                      value={newStructure.title}
                      onChange={(e) => setNewStructure({ ...newStructure, title: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Batch Allocation</label>
                    <select
                      required
                      value={newStructure.batchId}
                      onChange={(e) => setNewStructure({ ...newStructure, batchId: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    >
                      <option value="">Select Batch</option>
                      {batches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newStructure.dueDate}
                    onChange={(e) => setNewStructure({ ...newStructure, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Select Billed Fee Heads</label>
                  <div className="space-y-3 max-h-48 overflow-y-auto border border-border p-3 rounded-xl bg-muted/50">
                    {feeHeads.map(h => {
                      const isSelected = newStructure.selectedHeads.some(item => item.feeHeadId === h._id);
                      const headItem = newStructure.selectedHeads.find(item => item.feeHeadId === h._id);

                      return (
                        <div key={h._id} className="flex items-center justify-between gap-4 p-2 bg-card rounded-lg border border-border shadow-sm">
                          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleHeadCheck(h._id, e.target.checked)}
                              className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                            />
                            {h.name}
                          </label>
                          {isSelected && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <input
                                type="number"
                                required
                                min="0"
                                placeholder="Amount"
                                value={headItem?.amount || ''}
                                onChange={(e) => handleHeadAmountChange(h._id, e.target.value)}
                                className="w-24 px-2 py-1 bg-background border border-border text-foreground rounded-md outline-none text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm">
                  Allocate and Generate Invoices
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Adjust Student Ledger Waiver & Fine */}
        {showAdjustModal && selectedLedger && (
          <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-popover w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200 text-foreground">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-foreground">Set Override Adjustments</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Waiver discounts or late fines for {selectedLedger.studentId?.name}</p>
                </div>
                <button onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedLedger(null);
                }} className="text-muted-foreground hover:text-foreground"><FiX /></button>
              </div>
              <form onSubmit={handleAdjustLedger} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Select Ledger Head Item</label>
                  <select
                    required
                    value={adjustForm.itemId}
                    onChange={(e) => {
                      const item = selectedLedger.items.find(i => i.feeHeadId?._id === e.target.value || i._id === e.target.value);
                      setAdjustForm({
                        itemId: e.target.value,
                        discount: item?.discount || 0,
                        fine: item?.fine || 0
                      });
                    }}
                    className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                  >
                    <option value="">Choose item...</option>
                    {selectedLedger.items.map(i => (
                      <option key={i._id} value={i.feeHeadId?._id || i._id}>
                        {i.feeHeadId?.name || 'Standard Head'} (Base: ₹{i.baseAmount})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Waiver Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={adjustForm.discount}
                      onChange={(e) => setAdjustForm({ ...adjustForm, discount: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Late Fine (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={adjustForm.fine}
                      onChange={(e) => setAdjustForm({ ...adjustForm, fine: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border text-foreground rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-semibold"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-xl hover:bg-indigo-700 transition">
                  Apply Overrides
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Fees;
