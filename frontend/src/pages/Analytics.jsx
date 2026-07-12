import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Analytics = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchReports = async () => {
    try {
      setError('');
      const res = await api.get('/analytics/reports');
      setReports(res.data);
    } catch (err) {
      setError('Failed to load fleet analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await api.get('/analytics/reports/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transitops_fleet_report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to generate and download CSV report.');
    } finally {
      setDownloading(false);
    }
  };

  // Compute aggregated totals
  const totalDistance = reports.reduce((acc, r) => acc + r.totalDistance, 0);
  const totalOperationalCost = reports.reduce((acc, r) => acc + r.totalOperationalCost, 0);
  const totalRevenue = reports.reduce((acc, r) => acc + r.estimatedRevenue, 0);
  const totalProfit = totalRevenue - totalOperationalCost;

  return (
    <div className="space-y-stack-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Fleet Analytics</h1>
          <p className="text-on-surface-variant font-body-sm">Detailed calculations for distance-to-fuel efficiency, maintenance expenses, and vehicle capital ROI.</p>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={downloading || reports.length === 0}
          className="bg-primary text-on-primary px-4 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2 hover:bg-primary-container disabled:opacity-50 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {downloading ? 'Generating CSV...' : 'Export CSV Report'}
        </button>
      </div>

      {error && (
        <div className="bg-error-container border border-error text-on-error-container p-3 rounded-sm font-body-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-stack-sm">
        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Total Fleet Mileage</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary font-bold">{totalDistance.toLocaleString()}</span>
            <span className="font-data-mono text-outline text-xs">KM</span>
          </div>
        </div>

        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Total Operational cost</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary font-bold">${totalOperationalCost.toLocaleString()}</span>
            <span className="font-data-mono text-outline text-xs">USD</span>
          </div>
        </div>

        <div className="bg-[#FAF7F0] border border-outline-variant p-4 flex flex-col hard-shadow">
          <span className="font-label-caps text-[10px] text-on-surface-variant mb-2">Estimated Gross Revenue</span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary font-bold">${totalRevenue.toLocaleString()}</span>
            <span className="font-data-mono text-outline text-xs">USD</span>
          </div>
        </div>

        <div className={`border border-outline-variant p-4 flex flex-col hard-shadow ${totalProfit >= 0 ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
          <span className="font-label-caps text-[10px] opacity-75 mb-2">Net Operations Profit</span>
          <div className="flex items-baseline gap-2">
            <span className="font-data-mono text-headline-lg font-bold">
              {totalProfit < 0 ? '-' : ''}${Math.abs(totalProfit).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Reports Table */}
      <div className="bg-[#FAF7F0] border border-outline-variant hard-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-label-caps text-label-caps animate-pulse">Running financial analysis reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant font-body-sm">No vehicles registered in fleet for analysis.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-primary text-on-primary font-label-caps text-label-caps uppercase border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 border-r border-on-primary/10">Vehicle ID</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Acquisition Cost</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Total Distance</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Fuel Efficiency</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Fuel Expenses</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Maintenance</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Total Op. Cost</th>
                  <th className="px-4 py-3 border-r border-on-primary/10">Est. Revenue</th>
                  <th className="px-4 py-3 text-right">Acquisition ROI</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface divide-y divide-outline-variant/30">
                {reports.map((report) => (
                  <tr key={report.vehicleId} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-data-mono text-primary font-bold">
                      {report.regNumber}
                      <span className="block font-body-sm font-normal text-[11px] text-on-surface-variant truncate">{report.name}</span>
                    </td>
                    <td className="px-4 py-3 font-data-mono">${report.acquisitionCost.toLocaleString()}</td>
                    <td className="px-4 py-3 font-data-mono">{report.totalDistance.toLocaleString()} km</td>
                    <td className="px-4 py-3 font-data-mono text-tertiary font-bold">
                      {report.fuelEfficiency > 0 ? `${report.fuelEfficiency} km/L` : '—'}
                    </td>
                    <td className="px-4 py-3 font-data-mono">${report.totalFuelCost.toLocaleString()}</td>
                    <td className="px-4 py-3 font-data-mono">${report.totalMaintenanceCost.toLocaleString()}</td>
                    <td className="px-4 py-3 font-data-mono">${report.totalOperationalCost.toLocaleString()}</td>
                    <td className="px-4 py-3 font-data-mono">${report.estimatedRevenue.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-data-mono text-right font-bold ${report.roiPercentage >= 0 ? 'text-tertiary' : 'text-error'}`}>
                      {report.roiPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calculations Methodology */}
      <section className="bg-surface-container border border-outline-variant p-6 rounded-sm">
        <h3 className="font-label-caps text-label-caps text-primary uppercase font-bold mb-3">Telemetry Formulas & Ledger Rules</h3>
        <ul className="list-disc list-inside space-y-2 text-xs font-body-sm text-on-surface-variant">
          <li><strong>Fuel Efficiency:</strong> Calculated as `Total Trip Distance (km) / Total Fuel Consumed (Liters)`. Returns a value in km/L per vehicle.</li>
          <li><strong>Gross Revenue:</strong> Establishes a standard industrial shipping revenue rate of <strong>$3.00/km</strong> applied against completed delivery runs.</li>
          <li><strong>Total Operational Cost:</strong> The aggregate summation of `Fuel Purchase Invoice Costs + Closed Maintenance Logs Costs + Tolls/Fees Receipts`.</li>
          <li><strong>Acquisition ROI:</strong> Computed as `(Gross Revenue - Total Operational Cost) / Original Vehicle Acquisition Cost * 100`. Demonstrates capital return rate.</li>
        </ul>
      </section>
    </div>
  );
};

export default Analytics;
