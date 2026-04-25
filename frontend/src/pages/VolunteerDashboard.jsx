import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { donationAPI } from '../services/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import StatsCard from '../components/StatsCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
import ProfileUpload from '../components/ProfileUpload';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [available, setAvailable] = useState([]);  // accepted NGO donations <= 3kg
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [stats, setStats] = useState({ total: 0, picked_up: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  const fetchData = async () => {
    try {
      const [statsRes, availRes, myRes] = await Promise.all([
        donationAPI.getStats(),
        donationAPI.getAll({ page: 1, limit: 50 }),
        donationAPI.getAll({ status: 'picked_up', page: 1, limit: 50 }),
      ]);
      setStats(statsRes.data.stats);
      setAvailable(availRes.data.donations);
      // "my deliveries" = donations where assignedVolunteer = me
      setMyDeliveries(myRes.data.donations.filter(d => d.assignedVolunteer?._id === user?.id || d.assignedVolunteer === user?.id));
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAcceptDelivery = async (id) => {
    try {
      await donationAPI.assignVolunteer(id);
      toast.success('Delivery accepted! Go pick it up 🚴');
      fetchData();
      setSelectedDonation(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept delivery'); }
  };

  const handleMarkDelivered = async (id) => {
    try {
      await donationAPI.markDelivered(id);
      toast.success('Marked as delivered! 🎉 Great job!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const maxCapacity = user?.roleData?.maxCapacity || 3;

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
            <h1 className="page-header">🚴 Volunteer Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.name} · Max {maxCapacity}kg · {user?.roleData?.transportOption || 'Bicycle'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 text-center">
              <ProfileUpload />
              <h3 className="font-bold text-gray-900 dark:text-white mt-3">{user?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="mt-2 flex justify-center"><span className="badge-yellow">Volunteer</span></div>
              <div className="mt-3 space-y-1 text-xs text-gray-400">
                <p>🕐 {user?.roleData?.availabilityTime || 'Flexible'}</p>
                <p>🚲 {user?.roleData?.transportOption || 'Bicycle'}</p>
                <p>📦 Max {maxCapacity} kg</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatsCard icon="📦" label="Available" value={available.length} color="brand" />
              <StatsCard icon="🚴" label="In Progress" value={stats.picked_up} color="yellow" />
              <StatsCard icon="✅" label="Delivered" value={stats.delivered} color="teal" />
              <StatsCard icon="📊" label="Total" value={stats.total} color="blue" />
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'available', label: '📦 Available Deliveries' },
                { key: 'my', label: '🚴 My Deliveries' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === t.key ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Available donations */}
            {activeTab === 'available' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Available Pickups</h2>
                  <span className="badge-yellow">≤ {maxCapacity}kg filter</span>
                </div>

                {available.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-5xl">🎉</span>
                    <p className="text-gray-400 mt-4">No available deliveries right now</p>
                    <p className="text-sm text-gray-400">Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {available.map(d => (
                      <div
                        key={d._id}
                        className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer"
                        onClick={() => setSelectedDonation(d)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{d.foodName}</h3>
                            <p className="text-sm text-gray-500">by {d.donorName}</p>
                          </div>
                          <span className="font-bold text-brand-600 text-lg">{d.quantity}kg</span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-gray-400">
                          <p>📍 {d.pickupAddress?.district || 'Location'}, {d.pickupAddress?.landmark}</p>
                          <p>📞 {d.donorPhone}</p>
                          {d.expiryTime && <p className="text-orange-500">⏰ Expires: {d.expiryTime}</p>}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcceptDelivery(d._id); }}
                            className="btn-primary text-xs py-2 flex-1"
                          >
                            🚴 Accept Delivery
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/${d.pickupAddress?.lat},${d.pickupAddress?.lng}`); }}
                            className="btn-secondary text-xs py-2 px-3"
                          >
                            📍 Map
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My deliveries */}
            {activeTab === 'my' && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Deliveries</h2>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        {['Food', 'Qty (kg)', 'Donor', 'Address', 'Status', 'Action'].map(h => (
                          <th key={h} className="th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {myDeliveries.length === 0 ? (
                        <tr><td colSpan={6} className="td text-center py-8 text-gray-400">No deliveries assigned yet</td></tr>
                      ) : myDeliveries.map(d => (
                        <tr key={d._id} className="tr">
                          <td className="td font-semibold">{d.foodName}</td>
                          <td className="td">{d.quantity} kg</td>
                          <td className="td">{d.donorName}</td>
                          <td className="td text-xs">{d.pickupAddress?.district}</td>
                          <td className="td"><StatusBadge status={d.status} /></td>
                          <td className="td">
                            {d.status === 'picked_up' && (
                              <button
                                onClick={() => handleMarkDelivered(d._id)}
                                className="btn-primary text-xs py-1.5 px-3"
                              >
                                ✅ Mark Delivered
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Delivery Details" size="lg">
        {selectedDonation && (
          <div className="space-y-4">
            {selectedDonation.foodPhoto && (
              <img src={`/uploads/food/${selectedDonation.foodPhoto}`} className="w-full h-40 object-cover rounded-xl" alt="" />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-400">Food</p><p className="font-semibold">{selectedDonation.foodName}</p></div>
              <div><p className="text-xs text-gray-400">Quantity</p><p className="font-semibold text-brand-600">{selectedDonation.quantity} kg</p></div>
              <div><p className="text-xs text-gray-400">Donor Name</p><p className="font-semibold">{selectedDonation.donorName}</p></div>
              <div><p className="text-xs text-gray-400">Donor Phone</p><p className="font-semibold">{selectedDonation.donorPhone}</p></div>
            </div>
            {selectedDonation.pickupAddress?.lat && (
              <MapPicker lat={selectedDonation.pickupAddress.lat} lng={selectedDonation.pickupAddress.lng} readOnly />
            )}
            <button onClick={() => handleAcceptDelivery(selectedDonation._id)} className="btn-primary w-full">
              🚴 Accept This Delivery
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VolunteerDashboard;
