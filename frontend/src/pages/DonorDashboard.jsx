import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import { ConfirmModal } from '../components/Modal';
import MapPicker from '../components/MapPicker';
import ProfileUpload from '../components/ProfileUpload';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, cancelled: 0, delivered: 0 });
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, id: null });
  const [activeTab, setActiveTab] = useState('all');
  const foodPhotoRef = useRef();

  const [form, setForm] = useState({
    foodName: '', foodType: 'veg', quantity: '', servesCount: '', description: '',
    pickupTime: '', expiryTime: '', lat: user?.address?.lat || 17.385, lng: user?.address?.lng || 78.4867,
  });
  const [foodPhoto, setFoodPhoto] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.foodName || !form.quantity) { toast.error('Food name and quantity are required'); return; }

    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (foodPhoto) fd.append('foodPhoto', foodPhoto);

    try {
      await donationAPI.create(fd);
      toast.success('Donation submitted successfully! 🎉');
      setForm({ foodName: '', foodType: 'veg', quantity: '', servesCount: '', description: '', pickupTime: '', expiryTime: '', lat: form.lat, lng: form.lng });
      setFoodPhoto(null);
      if (foodPhotoRef.current) foodPhotoRef.current.value = '';
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit donation');
    } finally { setSubmitting(false); }
  };

  const handleCancel = async () => {
    try {
      await donationAPI.cancel(cancelModal.id, {});
      toast.success('Donation cancelled');
      setCancelModal({ open: false, id: null });
      fetchData();
    } catch { toast.error('Failed to cancel'); }
  };

  const filteredDonations = activeTab === 'all' ? donations : donations.filter(d => d.status === activeTab);

  const tabs = [
    { key: 'all', label: 'All', count: donations.length },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'accepted', label: 'Accepted', count: stats.accepted },
    { key: 'delivered', label: 'Delivered', count: stats.delivered },
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
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="page-header">🧑‍🍳 Donor Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">Welcome back, <strong>{user?.name}</strong>!</p>
          </div>
          {user?.status === 'pending' && (
            <div className="badge-yellow px-4 py-2 text-sm rounded-xl animate-pulse-slow">
              ⏳ Account pending admin approval
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* LEFT — Profile + Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="card p-6 text-center">
              <ProfileUpload />
              <h3 className="font-bold text-gray-900 dark:text-white mt-3">{user?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="mt-2 flex justify-center"><span className="badge-green">Donor</span></div>
              {user?.address?.full && (
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">📍 {user.address.full}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatsCard icon="🍽" label="Total" value={stats.total} color="brand" />
              <StatsCard icon="⏳" label="Pending" value={stats.pending} color="yellow" />
              <StatsCard icon="✅" label="Accepted" value={stats.accepted} color="blue" />
              <StatsCard icon="🚚" label="Delivered" value={stats.delivered} color="teal" />
            </div>
          </div>

          {/* RIGHT — Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Donation Form */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">➕</span>
                Submit New Donation
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Food Name *</label>
                    <input className="input" placeholder="e.g. Veg Biryani" value={form.foodName} onChange={e => setForm(p => ({ ...p, foodName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="input-label">Food Type</label>
                    <select className="input" value={form.foodType} onChange={e => setForm(p => ({ ...p, foodType: e.target.value }))}>
                      <option value="veg">🥗 Vegetarian</option>
                      <option value="non-veg">🍗 Non-Vegetarian</option>
                      <option value="both">🍱 Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Quantity (kg) *</label>
                    <input type="number" min="0.1" step="0.1" className="input" placeholder="e.g. 5" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="input-label">Serves (People)</label>
                    <input type="number" min="1" className="input" placeholder="e.g. 20" value={form.servesCount} onChange={e => setForm(p => ({ ...p, servesCount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="input-label">Pickup Time</label>
                    <input type="time" className="input" value={form.pickupTime} onChange={e => setForm(p => ({ ...p, pickupTime: e.target.value }))} />
                  </div>
                  <div>
                    <label className="input-label">Expiry Time</label>
                    <input type="time" className="input" value={form.expiryTime} onChange={e => setForm(p => ({ ...p, expiryTime: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Description (optional)</label>
                  <textarea className="input resize-none" rows={2} placeholder="Any notes about the food..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">📍 Confirm Pickup Location</label>
                  <MapPicker lat={form.lat} lng={form.lng} onLocationSelect={(lat, lng) => setForm(p => ({ ...p, lat, lng }))} />
                </div>
                <div>
                  <label className="input-label">Food Photo (optional)</label>
                  <input ref={foodPhotoRef} type="file" accept="image/*" className="input text-sm" onChange={e => setFoodPhoto(e.target.files[0])} />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
                  {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</span> : '🍽 Submit Donation'}
                </button>
              </form>
            </div>

            {/* Donations Table */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Donations</h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {t.label} {t.count > 0 && <span className="ml-1 opacity-80">({t.count})</span>}
                  </button>
                ))}
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      {['Food', 'Qty (kg)', 'NGO', 'Date', 'Status', 'Action'].map(h => (
                        <th key={h} className="th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredDonations.length === 0 ? (
                      <tr><td colSpan={6} className="td text-center py-8 text-gray-400">No donations found</td></tr>
                    ) : filteredDonations.map(d => (
                      <tr key={d._id} className="tr">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            {d.foodPhoto && <img src={`/uploads/food/${d.foodPhoto}`} className="w-10 h-10 rounded-lg object-cover" alt="" />}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{d.foodName}</p>
                              <p className="text-xs text-gray-400">{d.foodType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="td font-semibold">{d.quantity}</td>
                        <td className="td">{d.ngoName || <span className="text-gray-400">—</span>}</td>
                        <td className="td">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="td"><StatusBadge status={d.status} /></td>
                        <td className="td">
                          {['pending', 'accepted'].includes(d.status) && (
                            <button
                              onClick={() => setCancelModal({ open: true, id: d._id })}
                              className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, id: null })}
        onConfirm={handleCancel}
        title="Cancel Donation"
        message="Are you sure you want to cancel this donation? This cannot be undone."
        confirmLabel="Yes, Cancel"
        danger
      />
    </div>
  );
};

export default DonorDashboard;
