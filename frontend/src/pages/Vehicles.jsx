import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Vehicles = () => {
  const { hasRole } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    regNumber: '',
    name: '',
    type: 'Van',
    maxLoadCapacity: '',
    odometer: '',
    acquisitionCost: '',
    status: 'Available'
  });

  const isFleetManager = hasRole(['Fleet Manager']);

  const fetchVehicles = async () => {
    try {
      setError('');
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      setError('Failed to fetch vehicle registry from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setFormData({
      regNumber: '',
      name: '',
      type: 'Van',
      maxLoadCapacity: '',
      odometer: '0',
      acquisitionCost: '',
      status: 'Available'
    });
    setEditMode(false);
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (vehicle) => {
    setFormData({
      regNumber: vehicle.regNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: vehicle.maxLoadCapacity,
      odometer: vehicle.odometer,
      acquisitionCost: vehicle.acquisitionCost,
      status: vehicle.status
    });
    setSelectedVehicleId(vehicle._id);
    setEditMode(true);
    setIsModalOpen(true);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.regNumber.trim()) {
      setError('Registration number is required.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Model name is required.');
      return;
    }
    if (Number(formData.maxLoadCapacity) <= 0) {
      setError('Max load capacity must be greater than 0.');
      return;
    }
    if (Number(formData.acquisitionCost) <= 0) {
      setError('Acquisition cost must be greater than 0.');
      return;
    }

    try {
      if (editMode) {
        await api.put(`/vehicles/${selectedVehicleId}`, formData);
        setSuccess('Vehicle registry updated successfully.');
      } else {
        await api.post('/vehicles', formData);
        setSuccess('Vehicle registered successfully.');
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving vehicle details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to retire and remove this vehicle?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/vehicles/${id}`);
      setSuccess('Vehicle retired and deleted successfully.');
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting vehicle.');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Available</span>;
      case 'On Trip':
        return <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">On Trip</span>;
      case 'In Shop':
        return <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">In Shop</span>;
      case 'Retired':
        return <span className="bg-surface-dim text-on-surface-variant px-2 py-0.5 rounded-sm font-label-caps text-[10px] uppercase">Retired</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesType = filterType === 'All' || v.type === filterType;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesType && matchesStatus;
  });

  return (
    <div className="space-y-stack-lg">
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Vehicle Registry</h1>
          <p className="text-on-surface-variant font-body-sm">Manage fleet vehicle listings, capacities, and active service status.</p>
        </div>
        
        {isFleetManager && (
          <button
            onClick={openAddModal}
            className="bg-primary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Register Vehicle
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

      {/* Filter and stats row */}
      <section className="border border-outline-variant bg-[#FAF7F0] px-6 py-4 flex flex-wrap gap-stack-md items-center justify-between hard-shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-[10px] text-on-surface-variant">Vehicle Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-surface border border-outline-variant rounded-sm py-1 px-3 text-body-sm font-label-caps outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Assets</option>
              <option value="Heavy Duty Truck">Heavy Duty Truck</option>
              <option value="Van">Van</option>
              <option value="EV Dispatch">EV Dispatch</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-label-caps text-[10px] text-on-surface-variant">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-surface border border-outline-variant rounded-sm py-1 px-3 text-body-sm font-label-caps outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>

        <div className="font-data-mono text-xs text-on-surface-variant">
          Total Filtered: <strong className="text-primary">{filteredVehicles.length}</strong> / {vehicles.length}
        </div>
      </section>

      {/* Vehicle list table */}
      <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Syncing fleet registry...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm">No vehicles match the selected criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary font-label-caps text-label-caps uppercase border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 border-r border-on-primary/10">Reg Number</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Model/Name</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Type</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Max Load (kg)</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Odometer</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Acquisition Cost</th>
                  <th className="px-6 py-3 border-r border-on-primary/10">Status</th>
                  {isFleetManager && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-3 font-data-mono text-primary font-bold">{vehicle.regNumber}</td>
                    <td className="px-6 py-3 font-medium">{vehicle.name}</td>
                    <td className="px-6 py-3 text-xs uppercase">{vehicle.type}</td>
                    <td className="px-6 py-3 font-data-mono">{vehicle.maxLoadCapacity.toLocaleString()} kg</td>
                    <td className="px-6 py-3 font-data-mono">{vehicle.odometer.toLocaleString()} km</td>
                    <td className="px-6 py-3 font-data-mono">${vehicle.acquisitionCost.toLocaleString()}</td>
                    <td className="px-6 py-3">{getStatusBadge(vehicle.status)}</td>
                    {isFleetManager && (
                      <td className="px-6 py-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="text-primary hover:text-primary-container hover:underline font-label-caps text-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle._id)}
                          className="text-error hover:text-red-800 hover:underline font-label-caps text-xs flex items-center gap-1 ml-2"
                          disabled={vehicle.status === 'On Trip'}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Retire
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register/Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F0] border-2 border-primary hard-shadow w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold mb-4">
              {editMode ? 'Edit Vehicle Info' : 'Register New Fleet Asset'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="regNumber"
                    required
                    disabled={editMode}
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none uppercase"
                    placeholder="TX-0000"
                    value={formData.regNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Model Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Volvo VNL 860 / Ford Transit"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Vehicle Type</label>
                  <select
                    name="type"
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                    <option value="Van">Van</option>
                    <option value="EV Dispatch">EV Dispatch</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Max Payload Capacity (kg)</label>
                  <input
                    type="number"
                    name="maxLoadCapacity"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="15000"
                    value={formData.maxLoadCapacity}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Current Odometer (km)</label>
                  <input
                    type="number"
                    name="odometer"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="0"
                    value={formData.odometer}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    name="acquisitionCost"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-data-mono text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="75000"
                    value={formData.acquisitionCost}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-[10px] uppercase text-on-surface-variant mb-1">Operational Status</label>
                <select
                  name="status"
                  className="w-full bg-surface-container-low border border-outline-variant px-3 py-2 font-label-caps text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={formData.status === 'On Trip'}
                >
                  <option value="Available">Available</option>
                  <option value="In Shop">In Shop (Maintenance)</option>
                  <option value="Retired">Retired</option>
                  {formData.status === 'On Trip' && <option value="On Trip">On Trip (Locked)</option>}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-label-caps text-label-caps uppercase py-2.5 hover:bg-primary-container transition-colors"
              >
                {editMode ? 'Save Fleet Registry Changes' : 'Approve Registry Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
