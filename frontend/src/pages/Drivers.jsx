import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Drivers = () => {
  const { user, hasRole } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter
  const [filterCategory, setFilterCategory] = useState('All');

  // Sidebar Drawer state
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Onboard Modal State
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  // Onboard Form State
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'Class A CDL',
    licenseExpiryDate: '',
    contact: '',
    safetyScore: '100'
  });

  // Photo upload reference
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const isFleetManager = hasRole(['Fleet Manager']);
  const isSafetyOfficer = hasRole(['Safety Officer']);
  const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

  const fetchDrivers = async () => {
    try {
      setError('');
      const res = await api.get('/drivers');
      setDrivers(res.data);
      // Keep selected driver synced if open
      if (selectedDriver) {
        const updated = res.data.find(d => d._id === selectedDriver._id);
        if (updated) setSelectedDriver(updated);
      }
    } catch (err) {
      setError('Failed to retrieve driver listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleRowClick = (driver) => {
    setSelectedDriver(driver);
    setIsDrawerOpen(true);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.licenseNumber.trim() || !formData.licenseExpiryDate || !formData.contact.trim()) {
      setError('Please fill in all required driver details.');
      return;
    }

    try {
      await api.post('/drivers', formData);
      setSuccess(`Driver ${formData.name} onboarded successfully. Please upload and verify license.`);
      setIsOnboardOpen(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error onboard driver profile.');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validations
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      setError('Only JPG, JPEG, and PNG image files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must not exceed 5MB.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    const uploadFormData = new FormData();
    uploadFormData.append('licensePhoto', file);

    try {
      const res = await api.post(`/drivers/${selectedDriver._id}/upload`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('License photo uploaded successfully. Verification state set to Pending.');
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading driver license photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (status) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/drivers/${selectedDriver._id}/verify`, { verificationStatus: status });
      setSuccess(`Driver license verified status updated to: ${status}`);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update verification status.');
    }
  };

  const handleToggleDutyStatus = async (status) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/drivers/${selectedDriver._id}`, { status });
      setSuccess(`Driver duty status set to ${status}.`);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update driver status.');
    }
  };

  // Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Available</span>;
      case 'On Trip':
        return <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">On Trip</span>;
      case 'Suspended':
        return <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Suspended</span>;
      case 'Off Duty':
      default:
        return <span className="bg-surface-dim text-on-surface-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Off Duty</span>;
    }
  };

  const getVerifyBadge = (vStatus) => {
    switch (vStatus) {
      case 'Verified':
        return <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Verified</span>;
      case 'Rejected':
        return <span className="bg-error text-white px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Rejected</span>;
      case 'Pending':
      default:
        return <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Pending</span>;
    }
  };

  // Filter
  const filteredDrivers = drivers.filter(d => {
    return filterCategory === 'All' || d.licenseCategory === filterCategory;
  });

  return (
    <div className="space-y-stack-lg relative overflow-hidden flex-1 flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Driver Management</h1>
          <p className="text-on-surface-variant font-body-sm">Manage personnel credentials, licensing schedules, and safety ratings.</p>
        </div>

        {isFleetManager && (
          <button
            onClick={() => {
              setFormData({ name: '', licenseNumber: '', licenseCategory: 'Class A CDL', licenseExpiryDate: '', contact: '', safetyScore: '100' });
              setError('');
              setIsOnboardOpen(true);
            }}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Onboard Driver
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error-container border border-error text-on-error-container p-3 rounded-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-tertiary-container border border-tertiary text-on-tertiary-container p-3 rounded-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Filters */}
      <section className="border border-outline-variant bg-[#FAF7F0] px-6 py-4 flex flex-wrap gap-stack-md items-center justify-between hard-shadow">
        <div className="flex items-center gap-2">
          <span className="font-label-caps text-[10px] text-on-surface-variant">License Filter:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-surface border border-outline-variant rounded-sm py-1 px-3 text-body-sm font-label-caps outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Categories</option>
            <option value="Class A CDL">Class A CDL</option>
            <option value="Class B CDL">Class B CDL</option>
            <option value="Hazardous Mat">Hazardous Mat</option>
          </select>
        </div>
        <div className="font-data-mono text-xs text-on-surface-variant">
          Total Filtered: <strong className="text-primary">{filteredDrivers.length}</strong> / {drivers.length}
        </div>
      </section>

      {/* Main Table */}
      <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden flex-1">
        {loading ? (
          <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Syncing logistics roster...</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm">No drivers logged matching specifications.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary font-label-caps text-label-caps uppercase border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 border-r border-on-primary/10">Driver Name</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">License #</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Category</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Expiry Date</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Safety Rating</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Status</th>
                  <th className="px-6 py-3">Verification</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                {filteredDrivers.map((driver) => {
                  const isExpired = new Date(driver.licenseExpiryDate) < new Date();
                  return (
                    <tr
                      key={driver._id}
                      onClick={() => handleRowClick(driver)}
                      className="hover:bg-surface-container-low cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant flex items-center justify-center font-bold text-xs text-primary">
                          {driver.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        {driver.name}
                      </td>
                      <td className="px-6 py-3 font-data-mono">{driver.licenseNumber}</td>
                      <td className="px-6 py-3">{driver.licenseCategory}</td>
                      <td className={`px-6 py-3 font-data-mono ${isExpired ? 'text-error font-bold' : ''}`}>
                        {new Date(driver.licenseExpiryDate).toISOString().split('T')[0]}
                        {isExpired && ' (EXPIRED)'}
                      </td>
                      <td className="px-6 py-3 font-data-mono font-bold text-tertiary">{driver.safetyScore}</td>
                      <td className="px-6 py-3">{getStatusBadge(driver.status)}</td>
                      <td className="px-6 py-3">{getVerifyBadge(driver.verificationStatus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side Drawer details */}
      {isDrawerOpen && selectedDriver && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FAF7F0] border-l-2 border-primary shadow-2xl flex flex-col drawer-transition">
          <div className="bg-primary text-on-primary p-6 flex justify-between items-center border-b border-outline-variant">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-on-primary">{selectedDriver.name}</h2>
              <p className="font-label-caps text-[10px] text-primary-fixed uppercase mt-1">Personnel File</p>
            </div>
            <button
              onClick={() => { setIsDrawerOpen(false); setSelectedDriver(null); }}
              className="text-on-primary hover:text-secondary"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 border border-outline-variant p-4 bg-surface-container-low">
              <div>
                <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase">License Number</span>
                <span className="font-data-mono text-sm text-primary font-bold">{selectedDriver.licenseNumber}</span>
              </div>
              <div>
                <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase">Category</span>
                <span className="font-body-sm text-sm font-semibold">{selectedDriver.licenseCategory}</span>
              </div>
              <div>
                <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase">License Expiry</span>
                <span className="font-data-mono text-sm">{new Date(selectedDriver.licenseExpiryDate).toISOString().split('T')[0]}</span>
              </div>
              <div>
                <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase">Contact Info</span>
                <span className="font-body-sm text-sm">{selectedDriver.contact}</span>
              </div>
              <div>
                <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase">Safety Score</span>
                <span className="font-data-mono text-sm text-tertiary font-bold">{selectedDriver.safetyScore} / 100</span>
              </div>
              <div>
                <span className="block font-label-caps text-[9px] text-on-surface-variant uppercase">Verification</span>
                <span className="block mt-1">{getVerifyBadge(selectedDriver.verificationStatus)}</span>
              </div>
            </div>

            {/* Duty Status controls (Fleet Manager) */}
            {isFleetManager && (
              <div className="space-y-2 border border-outline-variant p-4 bg-surface-container-low">
                <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase font-bold mb-2">Duty Control</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleDutyStatus('Available')}
                    disabled={selectedDriver.verificationStatus !== 'Verified' || selectedDriver.status === 'On Trip'}
                    className="flex-1 bg-primary text-on-primary font-label-caps text-[10px] uppercase py-2 hover:bg-primary-container disabled:opacity-40 transition-colors"
                  >
                    Go On Duty (Available)
                  </button>
                  <button
                    onClick={() => handleToggleDutyStatus('Off Duty')}
                    disabled={selectedDriver.status === 'On Trip'}
                    className="flex-1 bg-surface border border-outline-variant text-on-surface font-label-caps text-[10px] uppercase py-2 hover:bg-surface-container disabled:opacity-40 transition-colors"
                  >
                    Go Off Duty
                  </button>
                </div>
                {selectedDriver.verificationStatus !== 'Verified' && (
                  <p className="text-[10px] text-error font-body-sm">
                    * Driver cannot go On Duty until their license photo is verified.
                  </p>
                )}
              </div>
            )}

            {/* Verification controls (Safety Officer) */}
            {isSafetyOfficer && (
              <div className="space-y-2 border border-outline-variant p-4 bg-surface-container-low">
                <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase font-bold mb-2">Safety Officer Decision</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify('Verified')}
                    disabled={!selectedDriver.licensePhotoUrl}
                    className="flex-1 bg-tertiary-container text-on-tertiary-container font-label-caps text-[10px] uppercase py-2 hover:bg-tertiary border border-tertiary disabled:opacity-40 transition-colors"
                  >
                    Verify & Approve
                  </button>
                  <button
                    onClick={() => handleVerify('Rejected')}
                    disabled={!selectedDriver.licensePhotoUrl}
                    className="flex-1 bg-error-container text-on-error-container font-label-caps text-[10px] uppercase py-2 hover:bg-error border border-error disabled:opacity-40 transition-colors"
                  >
                    Reject License
                  </button>
                </div>
              </div>
            )}

            {/* License Photo View / Upload */}
            <div className="border border-outline-variant p-4 bg-surface-container-low space-y-3">
              <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase font-bold">Physical License Photo</span>
              {selectedDriver.licensePhotoUrl ? (
                <div className="border border-outline-variant overflow-hidden rounded-sm bg-white aspect-[1.5] relative group">
                  <img
                    src={`${backendUrl}${selectedDriver.licensePhotoUrl}`}
                    alt="Driver License"
                    className="w-full h-full object-cover"
                  />
                  {isFleetManager && (
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="absolute inset-0 bg-primary/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-label-caps text-xs uppercase"
                    >
                      Re-upload Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-outline-variant p-6 text-center rounded-sm bg-surface">
                  <span className="material-symbols-outlined text-outline text-3xl mb-2">image_search</span>
                  <p className="font-body-sm text-xs text-on-surface-variant mb-3">No physical license uploaded yet.</p>
                  
                  {isFleetManager && (
                    <>
                      <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                        className="bg-primary text-on-primary px-3 py-1.5 font-label-caps text-[10px] uppercase hover:bg-primary-container disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </>
                  )}
                </div>
              )}
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Onboard Driver Modal */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsOnboardOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4">Onboard Driver</h2>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none uppercase"
                    placeholder="DL-000000"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">License Category</label>
                  <select
                    name="licenseCategory"
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.licenseCategory}
                    onChange={handleInputChange}
                  >
                    <option value="Class A CDL">Class A CDL</option>
                    <option value="Class B CDL">Class B CDL</option>
                    <option value="Hazardous Mat">Hazardous Mat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Contact Phone</label>
                  <input
                    type="text"
                    name="contact"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="+1 555-0199"
                    value={formData.contact}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Initial Safety Score</label>
                <input
                  type="number"
                  name="safetyScore"
                  min="0"
                  max="100"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={formData.safetyScore}
                  onChange={handleInputChange}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container transition-colors"
              >
                Create Driver Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
