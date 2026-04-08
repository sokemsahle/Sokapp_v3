import axios from 'axios';
import API_CONFIG from '../config/api';
import { getCurrentUser, addUserInfoForLogging, getUserInfoForDelete } from '../utils/activityLogging';

const API_URL = '/api/children';
const BASE_URL = API_CONFIG.BASE_URL;

// Helper function to build full API URL
const getApiUrl = (endpoint) => `${BASE_URL}${endpoint}`;

// Use regular axios without auth - permissions handled by backend session/cookies

/**
 * Tier 1 - Child Management
 */

export const getChildren = async (filters = {}) => {
  const response = await axios.get(`${BASE_URL}${API_URL}`, { params: filters });
  return response.data;
};

export const getChild = async (id) => {
  const response = await axios.get(`${BASE_URL}${API_URL}/${id}`);
  return response.data;
};

export const createChild = async (data) => {
  const response = await axios.post(`${BASE_URL}${API_URL}`, addUserInfoForLogging(data));
  return response.data;
};

export const updateChild = async (id, data) => {
  const response = await axios.put(`${BASE_URL}${API_URL}/${id}`, addUserInfoForLogging(data));
  return response.data;
};

export const deleteChild = async (id) => {
  const response = await axios.delete(getApiUrl(`${API_URL}/${id}`), {
    data: getUserInfoForDelete()
  });
  return response.data;
};

/**
 * Tier 2 - Guardian Management
 */

export const getGuardians = async (childId) => {
  const response = await axios.get(getApiUrl(`${API_URL}/${childId}/guardians`));
  return response.data;
};

export const addGuardian = async (childId, data) => {
  const response = await axios.post(getApiUrl(`${API_URL}/${childId}/guardians`), data);
  return response.data;
};

/**
 * Tier 2 - Legal Documents
 */

export const getLegalDocuments = async (childId) => {
  const response = await axios.get(getApiUrl(`${API_URL}/${childId}/legal-documents`));
  return response.data;
};

export const addLegalDocument = async (childId, data) => {
  const response = await axios.post(getApiUrl(`${API_URL}/${childId}/legal-documents`), data);
  return response.data;
};

/**
 * Tier 2 - Medical Records
 */

export const getMedicalRecords = async (childId) => {
  const response = await axios.get(getApiUrl(`${API_URL}/${childId}/medical-records`));
  return response.data;
};

export const addMedicalRecord = async (childId, data) => {
  const response = await axios.post(getApiUrl(`${API_URL}/${childId}/medical-records`), data);
  return response.data;
};

/**
 * Tier 2 - Education Records
 */

export const getEducationRecords = async (childId) => {
  const response = await axios.get(getApiUrl(`${API_URL}/${childId}/education-records`));
  return response.data;
};

export const addEducationRecord = async (childId, data) => {
  const response = await axios.post(getApiUrl(`${API_URL}/${childId}/education-records`), data);
  return response.data;
};

/**
 * Tier 2 - Case History
 */

export const getCaseHistory = async (childId) => {
  const response = await axios.get(getApiUrl(`${API_URL}/${childId}/case-history`));
  return response.data;
};

export const addCaseHistory = async (childId, data) => {
  const response = await axios.post(getApiUrl(`${API_URL}/${childId}/case-history`), data);
  return response.data;
};

/**
 * Export Functions
 */

// Export all children as CSV
export const exportChildrenCSV = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const url = getApiUrl(`${API_URL}/export/csv${queryString ? `?${queryString}` : ''}`);
  
  // Open in new tab for download
  window.open(url, '_blank');
};

// Export individual child profile
export const exportChildProfile = async (id) => {
  try {
    const response = await axios.get(getApiUrl(`${API_URL}/${id}/export/pdf`));
    return response.data;
  } catch (error) {
    console.error('Error exporting child profile:', error);
    throw error;
  }
};

// Download child profile as PDF (using browser's print dialog)
export const downloadChildProfilePDF = async (id) => {
  try {
    const result = await exportChildProfile(id);
    const profileData = result.data;
    
    // Create a printable version
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content for printing with better controls
    const htmlContent = generateProfileHTML(profileData, true); // Pass true to include controls
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Don't auto-print - let user choose
    // User can click the Print button when ready
    
    return profileData;
  } catch (error) {
    console.error('Error downloading child profile PDF:', error);
    throw error;
  }
};

