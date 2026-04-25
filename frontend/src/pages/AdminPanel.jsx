import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import Modal, { ConfirmModal } from '../components/Modal';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, action: null, name: '' });
  const [docModal, setDocModal] = useState({ open: false, url: '', title: '' });
  const [userFilter, setUserFilter] = useState({ role: '', status: '', search: '' });

  const fetchAnalytics = async () => {
    try {
      const res = await adminAPI.getAnalytics();
      setAnalytics(res.data.analytics);
    } catch { toast.error('Failed to load analytics'); }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ ...userFilter, limit: 100 });
      setUsers(res.data.users);
    } catch { toast.error('Failed to load users'); }
  };

  const fetchDonations = async () => {
    try {
      const res = await adminAPI.getDonations({ limit: 100 });
      setDonations(res.data.donations);
    } catch { toast.error('Failed to load donations'); }
  };

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchUsers(), fetchDonations()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [userFilter, activeTab]);

  const handleAction = async () => {
    const { id, action } = confirmModal;
    try {
      if (action === 'approve') await adminAPI.approveUser(id);
      else if (action === 'reject') await adminAPI.rejectUser(id);
      toast.success(`User ${action}d successfully`);
      setConfirmModal({ open: false, id: null, action: null, name: '' });
      fetchUsers();
      fetchAnalytics();
    } catch { toast.error(`Failed to ${action} user`); }
  };

  const roleLabels = { donor: '🧑‍🍳 Donor', ngo: '🏢 NGO', volunteer: '🚴 Volunteer' };
  const statusColor = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

  const pieData = analytics ? [
    { name: 'Donors', value: analytics.usersByRole.donors },
    { name: 'NGOs', value: analytics.usersByRole.ngos },
    { name: 'Volunteers', value: analytics.usersByRole.volunteers },
  ] : [];

  const donationBarData = analytics ? [
    { name: 'Pending', value: analytics.donations.pending },
    { name: 'Accepted', value: analytics.donations.accepted },
    { name: 'Delivered', value: analytics.donations.delivered },
    { name: 'Cancelled', value: analytics.donations.cancelled },
    { name: 'Rejected', value: analytics.donations.rejected },
  ] : [];

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'users', label: '👥 Users' },
    { key: 'donations', label: '🍽 Donations' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="page-header">🛡 Admin Panel</h1>
          <p className="text-gray-500 dark:text-gray-400">Food Bridge Platform Management</p>
        </div>

        {/* Tab nav */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-all ${activeTab === t.key ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6 animate-fade-in">
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard icon="👥" label="Total Users" value={analytics.users.total} color="brand" />
              <StatsCard icon="⏳" label="Pending Approval" value={analytics.users.pending} color="yellow" />
              <StatsCard icon="🍽" label="Total Donations" value={analytics.donations.total} color="blue" />
              <StatsCard icon="✅" label="Delivered" value={analytics.donations.delivered} color="teal" />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Users by Role</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={e => e.name}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Donation Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={donationBarData} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#22c55e" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent donations */}
            <div className="card p-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Recent Donations</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      {['Food', 'Donor', 'Qty (kg)', 'Status', 'Date'].map(h => <th key={h} className="th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {analytics.recentDonations.map(d => (
                      <tr key={d._id} className="tr">
                        <td className="td font-semibold">{d.foodName}</td>
                        <td className="td">{d.donorName}</td>
                        <td className="td">{d.quantity}</td>
                        <td className="td"><StatusBadge status={d.status} /></td>
                        <td className="td">{new Date(d.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="space-y-5 animate-fade-in">
            {/* Filters */}
            <div className="card p-4 flex flex-wrap gap-3">
              <input
                className="input max-w-xs py-2"
                placeholder="🔍 Search name or email..."
                value={userFilter.search}
                onChange={e => setUserFilter(p => ({ ...p, search: e.target.value }))}
              />
              <select className="input max-w-[160px] py-2" value={userFilter.role} onChange={e => setUserFilter(p => ({ ...p, role: e.target.value }))}>
                <option value="">All Roles</option>
                <option value="donor">Donor</option>
                <option value="ngo">NGO</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <select className="input max-w-[160px] py-2" value={userFilter.status} onChange={e => setUserFilter(p => ({ ...p, status: e.target.value }))}>
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="card overflow-hidden">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      {['User', 'Role', 'Phone', 'ID Proof', 'Documents', 'Status', 'Actions'].map(h => (
                        <th key={h} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {users.length === 0 ? (
                      <tr><td colSpan={7} className="td text-center py-8 text-gray-400">No users found</td></tr>
                    ) : users.map(u => (
                      <tr key={u._id} className="tr">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <img
                              src={u.profilePhoto ? `/uploads/profiles/${u.profilePhoto}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=16a34a&color=fff&size=40`}
                              className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                              alt=""
                            />
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td"><span className={u.role === 'ngo' ? 'badge-blue' : u.role === 'volunteer' ? 'badge-yellow' : 'badge-green'}>{roleLabels[u.role] || u.role}</span></td>
                        <td className="td text-sm">{u.phone}</td>
                        <td className="td text-xs">
                          {u.idType && <span className="badge-gray mr-1">{u.idType}</span>}
                          {u.idNumber && <span className="text-gray-600 dark:text-gray-400">{u.idNumber}</span>}
                        </td>
                        <td className="td">
                          <div className="flex flex-col gap-1">
                            {u.idFile && (
                              <button
                                onClick={() => setDocModal({ open: true, url: `/uploads/documents/${u.idFile}`, title: 'ID Proof' })}
                                className="text-xs text-blue-500 hover:underline"
                              >📄 ID Proof</button>
                            )}
                            {u.roleData?.ngoCertificate && (
                              <button
                                onClick={() => setDocModal({ open: true, url: `/uploads/documents/${u.roleData.ngoCertificate}`, title: 'NGO Certificate' })}
                                className="text-xs text-blue-500 hover:underline"
                              >📋 NGO Cert</button>
                            )}
                          </div>
                        </td>
                        <td className="td"><span className={statusColor[u.status]}>{u.status}</span></td>
                        <td className="td">
                          <div className="flex gap-2">
                            {u.status !== 'approved' && (
                              <button
                                onClick={() => setConfirmModal({ open: true, id: u._id, action: 'approve', name: u.name })}
                                className="text-xs btn-primary py-1.5 px-3"
                              >Approve</button>
                            )}
                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => setConfirmModal({ open: true, id: u._id, action: 'reject', name: u.name })}
                                className="text-xs btn-danger py-1.5 px-3"
                              >Reject</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DONATIONS */}
        {activeTab === 'donations' && (
          <div className="animate-fade-in">
            <div className="card overflow-hidden">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      {['Food', 'Donor', 'Qty', 'NGO', 'Volunteer', 'District', 'Status', 'Date'].map(h => (
                        <th key={h} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {donations.length === 0 ? (
                      <tr><td colSpan={8} className="td text-center py-8 text-gray-400">No donations yet</td></tr>
                    ) : donations.map(d => (
                      <tr key={d._id} className="tr">
                        <td className="td font-semibold">{d.foodName}</td>
                        <td className="td">
                          <p className="text-sm">{d.donorId?.name || d.donorName}</p>
                          <p className="text-xs text-gray-400">{d.donorId?.phone}</p>
                        </td>
                        <td className="td">{d.quantity} kg</td>
                        <td className="td text-xs">{d.ngoName || '—'}</td>
                        <td className="td text-xs">{d.volunteerName || '—'}</td>
                        <td className="td text-xs">{d.pickupAddress?.district || '—'}</td>
                        <td className="td"><StatusBadge status={d.status} /></td>
                        <td className="td text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, id: null, action: null, name: '' })}
        onConfirm={handleAction}
        title={confirmModal.action === 'approve' ? 'Approve Account' : 'Reject Account'}
        message={`Are you sure you want to ${confirmModal.action} ${confirmModal.name}'s account?`}
        confirmLabel={confirmModal.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
        danger={confirmModal.action === 'reject'}
      />

      {/* Document viewer modal */}
      <Modal isOpen={docModal.open} onClose={() => setDocModal({ open: false, url: '', title: '' })} title={docModal.title} size="xl">
        {docModal.url.endsWith('.pdf') ? (
          <iframe src={docModal.url} className="w-full h-96 rounded-xl" title="Document" />
        ) : (
          <img src={docModal.url} className="w-full rounded-xl max-h-[500px] object-contain" alt="Document" />
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel;
