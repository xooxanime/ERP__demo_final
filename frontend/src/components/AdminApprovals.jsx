import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Mail, Phone, User, Briefcase, Baby } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminApprovals() {
  const { setAuthToken, setUser } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApprovalRequests();
  }, [filter]);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getApprovalRequests(filter);
      setRequests(response.data.data.requests);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await adminAPI.handleApproval(requestId, { action: 'approve' });
      // Backend returns updated token and user info
      const { token: newToken, user: updatedUser } = response.data.data;
      // Update auth context and local storage
      if (newToken) {
        localStorage.setItem('token', newToken);
        setAuthToken(newToken);
      }
      if (updatedUser) {
        setUser(updatedUser);
      }
      // Redirect based on new role
      if (updatedUser?.role) {
        const role = updatedUser.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'teacher') navigate('/teacher/dashboard');
        else if (role === 'parent') navigate('/parent/dashboard');
        else navigate('/student/dashboard');
      }
      await fetchApprovalRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await adminAPI.handleApproval(requestId, { action: 'reject', rejectionReason });
      await fetchApprovalRequests();
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" /> Pending</span>,
      approved: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" /> Approved</span>,
      rejected: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><XCircle className="w-4 h-4 mr-1" /> Rejected</span>
    };
    return badges[status] || badges.pending;
  };

  const getRoleIcon = (role) => {
    return role === 'teacher' ? <Briefcase className="w-5 h-5" /> : <Baby className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Access Requests</h2>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No access requests found</p>
          </div>
        ) : (
          requests.map(request => (
            <div
              key={request._id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getRoleIcon(request.requestedRole)}
                    <div>
                      <h3 className="font-semibold text-foreground">{request.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{request.requestedRole} Request</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {request.email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {request.phone}
                    </div>
                  </div>

                  {request.requestedRole === 'parent' && request.parentInfo && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p><strong>Student:</strong> {request.parentInfo.studentName}</p>
                      <p><strong>Relationship:</strong> {request.parentInfo.relationship}</p>
                    </div>
                  )}

                  {request.requestedRole === 'teacher' && request.teacherInfo && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p><strong>Specialization:</strong> {request.teacherInfo.specialization}</p>
                      <p><strong>Experience:</strong> {request.teacherInfo.experience}</p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  {getStatusBadge(request.status)}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">Request Details</h3>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{selectedRequest.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{selectedRequest.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-semibold capitalize">{selectedRequest.requestedRole}</p>
                </div>
              </div>

              {selectedRequest.requestedRole === 'teacher' && selectedRequest.teacherInfo && (
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Teacher Information</h4>
                  <div className="space-y-2">
                    <p><strong>Qualifications:</strong> {selectedRequest.teacherInfo.qualifications}</p>
                    <p><strong>Experience:</strong> {selectedRequest.teacherInfo.experience}</p>
                    <p><strong>Specialization:</strong> {selectedRequest.teacherInfo.specialization}</p>
                    <p><strong>Department:</strong> {selectedRequest.teacherInfo.department}</p>
                  </div>
                </div>
              )}

              {selectedRequest.requestedRole === 'parent' && selectedRequest.parentInfo && (
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Parent Information</h4>
                  <div className="space-y-2">
                    <p><strong>Student Name:</strong> {selectedRequest.parentInfo.studentName}</p>
                    <p><strong>Student Email:</strong> {selectedRequest.parentInfo.studentEmail}</p>
                    <p><strong>Relationship:</strong> {selectedRequest.parentInfo.relationship}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedRequest._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {selectedRequest.status !== 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
