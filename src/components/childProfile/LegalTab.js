import React, { useState, useEffect } from 'react';
import { getLegalDocuments, addLegalDocument } from '../../services/childService';
import axios from 'axios';
import './ChildProfile.css';
import * as XLSX from 'xlsx';
import ExportUtils from '../../utils/ExportUtils';

const LegalTab = ({ childId, user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    documentType: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    documentFile: '',
    verifiedStatus: false
  });

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [childId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getLegalDocuments(childId);
      setDocuments(result.data || []);
    } catch (err) {
      console.error('Error loading legal documents:', err);
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
      
      let documentPath = formData.documentFile;
      
      // Upload file if selected
      if (documentFile) {
        const fileFormData = new FormData();
        fileFormData.append('documentFile', documentFile);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const uploadResponse = await axios.post(
          `${apiUrl}/api/children/${childId}/legal-documents/upload`,
          fileFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        documentPath = uploadResponse.data.data.documentFile;
      }
      
      // Add document with file path
      const documentData = { ...formData, documentFile: documentPath };
      await addLegalDocument(childId, documentData);
      
      alert('Legal document added successfully');
      setShowAddForm(false);
      loadDocuments();
      
      setFormData({
        documentType: '',
        documentNumber: '',
        issueDate: '',
        expiryDate: '',
        documentFile: '',
        verifiedStatus: false
      });
      setDocumentFile(null);
    } catch (err) {
      alert('Failed to add legal document: ' + (err.response?.data?.message || err.message));
      console.error('Error adding legal document:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const exportToExcel = () => {
    const dataToExport = documents.map(doc => ({
      'ID': doc.id,
      'Type': doc.document_type,
      'Number': doc.document_number || '-',
      'Issue Date': doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : '-',
      'Expiry Date': doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-',
      'Status': doc.verified_status ? 'Verified' : 'Unverified',
      'File': doc.document_file || 'No File',
      'Created': new Date(doc.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Legal Documents');
    
    const fileName = `Legal_Documents_${childId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportLegalDocumentsPDF = async () => {
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
        { field: 'Total Legal Documents', value: documents.length.toString() },
        { field: '', value: '' },
      ];
      
      documents.forEach((doc, index) => {
        formattedData.push({ field: `Document ${index + 1} - Type`, value: doc.document_type });
        formattedData.push({ field: '  Document Number', value: doc.document_number || '-' });
        formattedData.push({ field: '  Issue Date', value: doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : '-' });
        formattedData.push({ field: '  Expiry Date', value: doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-' });
        formattedData.push({ field: '  Status', value: doc.verified_status ? 'Verified' : 'Unverified' });
        if (doc.document_file) formattedData.push({ field: '  File', value: doc.document_file });
        formattedData.push({ field: '', value: '' });
      });
      
      ExportUtils.exportToPDF(
        `Legal Documents - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Legal_Documents_${child.first_name}_${child.last_name}`
      );
    } catch (error) {
      console.error('Error exporting legal documents PDF:', error);
      alert('Failed to export legal documents. Please try again.');
    }
  };

  const exportSingleDocumentPDF = async (document) => {
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
        { field: 'Document Information', value: '' },
        { field: '  Document Type', value: document.document_type },
        { field: '  Document Number', value: document.document_number || '-' },
        { field: '  Issue Date', value: document.issue_date ? new Date(document.issue_date).toLocaleDateString() : '-' },
        { field: '  Expiry Date', value: document.expiry_date ? new Date(document.expiry_date).toLocaleDateString() : '-' },
        { field: '  Status', value: document.verified_status ? 'Verified' : 'Unverified' },
        { field: '  Created Date', value: new Date(document.created_at).toLocaleDateString() },
      ];
      
      if (document.document_file) {
        formattedData.push({ field: '', value: '' });
        formattedData.push({ field: 'File Attachment', value: '' });
        formattedData.push({ field: '  Document', value: document.document_file });
      }
      
      ExportUtils.exportToPDF(
        `${document.document_type} - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Legal_${document.document_type}_${new Date().toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Error exporting single document PDF:', error);
      alert('Failed to export document. Please try again.');
    }
  };

  if (loading) {
    return <div className="tab-panel"><div className="loading-container"><div className="spinner"></div><p>Loading documents...</p></div></div>;
  }

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h3>Legal Documents</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {documents.length > 0 && (
            <>
              <button onClick={exportToExcel} className="btn-secondary" title="Export to Excel">
                <i className='bx bxs-file-excel'></i> Export Excel
              </button>
              <button onClick={exportLegalDocumentsPDF} className="btn-secondary" title="Export to PDF">
                <i className='bx bxs-file-pdf'></i> Export PDF
              </button>
            </>
          )}
          {user?.permissions?.includes('legal_manage') && (
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
              <i className='bx bx-plus'></i> Add Document
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Add Legal Document</h4>
              <button onClick={() => setShowAddForm(false)} className="btn-close"><i className='bx bx-x'></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Document Type *</label>
                <select name="documentType" value={formData.documentType} onChange={handleChange} required>
                  <option value="">Select Type</option>
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="Court Order">Court Order</option>
                  <option value="Police Report">Police Report</option>
                  <option value="Surrender Form">Surrender Form</option>
                  <option value="Adoption Paper">Adoption Paper</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Document Number</label><input type="text" name="documentNumber" value={formData.documentNumber} onChange={handleChange} /></div>
                <div className="form-group"><label>Issue Date</label><input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Expiry Date</label><input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} /></div>
              </div>
              <div className="form-group">
                <label>Upload Document *</label>
                <input
                  type="file"
                  name="documentFileUpload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                <small style={{ display: 'block', marginTop: '5px', color: 'var(--dark-gray)' }}>
                  Accepted: PDF, DOC, DOCX, JPEG, PNG. Max: 5MB
                </small>
              </div>
              <div className="form-group checkbox-group">
                <label><input type="checkbox" name="verifiedStatus" checked={formData.verifiedStatus} onChange={handleChange} /> Verified</label>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Document'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="empty-state"><i className='bx bx-file'></i><p>No legal documents</p></div>
      ) : (
        <div className="table-responsive">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Number</th>
                <th>Issue Date</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr 
                  key={doc.id}
                  onClick={() => handleViewDetails(doc)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{doc.document_type}</td>
                  <td>{doc.document_number || '-'}</td>
                  <td>{doc.issue_date ? new Date(doc.issue_date).toLocaleDateString() : '-'}</td>
                  <td>{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${doc.verified_status ? 'active' : 'inactive'}`}>
                      {doc.verified_status ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td>
                    {doc.document_file ? (
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
                        handleViewDetails(doc);
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
      {showModal && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Legal Document Details</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="record-detail-grid">
                <div className="detail-section">
                  <h5>Document Information</h5>
                  <div className="detail-row">
                    <label>Document Type:</label>
                    <span>{selectedDocument.document_type}</span>
                  </div>
                  <div className="detail-row">
                    <label>Document Number:</label>
                    <span>{selectedDocument.document_number || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Issue Date:</label>
                    <span>{selectedDocument.issue_date ? new Date(selectedDocument.issue_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Expiry Date:</label>
                    <span>{selectedDocument.expiry_date ? new Date(selectedDocument.expiry_date).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge ${selectedDocument.verified_status ? 'active' : 'inactive'}`}>
                      {selectedDocument.verified_status ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Date Added:</label>
                    <span>{new Date(selectedDocument.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedDocument.document_file && (
                  <div className="detail-section">
                    <h5>File Attachment</h5>
                    <div className="detail-row full-width">
                      <label>Document File:</label>
                      <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedDocument.document_file}`} target="_blank" rel="noopener noreferrer">
                        <i className='bx bx-link-external'></i> View Document
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => exportSingleDocumentPDF(selectedDocument)} 
                className="btn-primary"
                title="Export this document as PDF"
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

export default LegalTab;
