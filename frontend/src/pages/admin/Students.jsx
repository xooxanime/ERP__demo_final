import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import { Modal, Spinner } from '../../components/ui/Primitives';
import { formatDate } from '../../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/students');
      setStudents(res.data?.data?.students || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (id, current) => {
    try {
      await axios.put(`/api/admin/students/${id}`, { isActive: !current });
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isActive: !current } : s));
      toast.success(`Student ${current ? 'deactivated' : 'activated'}`);
    } catch { toast.error('Failed to update status'); }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">{students.length} total students registered</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4" />Add Student</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input icon={Search} placeholder="Search by name, email, phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4" />Export</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0
                  ? <TableEmpty colSpan={7} message="No students found." />
                  : paginated.map(s => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.phone}</TableCell>
                    <TableCell><Badge variant={s.enrolledCourses?.length > 0 ? 'success' : 'muted'}>{s.enrolledCourses?.length > 0 ? 'Enrolled' : 'Not Enrolled'}</Badge></TableCell>
                    <TableCell className="text-sm">{s.enrolledCourses?.length || 0}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(s.createdAt)}</TableCell>
                    <TableCell><Badge variant={s.isActive ? 'success' : 'destructive'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <button onClick={() => toggleStatus(s._id, s.isActive)} title="Toggle status"
                        className="text-muted-foreground hover:text-primary transition-colors">
                        {s.isActive ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
