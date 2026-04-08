import React, { useState, useEffect } from 'react';
import './EmployeeForm.css';
import { getPrograms } from '../../services/programService';
import API_CONFIG from '../../config/api';

const EmployeeForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [currentTier, setCurrentTier] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [lookupData, setLookupData] = useState({
    departments: [],
    positions: []
  });
  const [formData, setFormData] = useState({
    // Tier 1: General Information
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    salary: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    profileImage: '',
    status: 'Active',
    // Tier 2: Dashboard Fields
    annualLeaveDays: '21',
    sickLeaveDays: '10',
    usedAnnualLeave: '0',
    usedSickLeave: '0',
    recognition: '',
    recognitionDate: '',
    program_id: '',
    // Tier 2: Documents
    documents: []
  });

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        employeeId: initialData.employeeId || '',
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        department: initialData.department || '',
        position: initialData.position || '',
        hireDate: initialData.hireDate || '',
        salary: initialData.salary || '',
        address: initialData.address || '',
        emergencyContact: initialData.emergencyContact || '',
        emergencyPhone: initialData.emergencyPhone || '',
        profileImage: initialData.profileImage || '',
        status: initialData.status || 'Active',
        annualLeaveDays: initialData.annualLeaveDays || '21',
        sickLeaveDays: initialData.sickLeaveDays || '10',
        usedAnnualLeave: initialData.usedAnnualLeave || '0',
        usedSickLeave: initialData.usedSickLeave || '0',
        recognition: initialData.recognition || '',
        recognitionDate: initialData.recognitionDate || '',
        program_id: initialData.program_id || '',
        documents: initialData.documents || []
      });
      setCurrentTier(1); // Reset to tier 1 when editing
      
      // If editing an existing employee, fetch their documents from the backend
      if (initialData.id) {
        fetchEmployeeDocuments(initialData.id);
      }
    } else {
      // Reset form when creating new
      setFormData({
        employeeId: '',
        fullName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hireDate: '',
        salary: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        profileImage: '',
        status: 'Active',
        annualLeaveDays: '21',
        sickLeaveDays: '10',
        usedAnnualLeave: '0',
        usedSickLeave: '0',
        recognition: '',
        recognitionDate: '',
        documents: []
      });
      setCurrentTier(1);
    }
  }, [initialData]);

  // Load programs and lookup data on mount
  useEffect(() => {
    loadPrograms();
    loadLookupData();
  }, []);

  const loadPrograms = async () => {
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.programs);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadLookupData = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOOKUP_DATA));
      const result = await response.json();
      
      if (result.success) {
        setLookupData({
          departments: result.departments || [],
          positions: result.positions || []
        });
      }
    } catch (error) {
      console.error('Error loading lookup data:', error);
      // Fallback to default departments if API fails
      setLookupData({
        departments: ['HR', 'Finance', 'IT', 'Operations', 'Sales', 'Marketing', 'Administration', 'Program'],
        positions: []
      });
    }
  };

  // Function to fetch employee documents
  const fetchEmployeeDocuments = async (employeeId) => {
    try {
      console.log('[Fetch] Fetching documents for employee:', employeeId);
      const response = await fetch(API_CONFIG.getUrl(`/api/employees/${employeeId}/documents`));
      const result = await response.json();
      
      if (result.success) {
        console.log('[Fetch] Documents received:', result.documents);
        // Update the documents in form data
        setFormData(prev => ({
          ...prev,
          documents: result.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            issueDate: doc.issue_date,
            expiryDate: doc.expiry_date,
            notes: doc.notes,
            uploadDate: doc.upload_date,
            fileName: doc.file_name,
            // Try 'file' first (new), then 'file_path' (old) for backwards compatibility
            file: doc.file || doc.file_path
          }))
        }));
        console.log('[Fetch] Documents mapped to state');
      } else {
        console.error('Failed to fetch documents:', result.message);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  // Function to download a document
  const downloadDocument = async (doc) => {
    try {
      console.log('[Download] Attempting to download:', doc);
      console.log('[Download] File type:', typeof doc.file);
      console.log('[Download] File length:', doc.file ? doc.file.length : 0);
      console.log('[Download] File value (first 100 chars):', doc.file ? doc.file.substring(0, 100) : 'NULL');
      
      // Check if file exists
      if (!doc.file) {
        console.error('[Download Error] Document has no file:', doc);
        alert(`Document "${doc.name}" has no file attached. This may be an old record that needs to be deleted.`);
        return;
      }
      
      // If it's a Base64 string (from database)
      if (typeof doc.file === 'string' && doc.file.startsWith('data:')) {
        console.log('[Download] Downloading Base64 file');
        
        try {
          // Convert Base64 to Blob WITHOUT using fetch
          const commaIndex = doc.file.indexOf(',');
          if (commaIndex === -1) {
            throw new Error('Invalid data URL format - missing comma separator');
          }
          
          const base64Data = doc.file.substring(commaIndex + 1);
          const mimeType = doc.file.substring(5, commaIndex).split(';')[0];
          
          console.log('[Download] MIME type:', mimeType);
          console.log('[Download] Base64 data length:', base64Data.length);
          
          // Validate Base64 string (remove whitespace and check)
          const cleanBase64 = base64Data.replace(/\s/g, '');
          
          // Check if it looks like valid Base64
          if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
            throw new Error('Invalid Base64 characters detected. The file data may be corrupted.');
          }
          
          // Decode Base64 to binary
          const binaryString = atob(cleanBase64);
          const byteArray = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            byteArray[i] = binaryString.charCodeAt(i);
          }
          
          // Create Blob from byte array
          const blob = new Blob([byteArray], { type: mimeType });
          
          // Create blob URL
          const blobUrl = URL.createObjectURL(blob);
          
          // Create and trigger download
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = doc.fileName || `document_${doc.id}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          URL.revokeObjectURL(blobUrl);
          
          console.log('[Download] Download initiated successfully');
        } catch (decodeError) {
          console.error('[Download] Base64 decode failed:', decodeError);
          console.error('[Download] Full file data preview:', doc.file.substring(0, 200));
          
          // Provide helpful error message
          if (decodeError.message.includes('not correctly encoded')) {
            alert(`Failed to decode file. The Base64 data appears to be corrupted or incomplete.\n\nFile size in DB: ${doc.file.length} characters\nExpected: Should start with "data:image/...;base64," followed by valid Base64`);
          } else {
            alert('Error downloading file: ' + decodeError.message);
          }
          return;
        }
      } 
      // If it's a File object (local, not yet uploaded)
      else if (doc.file instanceof File || (typeof doc.file === 'object' && doc.file.size)) {
        console.log('[Download] Downloading local File object:', doc.file.name);
        const blobUrl = URL.createObjectURL(doc.file);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.name || doc.file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        console.log('[Download] Download initiated successfully');
      } else {
        console.error('[Download Error] Unknown file type:', typeof doc.file, doc.file);
        alert(`Cannot download document - file format not recognized.`);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document: ' + error.message);
    }
  };

  // Function to remove a document
  const removeDocument = async (docIndex, employeeId) => {
    const docToRemove = formData.documents[docIndex];
    
    // If the document exists in the database (has an id), make API call to delete it
    if (docToRemove.id) {
      if (window.confirm('Are you sure you want to delete this document?')) {
        try {
          const response = await fetch(API_CONFIG.getUrl(`/api/employees/${employeeId}/documents/${docToRemove.id}`), {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (!result.success) {
            console.error('Failed to delete document:', result.message);
            alert('Failed to delete document from server');
            return;
          }
        } catch (error) {
          console.error('Error deleting document:', error);
          alert('Error deleting document');
          return;
        }
      }
    }
    
    // Remove document from local state
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, index) => index !== docIndex)
    }));
  };

  const [newDocument, setNewDocument] = useState({
    name: '',
    type: '',
    file: null,
    issueDate: '',
    expiryDate: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentInputChange = (e) => {
    const { name, value } = e.target;
    setNewDocument(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDocument(prev => ({
        ...prev,
        file: file,
        name: prev.name || file.name
      }));
    }
  };

  const addDocument = () => {
    if (!newDocument.name || !newDocument.type) {
      alert('Please enter document name and type');
      return;
    }

    const documentToAdd = {
      ...newDocument,
      id: Date.now(), // Temporary ID
      uploadDate: new Date().toISOString().split('T')[0]
    };

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, documentToAdd]
    }));

    // Reset new document form
    setNewDocument({
      name: '',
      type: '',
      file: null,
      issueDate: '',
      expiryDate: '',
      notes: ''
    });
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const nextTier = () => {
    // Validate Tier 1 before proceeding
    if (!formData.fullName || !formData.email || !formData.department) {
      alert('Please fill in required fields: Full Name, Email, and Department');
      return;
    }
    setCurrentTier(2);
  };

  const prevTier = () => {
    setCurrentTier(1);
  };

  if (!isOpen) return null;

  return (
    <div className="employee-form-overlay">
      <div className="employee-form-container">
        <div className="form-header">
          <h2>{initialData ? 'Edit Employee' : 'New Employee'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Progress Indicator */}
        <div className="tier-progress">
          <div className={`progress-step ${currentTier >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>General Info</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentTier >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Documents</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tier 1: General Information */}
          {currentTier === 1 && (
            <div className="tier-content">
              <h3>General Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID *</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    placeholder="EMP-001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@company.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+251 91 234 5678"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {lookupData.departments.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Position *</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Enter position or select from list"
                    list="positions-list"
                    required
                  />
                  <datalist id="positions-list">
                    {lookupData.positions.map((pos, index) => (
                      <option key={index} value={pos} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Show Program selection only when department is Program */}
              {formData.department === 'Program' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Program *</label>
                    <select
                      name="program_id"
                      value={formData.program_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Program</option>
                      {programs.map(program => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, Country"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="+251 91 876 5432"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Former Employee">Former Employee</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tier 2: Dashboard & Documents */}
          {currentTier === 2 && (
            <div className="tier-content">
              <h3>Dashboard Information</h3>

              {/* Profile Image Upload */}
              <div className="profile-image-section">
                {formData.profileImage ? (
                  <img 
                    src={formData.profileImage} 
                    alt="Profile Preview" 
                    className="profile-image-preview"
                  />
                ) : (
                  <div className="profile-image-placeholder">
                    <i className='bx bx-user'></i>
                  </div>
                )}
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  className="profile-image-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, profileImage: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="profileImage" className="profile-image-label">
                  <i className='bx bx-camera'></i>
                  {formData.profileImage ? 'Change Photo' : 'Upload Photo'}
                </label>
                {formData.profileImage && (
                  <button 
                    type="button"
                    className="profile-image-remove"
                    onClick={() => setFormData(prev => ({ ...prev, profileImage: '' }))}
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Leave Balance */}
              <div className="form-row">
                <div className="form-group">
                  <label>Annual Leave Days (Total)</label>
                  <input
                    type="number"
                    name="annualLeaveDays"
                    value={formData.annualLeaveDays}
                    onChange={handleInputChange}
                    placeholder="21"
                  />
                </div>
                <div className="form-group">
                  <label>Annual Leave Used</label>
                  <input
                    type="number"
                    name="usedAnnualLeave"
                    value={formData.usedAnnualLeave}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sick Leave Days (Total)</label>
                  <input
                    type="number"
                    name="sickLeaveDays"
                    value={formData.sickLeaveDays}
                    onChange={handleInputChange}
                    placeholder="10"
                  />
                </div>
                <div className="form-group">
                  <label>Sick Leave Used</label>
                  <input
                    type="number"
                    name="usedSickLeave"
                    value={formData.usedSickLeave}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Recognition */}
              <div className="form-row">
                <div className="form-group">
                  <label>Recognition/Award</label>
                  <input
                    type="text"
                    name="recognition"
                    value={formData.recognition}
                    onChange={handleInputChange}
                    placeholder="Employee of the Month - Jan 2026"
                  />
                </div>
                <div className="form-group">
                  <label>Recognition Date</label>
                  <input
                    type="date"
                    name="recognitionDate"
                    value={formData.recognitionDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="section-divider">
                <h4>Employee Documents</h4>
              </div>

              {/* Add New Document */}
              <div className="add-document-section">
                <h4>Add New Document</h4>
                <div className="document-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={newDocument.name}
                        onChange={handleDocumentInputChange}
                        placeholder="Passport, ID, Contract, etc."
                      />
                    </div>
                    <div className="form-group">
                      <label>Document Type *</label>
                      <select
                        name="type"
                        value={newDocument.type}
                        onChange={handleDocumentInputChange}
                      >
                        <option value="">Select Type</option>
                        <option value="id">ID Card</option>
                        <option value="passport">Passport</option>
                        <option value="contract">Employment Contract</option>
                        <option value="certificate">Certificate</option>
                        <option value="license">License</option>
                        <option value="medical">Medical Record</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Issue Date</label>
                      <input
                        type="date"
                        name="issueDate"
                        value={newDocument.issueDate}
                        onChange={handleDocumentInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={newDocument.expiryDate}
                        onChange={handleDocumentInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Upload File</label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <small>Accepted: PDF, DOC, DOCX, JPG, PNG</small>
                  </div>

                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={newDocument.notes}
                      onChange={handleDocumentInputChange}
                      placeholder="Additional notes about this document..."
                      rows="2"
                    />
                  </div>

                  <button type="button" className="btn-add-doc" onClick={addDocument}>
                    <i className='bx bx-plus'></i> Add Document
                  </button>
                </div>
              </div>

              {/* Documents List */}
              <div className="documents-list">
                <h4>Attached Documents ({formData.documents.length})</h4>
                {formData.documents.length === 0 ? (
                  <p className="no-documents">No documents attached yet.</p>
                ) : (
                  <div className="document-cards">
                    {formData.documents.map((doc, index) => (
                      <div key={doc.id} className="document-card">
                        <div className="doc-icon">
                          <i className={`bx ${getDocumentIcon(doc.type)}`}></i>
                        </div>
                        <div className="doc-info">
                          <h5>{doc.name}</h5>
                          <span className="doc-type">{formatDocType(doc.type)}</span>
                          {doc.issueDate && (
                            <span className="doc-date">
                              Issued: {formatDate(doc.issueDate)}
                            </span>
                          )}
                          {doc.expiryDate && (
                            <span className={`doc-date ${isExpired(doc.expiryDate) ? 'expired' : ''}`}>
                              Expires: {formatDate(doc.expiryDate)}
                            </span>
                          )}
                          {doc.notes && <p className="doc-notes">{doc.notes}</p>}
                        </div>
                        <div className="doc-actions">
                          {doc.file && (
                            <button
                              type="button"
                              className="btn-download-doc"
                              title="Download Document"
                              onClick={() => downloadDocument(doc)}
                            >
                              <i className='bx bxs-download'></i>
                            </button>
                          )}
                          {doc.file && typeof doc.file === 'object' && (
                            <span className="file-name" title={doc.file.name}>
                              <i className='bx bx-paperclip'></i>
                            </span>
                          )}
                          <button
                            type="button"
                            className="btn-remove"
                            title="Remove Document"
                            onClick={() => removeDocument(index, initialData?.id)}
                          >
                            <i className='bx bx-trash'></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            {currentTier === 1 ? (
              <>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={nextTier}>
                  Next <i className='bx bx-chevron-right'></i>
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={prevTier}>
                  <i className='bx bx-chevron-left'></i> Back
                </button>
                <div className="right-actions">
                  <button type="button" className="btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <i className='bx bx-save'></i> Save Employee
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper functions
const getDocumentIcon = (type) => {
  const icons = {
    id: 'bx-id-card',
    passport: 'bx-passport',
    contract: 'bx-file',
    certificate: 'bx-certification',
    license: 'bx-id-card',
    medical: 'bx-plus-medical',
    other: 'bx-file-blank'
  };
  return icons[type] || 'bx-file-blank';
};

const formatDocType = (type) => {
  const types = {
    id: 'ID Card',
    passport: 'Passport',
    contract: 'Employment Contract',
    certificate: 'Certificate',
    license: 'License',
    medical: 'Medical Record',
    other: 'Other'
  };
  return types[type] || type;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const isExpired = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

export default EmployeeForm;
