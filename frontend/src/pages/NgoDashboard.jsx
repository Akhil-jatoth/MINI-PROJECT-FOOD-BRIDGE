import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import Modal, { ConfirmModal } from '../components/Modal';
import MapPicker from '../components/MapPicker';
import ProfileUpload from '../components/ProfileUpload';

const NgoDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const fetchData = async () => {
    try {
      const [statsRes, donRes] = await Promise.all([
        donationAPI.getStats(),
        donationAPI.getAll({ page: 1, limit: 50 }),
      ]);
      setStats(statsRes.data.stats);
      setDonations(donRes.data.donations);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAccept = async (id) => {
    try {
      await donationAPI.accept(id);
      toast.success('Donation accepted! Donor has been notified. ✅');
      fetchData();
      setSelectedDonation(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept'); }
  };

  const handleReject = async () => {
    try {
      await donationAPI.reject(rejectModal.id, { reason: rejectReason });
      toast.success('Donation rejected');
      setRejectModal({ open: false, id: null });
      setRejectReason('');
      fetchData();
    } catch { toast.error('Failed to reject'); }
  };

  const filteredDonations = activeTab === 'all' ? donations : donations.filter(d => d.status === activeTab);

  const tabs = [
    { key: 'pending', label: '⏳ Pending', count: stats.pending },
    { key: 'accepted', label: '✅ Accepted', count: stats.accepted },
    { key: 'delivered', label: '🚚 Delivered', count: stats.delivered },
    { key: 'all', label: 'All' },
  ];

  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-header">🏢 NGO Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.roleData?.organizationName || user?.name} — Manage incoming food donations
            </p>
          </div>
          {stats.pending > 0 && (
            <div className="badge-yellow px-4 py-2 text-sm rounded-xl animate-pulse-slow">
              🔔 {stats.pending} pending donation{stats.pending !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 text-center">
              <ProfileUpload />
              <h3 className="font-bold text-gray-900 dark:text-white mt-3">{user?.roleData?.organizationName || user?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="mt-2 flex justify-center"><span className="badge-blue">NGO Partner</span></div>
              {user?.roleData?.serviceAreaRadius && (
                <p className="text-xs text-gray-400 mt-2">Service radius: {user.roleData.serviceAreaRadius} km</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatsCard icon="📩" label="Pending" value={stats.pending} color="yellow" />
              <StatsCard icon="✅" label="Accepted" value={stats.accepted} color="brand" />
              <StatsCard icon="🚚" label="Delivered" value={stats.delivered} color="teal" />
              <StatsCard icon="📊" label="Total" value={stats.total} color="blue" />
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-3 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Food Donation Requests</h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {t.label} {t.count !== undefined && t.count > 0 && <span className="opacity-80">({t.count})</span>}
                  </button>
                ))}
              </div>

              {/* Donation Cards */}
              {filteredDonations.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-5xl">📭</span>
                  <p className="text-gray-400 mt-4">No donations in this category</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredDonations.map(d => (
                    <div
                      key={d._id}
                      className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedDonation(d)}
                    >
                      {/* Food photo */}
                      {d.foodPhoto && (
                        <img
                          src={`/uploads/food/${d.foodPhoto}`}
                          className="w-full h-32 object-cover rounded-xl mb-3"
                          alt={d.foodName}
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100">{d.foodName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{d.donorName} · {d.quantity} kg</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="mt-3 text-xs text-gray-400 space-y-1">
                        <p>📍 {d.pickupAddress?.district || 'Unknown'}</p>
                        <p>📞 {d.donorPhone}</p>
                        <p>🕐 {new Date(d.createdAt).toLocaleString()}</p>
                      </div>
                      {d.status === 'pending' && (
                        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleAccept(d._id)} className="btn-primary text-xs py-2 flex-1">✅ Accept</button>
                          <button onClick={() => { setRejectModal({ open: true, id: d._id }); }} className="btn-danger text-xs py-2 flex-1">✗ Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Donation Details" size="lg">
        {selectedDonation && (
          <div className="space-y-4">
            {selectedDonation.foodPhoto && (
              <img src={`/uploads/food/${selectedDonation.foodPhoto}`} className="w-full h-48 object-cover rounded-xl" alt="" />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">Food Name</p><p className="font-semibold">{selectedDonation.foodName}</p></div>
              <div><p className="text-xs text-gray-400">Quantity</p><p className="font-semibold">{selectedDonation.quantity} kg</p></div>
              <div><p className="text-xs text-gray-400">Donor</p><p className="font-semibold">{selectedDonation.donorName}</p></div>
              <div><p className="text-xs text-gray-400">Phone</p><p className="font-semibold">{selectedDonation.donorPhone}</p></div>
              <div><p className="text-xs text-gray-400">Pickup Time</p><p className="font-semibold">{selectedDonation.pickupTime || '—'}</p></div>
              <div><p className="text-xs text-gray-400">Expiry Time</p><p className="font-semibold">{selectedDonation.expiryTime || '—'}</p></div>
            </div>
            {selectedDonation.description && (
              <div><p className="text-xs text-gray-400">Notes</p><p className="text-sm">{selectedDonation.description}</p></div>
            )}
            {selectedDonation.pickupAddress?.lat && (
              <MapPicker lat={selectedDonation.pickupAddress.lat} lng={selectedDonation.pickupAddress.lng} readOnly />
            )}
            {selectedDonation.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => { handleAccept(selectedDonation._id); }} className="btn-primary flex-1">✅ Accept Donation</button>
                <button onClick={() => { setRejectModal({ open: true, id: selectedDonation._id }); setSelectedDonation(null); }} className="btn-danger flex-1">✗ Reject</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, id: null })} title="Reject Donation" size="sm">
        <div className="space-y-4">
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Reason for rejection (optional)"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <button onClick={() => setRejectModal({ open: false, id: null })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleReject} className="btn-danger flex-1">Reject</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NgoDashboard;
