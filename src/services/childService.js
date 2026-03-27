import axios from 'axios';
import { getCurrentUser, addUserInfoForLogging, getUserInfoForDelete } from '../utils/activityLogging';

const API_URL = '/api/children';

// Use regular axios without auth - permissions handled by backend session/cookies

/**
 * Tier 1 - Child Management
 */

export const getChildren = async (filters = {}) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}`, { params: filters });
  return response.data;
};

export const getChild = async (id) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${id}`);
  return response.data;
};

export const createChild = async (data) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}`, addUserInfoForLogging(data));
  return response.data;
};

export const updateChild = async (id, data) => {
  const response = await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${id}`, addUserInfoForLogging(data));
  return response.data;
};

export const deleteChild = async (id) => {
  const response = await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${id}`, {
    data: getUserInfoForDelete()
  });
  return response.data;
};

/**
 * Tier 2 - Guardian Management
 */

export const getGuardians = async (childId) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/guardians`);
  return response.data;
};

export const addGuardian = async (childId, data) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/guardians`, data);
  return response.data;
};

/**
 * Tier 2 - Legal Documents
 */

export const getLegalDocuments = async (childId) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/legal-documents`);
  return response.data;
};

export const addLegalDocument = async (childId, data) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/legal-documents`, data);
  return response.data;
};

/**
 * Tier 2 - Medical Records
 */

export const getMedicalRecords = async (childId) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/medical-records`);
  return response.data;
};

export const addMedicalRecord = async (childId, data) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/medical-records`, data);
  return response.data;
};

/**
 * Tier 2 - Education Records
 */

export const getEducationRecords = async (childId) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/education-records`);
  return response.data;
};

export const addEducationRecord = async (childId, data) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/education-records`, data);
  return response.data;
};

/**
 * Tier 2 - Case History
 */

export const getCaseHistory = async (childId) => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/case-history`);
  return response.data;
};

export const addCaseHistory = async (childId, data) => {
  const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${childId}/case-history`, data);
  return response.data;
};

/**
 * Export Functions
 */

// Export all children as CSV
export const exportChildrenCSV = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/export/csv${queryString ? `?${queryString}` : ''}`;
  
  // Open in new tab for download
  window.open(url, '_blank');
};

// Export individual child profile
export const exportChildProfile = async (id) => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${API_URL}/${id}/export/pdf`);
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
    
    // Generate HTML content for printing
    const htmlContent = generateProfileHTML(profileData);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
    
    return profileData;
  } catch (error) {
    console.error('Error downloading child profile PDF:', error);
    throw error;
  }
};

// Helper function to generate printable HTML
const generateProfileHTML = (data) => {
  const child = data.basicInfo;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Child Profile - ${child.first_name} ${child.last_name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { background: #667eea; color: white; padding: 8px 12px; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .info-item { margin-bottom: 8px; }
        label { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Child Profile Report</h1>
        <h2>${child.first_name} ${child.last_name}</h2>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Basic Information</div>
        <div class="info-grid">
          <div class="info-item"><label>Full Name:</label> ${child.first_name} ${child.middle_name || ''} ${child.last_name}</div>
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
