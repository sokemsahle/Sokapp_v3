import React, { useState, useEffect } from 'react';
import { getCaseHistory, addCaseHistory } from '../../services/childService';
import axios from 'axios';
import './ChildProfile.css';
import * as XLSX from 'xlsx';
import ExportUtils from '../../utils/ExportUtils';

const CaseHistoryTab = ({ childId, user }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    caseType: '',
    description: '',
    reportedBy: '',
    reportDate: '',
    caseStatus: 'Open'
  });

  useEffect(() => { loadDocuments(); }, [childId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getCaseHistory(childId);
      setCases(result.data || []);
    } catch (err) { console.error('Error loading case history:', err); } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await addCaseHistory(childId, formData);
      alert('Case history added successfully');
      setShowAddForm(false);
      loadDocuments();
      setFormData({ caseType: '', description: '', reportedBy: '', reportDate: '', caseStatus: 'Open' });
    } catch (err) {
      alert('Failed to add case history: ' + (err.response?.data?.message || err.message));
      console.error('Error adding case history:', err);
    } finally { setSubmitting(false); }
  };

  const handleViewDetails = (caseItem) => {
    setSelectedCase(caseItem);
    setShowModal(true);
  };

  const exportToExcel = () => {
    const dataToExport = cases.map(c => ({
      'ID': c.id,
      'Case Type': c.case_type,
      'Description': c.description,
      'Reported By': c.reported_by || '-',
      'Report Date': c.report_date ? new Date(c.report_date).toLocaleDateString() : '-',
      'Status': c.case_status,
      'Created': new Date(c.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Case History');
    
    const fileName = `Case_History_${childId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportCaseHistoryPDF = async () => {
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
        { field: 'Total Cases', value: cases.length.toString() },
        { field: '', value: '' },
      ];
      
      cases.forEach((c, index) => {
        formattedData.push({ field: `Case ${index + 1} - Type`, value: c.case_type });
        formattedData.push({ field: '  Description', value: c.description });
        formattedData.push({ field: '  Status', value: c.case_status });
        formattedData.push({ field: '  Reported By', value: c.reported_by || '-' });
        formattedData.push({ field: '  Report Date', value: c.report_date ? new Date(c.report_date).toLocaleDateString() : '-' });
        formattedData.push({ field: '', value: '' });
      });
      
      ExportUtils.exportToPDF(
        `Case History - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Case_History_${child.first_name}_${child.last_name}`
      );
    } catch (error) {
      console.error('Error exporting case history PDF:', error);
      alert('Failed to export case history. Please try again.');
    }
  };

  const exportSingleCasePDF = async (caseItem) => {
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
        { field: 'Case Information', value: '' },
        { field: '  Case Type', value: caseItem.case_type },
        { field: '  Description', value: caseItem.description },
        { field: '  Status', value: caseItem.case_status },
        { field: '  Reported By', value: caseItem.reported_by || '-' },
        { field: '  Report Date', value: caseItem.report_date ? new Date(caseItem.report_date).toLocaleDateString() : '-' },
        { field: '  Created Date', value: new Date(caseItem.created_at).toLocaleDateString() },
      ];
      
      ExportUtils.exportToPDF(
        `Case History - ${caseItem.case_type}`,
        columns,
        formattedData,
        `Case_${caseItem.case_type}_${new Date().toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Error exporting single case PDF:', error);
      alert('Failed to export case. Please try again.');
    }
  };

  if (loading) return <div className="tab-panel"><div className="loading-container"><div className="spinner"></div><p>Loading cases...</p></div></div>;

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h3>Case History</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {cases.length > 0 && (
            <>
              <button onClick={exportToExcel} className="btn-secondary" title="Export to Excel">
                <i className='bx bxs-file-excel'></i> Export Excel
              </button>
              <button onClick={exportCaseHistoryPDF} className="btn-secondary" title="Export to PDF">
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
            </>
          )}
          {user?.permissions?.includes('case_manage') && (
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary"><i className='bx bx-plus'></i> Add Case</button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Add Case History</h4>
              <button onClick={() => setShowAddForm(false)} className="btn-close"><i className='bx bx-x'></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Case Type *</label>
                  <select name="caseType" value={formData.caseType} onChange={handleChange} required>
                    <option value="">Select Type</option>
                    <option value="Abandonment">Abandonment</option>
                    <option value="Abuse">Abuse</option>
                    <option value="Orphaned">Orphaned</option>
                    <option value="Single Parent">Single Parent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group"><label>Report Date</label><input type="date" name="reportDate" value={formData.reportDate} onChange={handleChange} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" required /></div>
              <div className="form-row">
                <div className="form-group"><label>Reported By</label><input type="text" name="reportedBy" value={formData.reportedBy} onChange={handleChange} /></div>
                <div className="form-group">
                  <label>Case Status</label>
                  <select name="caseStatus" value={formData.caseStatus} onChange={handleChange}>
                    <option value="Open">Open</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Case'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cases.length === 0 ? (
        <div className="empty-state"><i className='bx bx-folder'></i><p>No case history</p></div>
      ) : (
        <div className="table-responsive">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Case Type</th>
                <th>Description</th>
                <th>Reported By</th>
                <th>Report Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr 
                  key={c.id}
                  onClick={() => handleViewDetails(c)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{c.case_type}</td>
                  <td>{c.description.substring(0, 50) + (c.description.length > 50 ? '...' : '')}</td>
                  <td>{c.reported_by || '-'}</td>
                  <td>{c.report_date ? new Date(c.report_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${c.case_status.toLowerCase().replace(' ', '-')}`}>
                      {c.case_status}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(c);
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
      {showModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Case History Details</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="record-detail-grid">
                <div className="detail-section">
                  <h5>Case Information</h5>
                  <div className="detail-row">
                    <label>Case Type:</label>
                    <span>{selectedCase.case_type}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedCase.case_status.toLowerCase().replace(' ', '-')}`}>
                      {selectedCase.case_status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Report Date:</label>
                    <span>{selectedCase.report_date ? new Date(selectedCase.report_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Reported By:</label>
                    <span>{selectedCase.reported_by || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Date Added:</label>
                    <span>{new Date(selectedCase.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Description</h5>
                  <div className="detail-row full-width">
                    <label>Case Description:</label>
                    <span>{selectedCase.description}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => exportSingleCasePDF(selectedCase)} 
                className="btn-primary"
                title="Export this case as PDF"
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

export default CaseHistoryTab;
