import React, { useState, useEffect } from 'react';
import { getEducationRecords, addEducationRecord } from '../../services/childService';
import axios from 'axios';
import './ChildProfile.css';
import * as XLSX from 'xlsx';
import ExportUtils from '../../utils/ExportUtils';

const EducationTab = ({ childId, user }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    gradeLevel: '',
    enrollmentDate: '',
    performanceNotes: '',
    certificateFile: ''
  });

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
    }
  };

  useEffect(() => { loadDocuments(); }, [childId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getEducationRecords(childId);
      setRecords(result.data || []);
    } catch (err) { console.error('Error loading education records:', err); } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      let certPath = formData.certificateFile;
      
      // Upload file if selected
      if (certificateFile) {
        const fileFormData = new FormData();
        fileFormData.append('certificate', certificateFile);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const uploadResponse = await axios.post(
          `${apiUrl}/api/children/${childId}/education-records/upload`,
          fileFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        certPath = uploadResponse.data.data.certificateFile;
      }
      
      // Add record with file path
      const recordData = { ...formData, certificateFile: certPath };
      await addEducationRecord(childId, recordData);
      
      alert('Education record added successfully');
      setShowAddForm(false);
      loadDocuments();
      setFormData({ schoolName: '', gradeLevel: '', enrollmentDate: '', performanceNotes: '', certificateFile: '' });
      setCertificateFile(null);
    } catch (err) {
      alert('Failed to add education record: ' + (err.response?.data?.message || err.message));
      console.error('Error adding education record:', err);
    } finally { setSubmitting(false); }
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const exportToExcel = () => {
    const dataToExport = records.map(rec => ({
      'ID': rec.id,
      'School Name': rec.school_name,
      'Grade Level': rec.grade_level || '-',
      'Enrollment Date': rec.enrollment_date ? new Date(rec.enrollment_date).toLocaleDateString() : '-',
      'Performance Notes': rec.performance_notes || '-',
      'Certificate': rec.certificate_file ? 'Attached' : 'No File',
      'Created': new Date(rec.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Education Records');
    
    const fileName = `Education_Records_${childId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportEducationRecordsPDF = async () => {
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
        { field: 'Total Education Records', value: records.length.toString() },
        { field: '', value: '' },
      ];
      
      records.forEach((rec, index) => {
        formattedData.push({ field: `Record ${index + 1} - School`, value: rec.school_name });
        formattedData.push({ field: '  Grade Level', value: rec.grade_level || '-' });
        formattedData.push({ field: '  Enrollment Date', value: rec.enrollment_date ? new Date(rec.enrollment_date).toLocaleDateString() : '-' });
        if (rec.performance_notes) formattedData.push({ field: '  Performance Notes', value: rec.performance_notes });
        if (rec.certificate_file) formattedData.push({ field: '  Certificate', value: rec.certificate_file });
        formattedData.push({ field: '', value: '' });
      });
      
      ExportUtils.exportToPDF(
        `Education Records - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Education_Records_${child.first_name}_${child.last_name}`
      );
    } catch (error) {
      console.error('Error exporting education records PDF:', error);
      alert('Failed to export education records. Please try again.');
    }
  };

  const exportSingleRecordPDF = async (record) => {
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
        { field: 'Education Record', value: '' },
        { field: '  School Name', value: record.school_name },
        { field: '  Grade Level', value: record.grade_level || '-' },
        { field: '  Enrollment Date', value: record.enrollment_date ? new Date(record.enrollment_date).toLocaleDateString() : '-' },
        { field: '  Created Date', value: new Date(record.created_at).toLocaleDateString() },
      ];
      
      if (record.performance_notes) formattedData.push({ field: '  Performance Notes', value: record.performance_notes });
      
      if (record.certificate_file) {
        formattedData.push({ field: '', value: '' });
        formattedData.push({ field: 'Certificate', value: '' });
        formattedData.push({ field: '  File', value: record.certificate_file });
      }
      
      ExportUtils.exportToPDF(
        `Education - ${record.school_name}`,
        columns,
        formattedData,
        `Education_${record.school_name}_${new Date().toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Error exporting single education record PDF:', error);
      alert('Failed to export education record. Please try again.');
    }
  };

  if (loading) return <div className="tab-panel"><div className="loading-container"><div className="spinner"></div><p>Loading records...</p></div></div>;

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h3>Education Records</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {records.length > 0 && (
            <>
              <button onClick={exportToExcel} className="btn-secondary" title="Export to Excel">
                <i className='bx bxs-file-excel'></i> Export Excel
              </button>
              <button onClick={exportEducationRecordsPDF} className="btn-secondary" title="Export to PDF">
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
            </>
          )}
          {user?.permissions?.includes('education_manage') && (
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary"><i className='bx bx-plus'></i> Add Record</button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Add Education Record</h4>
              <button onClick={() => setShowAddForm(false)} className="btn-close"><i className='bx bx-x'></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>School Name</label><input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} /></div>
                <div className="form-group"><label>Grade Level</label><input type="text" name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Enrollment Date</label><input type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleChange} /></div>
              </div>
              <div className="form-group"><label>Performance Notes</label><textarea name="performanceNotes" value={formData.performanceNotes} onChange={handleChange} rows="3" /></div>
              <div className="form-group">
                <label>Upload Certificate *</label>
                <input
                  type="file"
                  name="certificateUpload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                <small style={{ display: 'block', marginTop: '5px', color: 'var(--dark-gray)' }}>
                  Accepted: PDF, DOC, DOCX, JPEG, PNG. Max: 5MB
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="empty-state"><i className='bx bx-book'></i><p>No education records</p></div>
      ) : (
        <div className="table-responsive">
          <table className="documents-table">
            <thead>
              <tr>
                <th>School Name</th>
                <th>Grade Level</th>
                <th>Enrollment Date</th>
                <th>Performance Notes</th>
                <th>Certificate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr 
                  key={rec.id}
                  onClick={() => handleViewDetails(rec)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{rec.school_name}</td>
                  <td>{rec.grade_level || '-'}</td>
                  <td>{rec.enrollment_date ? new Date(rec.enrollment_date).toLocaleDateString() : '-'}</td>
                  <td>{rec.performance_notes ? rec.performance_notes.substring(0, 30) + (rec.performance_notes.length > 30 ? '...' : '-') : '-'}</td>
                  <td>
                    {rec.certificate_file ? (
                      <span style={{ color: 'var(--primary)' }}>
                        <i className='bx bx-link'></i> Attached
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(rec);
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
      {showModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Education Record Details</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="record-detail-grid">
                <div className="detail-section">
                  <h5>Education Information</h5>
                  <div className="detail-row">
                    <label>School Name:</label>
                    <span>{selectedRecord.school_name}</span>
                  </div>
                  <div className="detail-row">
                    <label>Grade Level:</label>
                    <span>{selectedRecord.grade_level || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Enrollment Date:</label>
                    <span>{selectedRecord.enrollment_date ? new Date(selectedRecord.enrollment_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Date Added:</label>
                    <span>{new Date(selectedRecord.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {(selectedRecord.performance_notes || selectedRecord.certificate_file) && (
                  <div className="detail-section">
                    <h5>Additional Information</h5>
                    {selectedRecord.performance_notes && (
                      <div className="detail-row full-width">
                        <label>Performance Notes:</label>
                        <span>{selectedRecord.performance_notes}</span>
                      </div>
                    )}
                    {selectedRecord.certificate_file && (
                      <div className="detail-row full-width">
                        <label>Certificate File:</label>
                        <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedRecord.certificate_file}`} target="_blank" rel="noopener noreferrer">
                          <i className='bx bx-link-external'></i> View Certificate
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => exportSingleRecordPDF(selectedRecord)} 
                className="btn-primary"
                title="Export this record as PDF"
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

export default EducationTab;
