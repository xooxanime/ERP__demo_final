import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  MessageSquare, Settings, BarChart2, List, Send, RefreshCw,
  CheckCircle, AlertTriangle, AlertCircle, Search, Info, HelpCircle,
  Eye, ToggleLeft, ToggleRight, Phone, Shield, Copy, Check, Trash,
  Play, Download, Plus, Star
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../components/ui/Table';
import toast from 'react-hot-toast';

export default function WhatsAppSettings() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [dlqLogs, setDlqLogs] = useState([]);
  const [dbTemplates, setDbTemplates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [dlqPagination, setDlqPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  
  // Filters
  const [searchPhone, setSearchPhone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  
  // Loading flags
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [dlqLoading, setDlqLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [submittingVersion, setSubmittingVersion] = useState(false);

  // Test form state
  const [testPhone, setTestPhone] = useState('');
  const [testEvent, setTestEvent] = useState('welcome_verification');
  const [testName, setTestName] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // New Version Form state
  const [newVersionTemplateName, setNewVersionTemplateName] = useState('welcome_verification');
  const [newVersionFallbackText, setNewVersionFallbackText] = useState('');
  const [newVersionLanguage, setNewVersionLanguage] = useState('en_US');

  // Fetch basic config and stats
  const fetchOverviewData = async () => {
    try {
      const [configRes, statsRes, queueRes] = await Promise.all([
        axios.get('/api/admin/whatsapp/config'),
        axios.get('/api/admin/whatsapp/stats'),
        axios.get('/api/admin/whatsapp/queue-stats')
      ]);

      if (configRes.data.status === 'success') setConfig(configRes.data.data);
      if (statsRes.data.status === 'success') setStats(statsRes.data.data);
      if (queueRes.data.status === 'success') setQueueStats(queueRes.data.data);
    } catch (err) {
      console.error('Error fetching configuration stats:', err);
    }
  };

  // Fetch logs
  const fetchLogsData = async (page = 1) => {
    try {
      setLogsLoading(true);
      let url = `/api/admin/whatsapp/logs?page=${page}&limit=10`;
      if (searchPhone) url += `&phone=${searchPhone}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterEvent) url += `&erpEvent=${filterEvent}`;

      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setLogs(res.data.data.logs);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch DLQ logs
  const fetchDLQLogsData = async (page = 1) => {
    try {
      setDlqLoading(true);
      const res = await axios.get(`/api/admin/whatsapp/logs?page=${page}&limit=10&isDLQ=true`);
      if (res.data.status === 'success') {
        setDlqLogs(res.data.data.logs);
        setDlqPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching DLQ logs:', err);
    } finally {
      setDlqLoading(false);
    }
  };

  // Fetch DB Templates Catalog
  const fetchTemplatesData = async () => {
    try {
      const res = await axios.get('/api/admin/whatsapp/templates');
      if (res.data.status === 'success') {
        setDbTemplates(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching versioned templates:', err);
    }
  };

  const handleExportJSON = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogsData(1);
  };

  const clearFilters = () => {
    setSearchPhone('');
    setFilterStatus('');
    setFilterEvent('');
    fetchLogsData(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchOverviewData(),
      fetchLogsData(pagination.page),
      fetchDLQLogsData(dlqPagination.page),
      fetchTemplatesData()
    ]);
    setRefreshing(false);
    toast.success('Enterprise console metrics synchronized');
  };

  useEffect(() => {
    const bootstrapData = async () => {
      setLoading(true);
      try {
        await Promise.allSettled([
          fetchOverviewData(),
          fetchLogsData(1),
          fetchDLQLogsData(1),
          fetchTemplatesData()
        ]);
      } catch (err) {
        console.error('Error bootstrapping settings data:', err);
      } finally {
        setLoading(false);
      }
    };
    bootstrapData();
  }, []);

  // Trigger test send
  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testPhone) {
      toast.error('Please enter a test phone number');
      return;
    }

    try {
      setSendingTest(true);
      const res = await axios.post('/api/admin/whatsapp/test', {
        phone: testPhone,
        erpEvent: testEvent,
        testName: testName || 'Test Student'
      });

      if (res.data.status === 'success') {
        toast.success(`Job enqueued inside background pipeline!`);
        fetchOverviewData();
        fetchLogsData(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error enqueuing test message');
    } finally {
      setSendingTest(false);
    }
  };

  // Submit template version
  const handleCreateTemplateVersion = async (e) => {
    e.preventDefault();
    if (!newVersionFallbackText) {
      toast.error('Please enter fallback text variables');
      return;
    }

    try {
      setSubmittingVersion(true);
      const res = await axios.post('/api/admin/whatsapp/templates/version', {
        templateName: newVersionTemplateName,
        fallbackText: newVersionFallbackText,
        language: newVersionLanguage
      });

      if (res.data.status === 'success') {
        toast.success(`Template version upgraded!`);
        setNewVersionFallbackText('');
        fetchTemplatesData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating version');
    } finally {
      setSubmittingVersion(false);
    }
  };

  // Toggle template active version
  const handleToggleTemplate = async (id) => {
    try {
      const res = await axios.patch(`/api/admin/whatsapp/templates/${id}/toggle`);
      if (res.data.status === 'success') {
        toast.success('Active version mapping updated');
        fetchTemplatesData();
      }
    } catch (err) {
      toast.error('Failed to toggle version');
    }
  };

  // Reprocess DLQ
  const handleReprocessDLQ = async (id) => {
    try {
      const res = await axios.post(`/api/admin/whatsapp/dlq/reprocess/${id}`);
      if (res.data.status === 'success') {
        toast.success('Failed job enqueued back to retry queue');
        handleRefresh();
      }
    } catch (err) {
      toast.error('Failed to reprocess DLQ job');
    }
  };

  // Bulk Reprocess DLQ
  const handleBulkReprocessDLQ = async () => {
    try {
      const res = await axios.post('/api/admin/whatsapp/dlq/reprocess');
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Bulk reprocess triggered successfully');
        handleRefresh();
      }
    } catch (err) {
      toast.error('Failed to reprocess bulk DLQ');
    }
  };

  // Delete DLQ log
  const handleDeleteDLQ = async (id) => {
    if (!window.confirm('Delete this failed DLQ job record?')) return;
    try {
      const res = await axios.delete(`/api/admin/whatsapp/dlq/${id}`);
      if (res.data.status === 'success') {
        toast.success('Failed DLQ record deleted');
        handleRefresh();
      }
    } catch (err) {
      toast.error('Failed to delete DLQ record');
    }
  };

  // Bulk Delete DLQ
  const handleBulkDeleteDLQ = async () => {
    if (!window.confirm('Clear all failed DLQ logs from system?')) return;
    try {
      const res = await axios.delete('/api/admin/whatsapp/dlq');
      if (res.data.status === 'success') {
        toast.success('All DLQ logs purged successfully');
        handleRefresh();
      }
    } catch (err) {
      toast.error('Failed to clear bulk DLQ');
    }
  };

  const copyVerifyToken = () => {
    if (config?.verifyToken) {
      navigator.clipboard.writeText(config.verifyToken);
      setCopiedToken(true);
      toast.success('Verification Token copied!');
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Status badges formatter
  const getStatusBadge = (status) => {
    switch (status) {
      case 'read':
        return <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Read</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Delivered</Badge>;
      case 'sent':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Sent</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'failed':
      default:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm font-mono">Loading Enterprise Notification Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Enterprise Control Center
          </h1>
          <p className="text-muted-foreground text-sm">Hardened Redis/BullMQ pipelines, idempotency shields, template versioning engines, and observability logs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2 self-end border-border">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Sync Center
        </Button>
      </div>

      {/* Ribbon Banner for Queue Connection status */}
      <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${queueStats?.mode === 'REDIS' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-amber-950/20 border-amber-500/20 text-amber-400'}`}>
        <div className="flex items-center gap-3">
          {queueStats?.mode === 'REDIS' ? (
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          )}
          <div>
            <h4 className="font-semibold text-sm">Queue Mode: {queueStats?.mode === 'REDIS' ? 'REDIS + BULLMQ ACTIVE' : 'VIRTUAL MEMORY ACTIVE'}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {queueStats?.mode === 'REDIS'
                ? 'Fault-tolerant job scheduling and concurrency control managed by Redis database memory.'
                : 'Redis connection offline. Automatically fell back to Virtual Queue Simulator to maintain zero app crashes.'
              }
            </p>
          </div>
        </div>
        <Badge variant={queueStats?.mode === 'REDIS' ? 'success' : 'warning'} className="ml-4 font-semibold text-xs py-1">
          {queueStats?.mode} MODE
        </Badge>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <BarChart2 className="h-4 w-4" />
          Queue & Metrics
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'logs' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <List className="h-4 w-4" />
          Outbound Logs
        </button>
        <button
          onClick={() => setActiveTab('dlq')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dlq' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <AlertCircle className="h-4 w-4" />
          Dead Letter Queue (DLQ)
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'test' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Send className="h-4 w-4" />
          Sandbox Trigger
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'templates' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <MessageSquare className="h-4 w-4" />
          Templates & Versioning
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="h-4 w-4" />
          API Setup
        </button>
      </div>

      {/* Tab: Dashboard Metrics */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Queue Waiting</p>
                <h3 className="text-2xl font-bold mt-1 text-white">{queueStats?.waiting || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Active workers</p>
                <h3 className="text-2xl font-bold mt-1 text-primary">{queueStats?.active || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Queue Delayed</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-400">{queueStats?.delayed || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Queue Failed</p>
                <h3 className="text-2xl font-bold mt-1 text-rose-500">{queueStats?.failed || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-card border-border col-span-2 md:col-span-1">
              <CardContent className="pt-6">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">DLQ Records</p>
                <h3 className="text-2xl font-bold mt-1 text-red-500">{queueStats?.dlq || 0}</h3>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Circuit Breaker Status */}
            <Card className="bg-card border-border flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-white">Circuit Breaker Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Gateway Status</span>
                  <Badge variant={config?.circuitBreaker?.state === 'OPEN' ? 'destructive' : 'success'} className="font-mono text-xs">
                    {config?.circuitBreaker?.state || 'CLOSED'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Failure Count</span>
                  <span className="font-mono text-white">{config?.circuitBreaker?.failures || 0} / 5</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Cooldown Remaining</span>
                  <span className="font-mono text-white">
                    {config?.circuitBreaker?.cooldownRemaining ? `${Math.ceil(config.circuitBreaker.cooldownRemaining / 1000)}s` : '0s'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
                  The circuit breaker dynamically stops sending HTTP payloads to Meta if successive client fails exceed 5, routing messages directly to retry queues and protecting ERP processing threads.
                </p>
              </CardContent>
            </Card>

            {/* Delivery Latency & Volume */}
            <Card className="bg-card border-border md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Volume Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-48 flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-emerald-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Read messages</span>
                    <span>{stats?.summary?.read || 0} / {stats?.summary?.total || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats?.summary?.total > 0 ? (stats.summary.read / stats.summary.total) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-blue-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Delivered messages</span>
                    <span>{stats?.summary?.delivered || 0} / {stats?.summary?.total || 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats?.summary?.total > 0 ? (stats.summary.delivered / stats.summary.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Outbound Logs */}
      {activeTab === 'logs' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-3 items-end flex-1">
              <div className="w-full sm:w-48 space-y-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Search Phone</label>
                <Input
                  placeholder="e.g. +9198765"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="w-32 space-y-1">
                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring h-8"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="delivered">Delivered</option>
                  <option value="read">Read</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex gap-2 h-8 items-center">
                <Button type="submit" size="sm" className="h-8">Filter</Button>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="h-8 border-border">Clear</Button>
              </div>
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportJSON(logs, 'whatsapp_outbound_logs')}
              className="gap-1.5 text-xs border-border h-8"
            >
              <Download className="h-3.5 w-3.5" />
              Export Logs
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {logsLoading ? (
              <div className="flex justify-center items-center h-48">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Event / Correlation ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs && logs.length > 0 ? (
                      logs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="font-medium text-white">
                            {log.recipientId?.name || 'Simulator (Manual)'}
                            <span className="block text-[10px] text-muted-foreground">{log.recipientId?.role || 'admin'}</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{log.phone}</TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-white block">{log.erpEvent}</span>
                            <span className="block text-[9px] text-muted-foreground font-mono">
                              Corr ID: {log.correlationId || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{log.attempts || log.retries || 0}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty colSpan={6} message="No WhatsApp delivery logs found." />
                    )}
                  </TableBody>
                </Table>

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border text-xs text-muted-foreground">
                    <p>Page {pagination.page} of {pagination.pages} ({pagination.total} total logs)</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => fetchLogsData(pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchLogsData(pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Dead Letter Queue (DLQ) */}
      {activeTab === 'dlq' && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-base">DLQ Management Panel</CardTitle>
              <p className="text-xs text-muted-foreground">Failed transaction alerts enqueued here. reprocess or purge logs manually.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReprocessDLQ}
                disabled={dlqLogs.length === 0}
                className="gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              >
                <Play className="h-3.5 w-3.5" />
                Retry All Failed
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeleteDLQ}
                disabled={dlqLogs.length === 0}
                className="gap-1 bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-950/40"
              >
                <Trash className="h-3.5 w-3.5" />
                Clear DLQ
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {dlqLoading ? (
              <div className="flex justify-center items-center h-48">
                <RefreshCw className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Template / Event</TableHead>
                      <TableHead>Failure Reason</TableHead>
                      <TableHead>Correlation ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dlqLogs && dlqLogs.length > 0 ? (
                      dlqLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="font-medium text-white">{log.recipientId?.name || 'Manual Send'}</TableCell>
                          <TableCell className="font-mono text-xs">{log.phone}</TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-white block">{log.erpEvent}</span>
                            <span className="block text-[10px] text-muted-foreground font-mono">Template: {log.templateName}</span>
                          </TableCell>
                          <TableCell className="text-xs text-rose-500 font-mono max-w-xs truncate">{log.failureReason || 'Exceeded retry limit'}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{log.correlationId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReprocessDLQ(log._id)}
                                className="h-7 w-7 p-0 text-emerald-500 border-emerald-500/20 hover:bg-emerald-950/20"
                                title="Reprocess Job"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDLQ(log._id)}
                                className="h-7 w-7 p-0 text-red-500 border-red-500/20 hover:bg-red-950/20"
                                title="Delete Log"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty colSpan={6} message="All queues running clear. Dead Letter Queue empty!" />
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Send Test Message */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader><CardTitle className="text-white text-base">Outbound Sandbox Sender</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSendTest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      Recipient Phone
                    </label>
                    <Input
                      placeholder="e.g. +919876543210"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">Will route through active queue adapter.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white">Recipient Name</label>
                    <Input
                      placeholder="e.g. Student User"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white">Select Event</label>
                  <select
                    value={testEvent}
                    onChange={(e) => setTestEvent(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring h-9"
                  >
                    <option value="welcome_verification">welcome_verification</option>
                    <option value="account_approved">account_approved</option>
                    <option value="password_reset">password_reset</option>
                    <option value="live_class_scheduled">live_class_scheduled</option>
                    <option value="payment_success">payment_success</option>
                    <option value="low_attendance_warning">low_attendance_warning</option>
                  </select>
                </div>

                <Button type="submit" disabled={sendingTest} className="gap-2">
                  <Send className="h-4 w-4" />
                  {sendingTest ? 'Enqueuing...' : 'Trigger Sandbox Notification'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Templates & Versioning */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Version Upgrade Form */}
            <Card className="bg-card border-border lg:col-span-1 h-fit">
              <CardHeader><CardTitle className="text-white text-base">Upgrading Template Version</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTemplateVersion} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">Template Name</label>
                    <select
                      value={newVersionTemplateName}
                      onChange={(e) => setNewVersionTemplateName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none h-9"
                    >
                      <option value="welcome_verification">welcome_verification</option>
                      <option value="account_approved">account_approved</option>
                      <option value="password_reset">password_reset</option>
                      <option value="live_class_scheduled">live_class_scheduled</option>
                      <option value="payment_success">payment_success</option>
                      <option value="low_attendance_warning">low_attendance_warning</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">Fallback Text Payload</label>
                    <Input
                      placeholder="e.g. Welcome {{1}}! Your role is {{2}}."
                      value={newVersionFallbackText}
                      onChange={(e) => setNewVersionFallbackText(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">Use variable placeholders (e.g. {'{{1}}'}, {'{{2}}'}).</p>
                  </div>

                  <Button type="submit" disabled={submittingVersion} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {submittingVersion ? 'Creating version...' : 'Publish New Version'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Versioned List Catalog */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader><CardTitle className="text-white text-base">Published Template Catalogue</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Key</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Fallback Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbTemplates && dbTemplates.length > 0 ? (
                      dbTemplates.map((tpl) => (
                        <TableRow key={tpl._id}>
                          <TableCell className="font-mono text-xs text-white font-semibold">{tpl.templateName}</TableCell>
                          <TableCell className="font-mono text-xs">v{tpl.version}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{tpl.language}</TableCell>
                          <TableCell className="text-xs font-mono max-w-xs truncate">{tpl.fallbackText}</TableCell>
                          <TableCell>
                            <Badge variant={tpl.isActive ? 'success' : 'outline'} className={tpl.isActive ? '' : 'text-muted-foreground border-border'}>
                              {tpl.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {!tpl.isActive ? (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleToggleTemplate(tpl._id)}
                                className="h-7 text-[10px] border-border hover:bg-muted gap-1 text-white"
                              >
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                Make Active
                              </Button>
                            ) : (
                              <span className="text-[10px] text-emerald-500 font-semibold pr-2 flex items-center gap-1 justify-end">
                                <Check className="h-3.5 w-3.5" />
                                Current
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty colSpan={6} message="No templates seeded in database yet. click Sync Center to bootstrap." />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: API Config */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-white text-base">Meta Webhook Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Callback URL</label>
                <div className="flex gap-2">
                  <Input readOnly value={config?.webhookUrl || ''} className="bg-muted border-border font-mono text-xs flex-1 text-white" />
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(config?.webhookUrl || '');
                    toast.success('Callback URL copied!');
                  }}>Copy</Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Verify Token</label>
                <div className="flex gap-2">
                  <Input readOnly value={config?.verifyToken || ''} className="bg-muted border-border font-mono text-xs flex-1 text-white" />
                  <Button variant="outline" size="sm" onClick={copyVerifyToken}>
                    {copiedToken ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-white text-base">API Configurations</CardTitle></CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">WHATSAPP_ENABLED</span>
                <span className="font-semibold text-white">{config?.enabled ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">WHATSAPP_API_VERSION</span>
                <span className="font-semibold text-white">{config?.apiVersion || 'v19.0'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">WHATSAPP_PHONE_NUMBER_ID</span>
                <span className="font-semibold text-white">{config?.phoneNumberId}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
