import React, { useState, useEffect } from 'react';
import { getGuardians, addGuardian } from '../../services/childService';
import axios from 'axios';
import './ChildProfile.css';
import * as XLSX from 'xlsx';
import ExportUtils from '../../utils/ExportUtils';

const GuardianTab = ({ childId, user }) => {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    guardianName: '',
    relationshipToChild: '',
    phone: '',
    address: '',
    aliveStatus: true,
    notes: ''
  });

  useEffect(() => {
    loadGuardians();
  }, [childId]);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      const result = await getGuardians(childId);
      setGuardians(result.data || []);
    } catch (err) {
      console.error('Error loading guardians:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      await addGuardian(childId, formData);
      alert('Guardian added successfully');
      setShowAddForm(false);
      loadGuardians();
      
      // Reset form
      setFormData({
        guardianName: '',
        relationshipToChild: '',
        phone: '',
        address: '',
        aliveStatus: true,
        notes: ''
      });
    } catch (err) {
      alert('Failed to add guardian: ' + (err.response?.data?.message || err.message));
      console.error('Error adding guardian:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (guardian) => {
    setSelectedGuardian(guardian);
    setShowModal(true);
  };

  const exportToExcel = () => {
    const dataToExport = guardians.map(g => ({
      'ID': g.id,
      'Guardian Name': g.guardian_name,
      'Relationship': g.relationship_to_child,
      'Phone': g.phone || '-',
      'Alive Status': g.alive_status ? 'Alive' : 'Deceased',
      'Address': g.address || '-',
      'Notes': g.notes || '-',
      'Created': new Date(g.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guardians');
    
    const fileName = `Guardians_${childId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportGuardiansPDF = async () => {
    try {
      const childResponse = await axios.get(`http://localhost:5000/api/children/${childId}`);
      const child = childResponse.data.data;
      
      const columns = [
        { header: 'Field', accessor: 'field' },
        { header: 'Details', accessor: 'details' }
      ];
      
      const formattedData = [
        { field: 'Child Name', value: `${child.first_name} ${child.last_name}` },
        { field: 'Gender', value: child.gender },
        { field: 'Age', value: child.estimated_age || '-' },
        { field: '', value: '' },
        { field: 'Total Guardians', value: guardians.length.toString() },
        { field: '', value: '' },
      ];
      
      guardians.forEach((g, index) => {
        formattedData.push({ field: `Guardian ${index + 1}`, value: g.guardian_name });
        formattedData.push({ field: '  Relationship', value: g.relationship_to_child });
        formattedData.push({ field: '  Phone', value: g.phone || '-' });
        formattedData.push({ field: '  Status', value: g.alive_status ? 'Alive' : 'Deceased' });
        if (g.address) formattedData.push({ field: '  Address', value: g.address });
        if (g.notes) formattedData.push({ field: '  Notes', value: g.notes });
        formattedData.push({ field: '', value: '' });
      });
      
      ExportUtils.exportToPDF(
        `Guardians - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Guardians_${child.first_name}_${child.last_name}`
      );
    } catch (error) {
      console.error('Error exporting guardians PDF:', error);
      alert('Failed to export guardians. Please try again.');
    }
  };

  const exportSingleGuardianPDF = async (guardian) => {
    try {
      const childResponse = await axios.get(`http://localhost:5000/api/children/${childId}`);
      const child = childResponse.data.data;
      
      const columns = [
        { header: 'Field', accessor: 'field' },
        { header: 'Details', accessor: 'details' }
      ];
      
      const formattedData = [
        { field: 'Child Information', value: '' },
        { field: '  Child Name', value: `${child.first_name} ${child.last_name}` },
        { field: '  Gender', value: child.gender },
        { field: '', value: '' },
        { field: 'Guardian Information', value: '' },
        { field: '  Guardian Name', value: guardian.guardian_name },
        { field: '  Relationship', value: guardian.relationship_to_child },
        { field: '  Status', value: guardian.alive_status ? 'Alive' : 'Deceased' },
        { field: '  Phone', value: guardian.phone || '-' },
        { field: '  Created Date', value: new Date(guardian.created_at).toLocaleDateString() },
      ];
      
      if (guardian.address) formattedData.push({ field: '  Address', value: guardian.address });
      if (guardian.notes) formattedData.push({ field: '  Notes', value: guardian.notes });
      
      ExportUtils.exportToPDF(
        `Guardian - ${guardian.guardian_name}`,
        columns,
        formattedData,
        `Guardian_${guardian.guardian_name}_${new Date().toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Error exporting single guardian PDF:', error);
      alert('Failed to export guardian. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="tab-panel">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading guardians...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h3>Family Information</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {guardians.length > 0 && (
            <>
              <button onClick={exportToExcel} className="btn-secondary" title="Export to Excel">
                <i className='bx bxs-file-excel'></i> Export Excel
              </button>
              <button onClick={exportGuardiansPDF} className="btn-secondary" title="Export to PDF">
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
            </>
          )}
          {user?.permissions?.includes('guardian_manage') && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn-primary"
            >
              <i className='bx bx-plus'></i> Add Family Member
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Add New Family Member</h4>
              <button onClick={() => setShowAddForm(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Guardian Name *</label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Relationship *</label>
                  <select
                    name="relationshipToChild"
                    value={formData.relationshipToChild}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="aliveStatus"
                      checked={formData.aliveStatus}
                      onChange={handleChange}
                    />
                    Alive
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {guardians.length === 0 ? (
        <div className="empty-state">
          <i className='bx bx-user'></i>
          <p>No guardians recorded</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Guardian Name</th>
                <th>Relationship</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Address</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guardians.map((guardian, index) => (
                <tr 
                  key={guardian.id} 
                  onClick={() => handleViewDetails(guardian)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{guardian.guardian_name}</td>
                  <td>{guardian.relationship_to_child}</td>
                  <td>{guardian.phone || '-'}</td>
                  <td>
                    <span className={`status-badge ${guardian.alive_status ? 'active' : 'inactive'}`}>
                      {guardian.alive_status ? 'Alive' : 'Deceased'}
                    </span>
                  </td>
                  <td>{guardian.address || '-'}</td>
                  <td>{guardian.notes ? guardian.notes.substring(0, 30) + (guardian.notes.length > 30 ? '...' : '-') : '-'}</td>
                  <td>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(guardian);
                      }}
                      className="btn-icon-sm"
                      title="View Full Details"
                    >
                      <i className='bx bx-show'></i> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Full Details Modal */}
      {showModal && selectedGuardian && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Guardian Details</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="record-detail-grid">
                <div className="detail-section">
                  <h5>Basic Information</h5>
                  <div className="detail-row">
                    <label>Guardian Name:</label>
                    <span>{selectedGuardian.guardian_name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Relationship:</label>
                    <span>{selectedGuardian.relationship_to_child}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedGuardian.alive_status ? 'active' : 'inactive'}`}>
                      {selectedGuardian.alive_status ? 'Alive' : 'Deceased'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Phone:</label>
                    <span>{selectedGuardian.phone || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Date Added:</label>
                    <span>{new Date(selectedGuardian.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {(selectedGuardian.address || selectedGuardian.notes) && (
                  <div className="detail-section">
                    <h5>Additional Information</h5>
                    {selectedGuardian.address && (
                      <div className="detail-row full-width">
                        <label>Address:</label>
                        <span>{selectedGuardian.address}</span>
                      </div>
                    )}
                    {selectedGuardian.notes && (
                      <div className="detail-row full-width">
                        <label>Notes:</label>
                        <span>{selectedGuardian.notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => exportSingleGuardianPDF(selectedGuardian)} 
                className="btn-primary"
                title="Export this guardian as PDF"
              >
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianTab;
