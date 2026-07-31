import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Download, Eye } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { StatCard, Spinner } from '../../components/ui/Primitives';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { formatCurrency, formatDate } from '../../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

const statusConfig = {
  pending:  { variant: 'warning',     icon: Clock,       label: 'Pending' },
  approved: { variant: 'success',     icon: CheckCircle, label: 'Approved' },
  rejected: { variant: 'destructive', icon: XCircle,     label: 'Rejected' },
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/pending-payments');
      setPayments(res.data?.data?.payments || res.data?.data || []);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await axios.put(`/api/admin/payments/${id}/${action}`);
      toast.success(`Payment ${action}d`);
      fetchPayments();
    } catch (err) { 
      toast.error(err.response?.data?.message || `Failed to ${action} payment`); 
    } finally { 
      setActionLoading(null); 
    }
  };

  const filtered = payments.filter(p => {
    const studentName = p.studentId?.name || 'Unnamed Student';
    const courseTitle = p.courseId?.title || p.courseName || '—';
    const matchSearch = !search || 
      studentName.toLowerCase().includes(search.toLowerCase()) || 
      courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    totalRevenue: payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + (p.amount || 0), 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="page-title">Fee & Payments</h1><p className="page-subtitle">Manage student payment records</p></div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4" />Export</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={CheckCircle} color="blue" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input icon={Search} placeholder="Search student or course..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {['all','pending','approved','rejected'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${filter === f ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-16"><Spinner /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0
                  ? <TableEmpty colSpan={7} message="No payments found." />
                  : filtered.map(p => {
                    const cfg = statusConfig[p.status] || statusConfig.pending;
                    return (
                      <TableRow key={p._id}>
                        <TableCell className="font-medium text-sm">{p.studentId?.name || 'Unnamed Student'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.courseId?.title || p.courseName || 'Unnamed Course'}</TableCell>
                        <TableCell className="font-semibold text-sm">{formatCurrency(p.amount || 0)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm capitalize">{p.paymentMethod || 'Online'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(p.createdAt)}</TableCell>
                        <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                        <TableCell>
                          {p.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="success" className="bg-success/10 text-success hover:bg-success/20 border-0"
                                disabled={actionLoading === p._id}
                                onClick={() => handleAction(p._id, 'approve')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/30"
                                disabled={actionLoading === p._id}
                                onClick={() => handleAction(p._id, 'reject')}>
                                Reject
                              </Button>
                            </div>
                          )}
                          {p.status !== 'pending' && (
                            <Badge variant="muted">Done</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
