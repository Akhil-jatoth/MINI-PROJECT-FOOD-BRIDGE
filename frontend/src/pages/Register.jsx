import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import MapPicker from '../components/MapPicker';

const steps = ['Basic Info', 'Address', 'Role & Extras'];

const Register = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    hno: '', landmark: '', district: '', pincode: '',
    lat: 17.385, lng: 78.4867,
    role: '', idType: '', idNumber: '',
    // NGO
    organizationName: '', serviceAreaRadius: 10,
    // Volunteer
    availabilityTime: '', transportOption: 'bicycle', maxCapacity: 3,
    // Donor
    foodType: '',
  });

  const [files, setFiles] = useState({ profilePhoto: null, idFile: null, ngoCertificate: null });
  const [passwordMatch, setPasswordMatch] = useState(null);

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handlePasswordCheck = (confirmVal) => {
    update('confirmPassword', confirmVal);
    setPasswordMatch(confirmVal === '' ? null : form.password === confirmVal);
  };

  const handleFileChange = (field, file) => setFiles(p => ({ ...p, [field]: file }));

  const isStep0Valid = form.name && form.email && form.phone && form.password && form.password === form.confirmPassword;
  const isStep1Valid = form.hno && form.district && form.pincode;
  const isStep2Valid = form.role && form.idType && form.idNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStep2Valid) { toast.error('Please fill all required fields'); return; }

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) formData.append(k, v); });
    if (files.profilePhoto) formData.append('profilePhoto', files.profilePhoto);
    if (files.idFile) formData.append('idFile', files.idFile);
    if (files.ngoCertificate) formData.append('ngoCertificate', files.ngoCertificate);

    try {
      await authAPI.register(formData);
      toast.success('Registration successful! Pending admin approval. 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const idPatterns = {
    aadhaar: { pattern: /^\d{12}$/, hint: '12-digit Aadhaar number' },
    pan: { pattern: /^[A-Z]{5}\d{4}[A-Z]{1}$/, hint: 'Format: ABCDE1234F' },
    voter: { pattern: /^[A-Z0-9]{8,12}$/, hint: '8–12 alphanumeric characters' },
    driving: { pattern: /.+/, hint: 'Enter licence number' },
  };

  const idValid = form.idType && form.idNumber
    ? idPatterns[form.idType]?.pattern.test(form.idNumber.toUpperCase())
    : true;

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🍽</span>
            <span className="text-2xl font-bold text-white">Food Bridge</span>
          </Link>
          <h2 className="text-xl font-semibold text-white/90">Create your account</h2>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= step ? 'bg-brand-500 text-white' : 'bg-white/20 text-white/60'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= step ? 'text-white font-semibold' : 'text-white/60'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? 'bg-brand-400' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {/* STEP 0 — Basic Info */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Basic Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Full Name *</label>
                    <input className="input" placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">Phone Number *</label>
                    <input className="input" placeholder="10-digit number" maxLength={10} value={form.phone} onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} required />
                  </div>
                </div>
                <div>
                  <label className="input-label">Email Address *</label>
                  <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                </div>
                <div>
                  <label className="input-label">Password *</label>
                  <input type="password" className="input" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
                </div>
                <div>
                  <label className="input-label">Confirm Password *</label>
                  <input
                    type="password"
                    className={`input ${passwordMatch === false ? 'border-red-400' : passwordMatch === true ? 'border-green-400' : ''}`}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={e => handlePasswordCheck(e.target.value)}
                    required
                  />
                  {passwordMatch === false && <p className="text-red-500 text-xs mt-1">✖ Passwords do not match</p>}
                  {passwordMatch === true && <p className="text-green-500 text-xs mt-1">✔ Passwords match</p>}
                </div>
                <div>
                  <label className="input-label">Profile Photo (optional)</label>
                  <input type="file" accept="image/*" className="input text-sm" onChange={e => handleFileChange('profilePhoto', e.target.files[0])} />
                </div>
              </div>
            )}

            {/* STEP 1 — Address */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Your Address</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">House/Flat Number *</label>
                    <input className="input" placeholder="H.No / Flat No" value={form.hno} onChange={e => update('hno', e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">Nearby Landmark</label>
                    <input className="input" placeholder="Near XYZ market" value={form.landmark} onChange={e => update('landmark', e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">District *</label>
                    <input className="input" placeholder="Hyderabad" value={form.district} onChange={e => update('district', e.target.value)} required />
                  </div>
                  <div>
                    <label className="input-label">Pincode *</label>
                    <input className="input" placeholder="500001" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                  </div>
                </div>
                <div>
                  <label className="input-label">📍 Pin Your Location on Map <span className="font-normal text-gray-400">(click to set)</span></label>
                  <MapPicker lat={form.lat} lng={form.lng} onLocationSelect={(lat, lng) => { update('lat', lat); update('lng', lng); }} />
                </div>
              </div>
            )}

            {/* STEP 2 — Role & Extras */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Role & Verification</h3>

                {/* Role Selection */}
                <div>
                  <label className="input-label">Select Your Role *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'donor', icon: '🧑‍🍳', label: 'Donor', desc: 'Donate food' },
                      { value: 'ngo', icon: '🏢', label: 'NGO', desc: 'Collect & distribute' },
                      { value: 'volunteer', icon: '🚴', label: 'Volunteer', desc: 'Deliver food' },
                    ].map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => update('role', r.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${form.role === r.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-brand-300'}`}
                      >
                        <div className="text-2xl mb-1">{r.icon}</div>
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{r.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NGO fields */}
                {form.role === 'ngo' && (
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">NGO Details</p>
                    <input className="input" placeholder="Organization Name *" value={form.organizationName} onChange={e => update('organizationName', e.target.value)} />
                    <div>
                      <label className="input-label">Service Area Radius (km)</label>
                      <input type="number" className="input" value={form.serviceAreaRadius} onChange={e => update('serviceAreaRadius', e.target.value)} min={1} max={50} />
                    </div>
                    <div>
                      <label className="input-label">Upload NGO Certificate</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input text-sm" onChange={e => handleFileChange('ngoCertificate', e.target.files[0])} />
                    </div>
                  </div>
                )}

                {/* Volunteer fields */}
                {form.role === 'volunteer' && (
                  <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Volunteer Details</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="input-label">Availability Time</label>
                        <input className="input" placeholder="e.g. 9AM–6PM" value={form.availabilityTime} onChange={e => update('availabilityTime', e.target.value)} />
                      </div>
                      <div>
                        <label className="input-label">Max Capacity (1–3 kg)</label>
                        <select className="input" value={form.maxCapacity} onChange={e => update('maxCapacity', e.target.value)}>
                          {[1, 2, 3].map(v => <option key={v} value={v}>{v} kg</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="input-label">Transport</label>
                      <select className="input" value={form.transportOption} onChange={e => update('transportOption', e.target.value)}>
                        {['bicycle', 'motorcycle', 'car', 'walking'].map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Donor fields */}
                {form.role === 'donor' && (
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">Donor Details</p>
                    <div>
                      <label className="input-label">Typical Food Type</label>
                      <select className="input" value={form.foodType} onChange={e => update('foodType', e.target.value)}>
                        <option value="">Select...</option>
                        <option value="veg">Vegetarian</option>
                        <option value="non-veg">Non-Vegetarian</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ID Proof */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identity Verification</p>
                  <div>
                    <label className="input-label">ID Type *</label>
                    <select className="input" value={form.idType} onChange={e => update('idType', e.target.value)} required>
                      <option value="">-- Select ID Type --</option>
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="voter">Voter ID</option>
                      <option value="driving">Driving Licence</option>
                    </select>
                  </div>
                  {form.idType && (
                    <div>
                      <label className="input-label">ID Number * <span className="font-normal text-gray-400">({idPatterns[form.idType]?.hint})</span></label>
                      <input
                        className={`input ${form.idNumber && !idValid ? 'border-red-400' : form.idNumber && idValid ? 'border-green-400' : ''}`}
                        placeholder={idPatterns[form.idType]?.hint}
                        value={form.idNumber}
                        onChange={e => update('idNumber', e.target.value)}
                        required
                      />
                      {form.idNumber && !idValid && <p className="text-red-500 text-xs mt-1">Invalid format</p>}
                    </div>
                  )}
                  <div>
                    <label className="input-label">Upload ID Proof</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="input text-sm" onChange={e => handleFileChange('idFile', e.target.files[0])} />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 gap-4">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(p => p - 1)} className="btn-secondary flex-1">← Back</button>
              ) : (
                <div className="flex-1" />
              )}

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(p => p + 1)}
                  disabled={(step === 0 && !isStep0Valid) || (step === 1 && !isStep1Valid)}
                  className="btn-primary flex-1"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !isStep2Valid || !idValid}
                  className="btn-primary flex-1"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Registering...</span> : 'Register 🎉'}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