// Helper function to generate printable HTML
const generateProfileHTML = (data, includeControls = false) => {
  const child = data.basicInfo;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Child Profile - ${child.first_name} ${child.last_name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .print-container { background: white; padding: 40px; max-width: 900px; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { background: #667eea; color: white; padding: 8px 12px; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .info-item { margin-bottom: 8px; }
        label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
        .controls { 
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: white; 
          padding: 15px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.2); 
          z-index: 1000;
        }
        .controls button { 
          padding: 10px 20px; 
          margin: 5px; 
          border: none; 
          border-radius: 5px; 
          cursor: pointer; 
          font-size: 14px;
          font-weight: 600;
        }
        .btn-print { background: #667eea; color: white; }
        .btn-print:hover { background: #5568d3; }
        .btn-save { background: #28a745; color: white; }
        .btn-save:hover { background: #218838; }
        .btn-close { background: #dc3545; color: white; }
        .btn-close:hover { background: #c82333; }
        @media print {
          .controls { display: none !important; }
          body { background: white; padding: 0; }
          .print-container { box-shadow: none; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      ${includeControls ? `
      <div class="controls">
        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">Choose an option:</div>
        <button class="btn-print" onclick="window.print()" title="Open Print Dialog">
          🖨️ Print
        </button>
        <button class="btn-save" onclick="saveAsPDF()" title="Save as PDF">
          💾 Save as PDF
        </button>
        <button class="btn-close" onclick="window.close()" title="Close Window">
          ✖ Close
        </button>
      </div>
      ` : ''}
      
      <div class="print-container">
        <div class="header">
          <h1>Child Profile Report</h1>
          <h2>${child.first_name} ${child.last_name}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      
      <div class="section">
        <div class="section-title">Basic Information</div>
        <div class="info-grid">
          <div class="info-item"><label>Full Name:</label> ${child.first_name} ${child.middle_name || ''} ${child.last_name}</div>
          ${child.nickname ? `<div class="info-item"><label>Nickname:</label> ${child.nickname}</div>` : ''}
          <div class="info-item"><label>Gender:</label> ${child.gender}</div>
          <div class="info-item"><label>Date of Birth:</label> ${child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Unknown'}</div>
          <div class="info-item"><label>Estimated Age:</label> ${child.estimated_age || 'Unknown'}</div>
          <div class="info-item"><label>Blood Group:</label> ${child.blood_group || 'Unknown'}</div>
          <div class="info-item"><label>Nationality:</label> ${child.nationality || 'Unknown'}</div>
          <div class="info-item"><label>Religion:</label> ${child.religion || 'Unknown'}</div>
          <div class="info-item"><label>Admission Date:</label> ${child.date_of_admission ? new Date(child.date_of_admission).toLocaleDateString() : 'Unknown'}</div>
          <div class="info-item"><label>Status:</label> ${child.current_status}</div>
        </div>
      </div>
      
      ${data.guardians && data.guardians.length > 0 ? `
      <div class="section">
        <div class="section-title">Guardians</div>
        <table>
          <thead>
            <tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th></tr>
          </thead>
          <tbody>
            ${data.guardians.map(g => `
              <tr>
                <td>${g.full_name}</td>
                <td>${g.relationship}</td>
                <td>${g.phone_number || '-'}</td>
                <td>${g.email || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.legalDocuments && data.legalDocuments.length > 0 ? `
      <div class="section">
        <div class="section-title">Legal Documents</div>
        <table>
          <thead>
            <tr><th>Document Type</th><th>Date</th><th>Description</th></tr>
          </thead>
          <tbody>
            ${data.legalDocuments.map(doc => `
              <tr>
                <td>${doc.document_type}</td>
                <td>${doc.document_date ? new Date(doc.document_date).toLocaleDateString() : '-'}</td>
                <td>${doc.description || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.medicalRecords && data.medicalRecords.length > 0 ? `
      <div class="section">
        <div class="section-title">Medical Records</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Diagnosis</th><th>Treatment</th><th>Doctor</th></tr>
          </thead>
          <tbody>
            ${data.medicalRecords.map(rec => `
              <tr>
                <td>${rec.medical_date ? new Date(rec.medical_date).toLocaleDateString() : '-'}</td>
                <td>${rec.diagnosis || '-'}</td>
                <td>${rec.treatment || '-'}</td>
                <td>${rec.doctor_name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.educationRecords && data.educationRecords.length > 0 ? `
      <div class="section">
        <div class="section-title">Education Records</div>
        <table>
          <thead>
            <tr><th>School</th><th>Grade</th><th>Year</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${data.educationRecords.map(rec => `
              <tr>
                <td>${rec.school_name}</td>
                <td>${rec.grade_level || '-'}</td>
                <td>${rec.academic_year || '-'}</td>
                <td>${rec.enrollment_status || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.caseHistory && data.caseHistory.length > 0 ? `
      <div class="section">
        <div class="section-title">Case History</div>
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Notes</th><th>Social Worker</th></tr>
          </thead>
          <tbody>
            ${data.caseHistory.map(caseItem => `
              <tr>
                <td>${caseItem.case_date ? new Date(caseItem.case_date).toLocaleDateString() : '-'}</td>
                <td>${caseItem.case_type}</td>
                <td>${caseItem.notes || '-'}</td>
                <td>${caseItem.social_worker_name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; cursor: pointer; margin-right: 10px;">Print Again</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; cursor: pointer;">Close</button>
      </div>
    </body>
    <script>
      // Function to save as PDF using browser's print-to-PDF functionality
      function saveAsPDF() {
        // Show instructions
        alert('To save as PDF:\n\n1. In the print dialog that will appear, look for "Destination" or "Printer"\n2. Select "Save as PDF" or "Microsoft Print to PDF"\n3. Click "Save" and choose where to save the file\n\nThe print dialog will now open.');
        
        // Trigger print dialog where user can select "Save as PDF"
        window.print();
      }
    </script>
    </html>
  `;
};

export default {
  getChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild,
  getGuardians,
  addGuardian,
  getLegalDocuments,
  addLegalDocument,
  getMedicalRecords,
  addMedicalRecord,
  getEducationRecords,
  addEducationRecord,
  getCaseHistory,
  addCaseHistory,
  exportChildrenCSV,
  exportChildProfile,
  downloadChildProfilePDF,
};
