import { useState } from 'react';
import axios from 'axios';
import { Download, FileText, BarChart2, Users, DollarSign, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [downloading, setDownloading] = useState(false);

  const generateCSV = (headers, data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filename} exported successfully!`);
  };

  const handleDownloadStudentsReport = async () => {
    try {
      setDownloading(true);
      toast.loading('Generating student enrollment report...', { id: 'rep' });
      const res = await axios.get('/api/admin/students');
      const students = res.data?.data?.students || [];

      const formattedData = students.map(s => ({
        ID: s._id,
        Name: s.name,
        Email: s.email,
        Phone: s.phone,
        Status: s.isActive ? 'Active' : 'Inactive',
        ApprovalStatus: s.approvalStatus || 'N/A',
        EnrolledCoursesCount: s.enrolledCourses?.length || 0,
        CreatedAt: new Date(s.createdAt).toLocaleString()
      }));

      generateCSV(['ID', 'Name', 'Email', 'Phone', 'Status', 'ApprovalStatus', 'EnrolledCoursesCount', 'CreatedAt'], formattedData, 'Students_Enrollment_Report');
      toast.success('Students report downloaded', { id: 'rep' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate students report', { id: 'rep' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadRevenueReport = async () => {
    try {
      setDownloading(true);
      toast.loading('Generating financial revenue report...', { id: 'rep' });
      const res = await axios.get('/api/v1/fees/ledgers');
      const ledgers = res.data?.data || res.data?.ledgers || [];

      const formattedData = ledgers.map(l => ({
        LedgerID: l._id,
        StudentName: l.studentId?.name || 'N/A',
        StudentEmail: l.studentId?.email || 'N/A',
        TotalAmount: l.totalFinalAmount || 0,
        AmountPaid: l.amountPaid || 0,
        Status: l.status,
        DueDate: new Date(l.dueDate).toLocaleDateString()
      }));

      generateCSV(['LedgerID', 'StudentName', 'StudentEmail', 'TotalAmount', 'AmountPaid', 'Status', 'DueDate'], formattedData, 'Financial_Revenue_Report');
      toast.success('Financial report downloaded', { id: 'rep' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate revenue report', { id: 'rep' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadLogsReport = async () => {
    try {
      setDownloading(true);
      toast.loading('Generating outbound system logs report...', { id: 'rep' });
      const res = await axios.get('/api/admin/whatsapp/logs?limit=500');
      const logs = res.data?.data?.logs || [];

      const formattedData = logs.map(l => ({
        LogID: l._id,
        Recipient: l.recipientId?.name || 'N/A',
        Phone: l.phone,
        Event: l.erpEvent,
        Status: l.status,
        Attempts: l.attempts || 0,
        Timestamp: new Date(l.createdAt).toLocaleString()
      }));

      generateCSV(['LogID', 'Recipient', 'Phone', 'Event', 'Status', 'Attempts', 'Timestamp'], formattedData, 'System_Outbound_Logs_Report');
      toast.success('System logs report downloaded', { id: 'rep' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate logs report', { id: 'rep' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <FileText className="w-7 h-7 text-primary" /> Reports & Exports
        </h1>
        <p className="page-subtitle">Download real-time CSV/PDF audit and performance reports directly from your database.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Student Master Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Complete list of registered students, contact details, active enrollments, and status records.</p>
            <Button onClick={handleDownloadStudentsReport} disabled={downloading} className="w-full gap-2">
              <Download className="w-4 h-4" /> Download Student Report (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Revenue & Fee Ledgers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Detailed financial breakdown of total fees, paid amounts, outstanding balances, and due dates.</p>
            <Button onClick={handleDownloadRevenueReport} disabled={downloading} className="w-full gap-2">
              <Download className="w-4 h-4" /> Download Financial Report (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-500" /> Outbound System Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Audit log of system notifications, delivery statuses, error codes, and correlation IDs.</p>
            <Button onClick={handleDownloadLogsReport} disabled={downloading} className="w-full gap-2">
              <Download className="w-4 h-4" /> Download Outbound Logs (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
