import React, { useState, useEffect } from 'react';
import { getMedicalRecords, addMedicalRecord } from '../../services/childService';
import axios from 'axios';
import './ChildProfile.css';
import * as XLSX from 'xlsx';
import ExportUtils from '../../utils/ExportUtils';

const MedicalTab = ({ childId, user }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medicalFile, setMedicalFile] = useState(null);
  const [noteType, setNoteType] = useState('ongoing_health'); // 'home_health_care' or 'ongoing_health'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [childData, setChildData] = useState(null);
  
  const [formData, setFormData] = useState({
    medicalCondition: '',
    vaccinationStatus: '',
    lastCheckup: '',
    allergies: '',
    medications: '',
    doctorName: '',
    hospitalName: '',
    medicalReportFile: '',
    
    // Home Health Care Note Fields
    ageYears: '',
    heightCm: '',
    weightKg: '',
    headCircumferenceCm: '',
    weightForAgePercentile: '',
    weightForHeightPercentile: '',
    heightForAgePercentile: '',
    temperatureCelsius: '',
    respirationRate: '',
    pulseRate: '',
    spo2Percentage: '',
    otherVitals: '',
    presentIllness: '',
    treatmentPlan: '',
    
    // Ongoing Health Note Fields
    performerFirstName: '',
    performerMiddleName: '',
    performerLastName: '',
    medicalCenterName: '',
    doctorSpecialty: '',
    diagnosis: '',
    visitReason: '',
    visitDetails: '',
    nextAppointmentDate: ''
  });

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedicalFile(file);
    }
  };

  useEffect(() => { loadDocuments(); }, [childId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getMedicalRecords(childId);
      setRecords(result.data || []);
    } catch (err) { console.error('Error loading medical records:', err); } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNoteTypeChange = (type) => {
    setNoteType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      let reportPath = formData.medicalReportFile;
      
      // Upload file if selected
      if (medicalFile) {
        const fileFormData = new FormData();
        fileFormData.append('medicalReport', medicalFile);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const uploadResponse = await axios.post(
          `${apiUrl}/api/children/${childId}/medical-records/upload`,
          fileFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        reportPath = uploadResponse.data.data.medicalReportFile;
      }
      
      // Map form data to database columns
      const recordData = {
        note_type: noteType,
        medical_condition: formData.medicalCondition,
        vaccination_status: formData.vaccinationStatus,
        last_medical_checkup: formData.lastCheckup,
        allergies: formData.allergies,
        medications: formData.medications,
        doctor_name: formData.doctorName,
        hospital_name: formData.hospitalName,
        medical_report_file: reportPath,
        
        // Home Health Care Note Fields
        age_years: formData.ageYears || null,
        height_cm: formData.heightCm || null,
        weight_kg: formData.weightKg || null,
        head_circumference_cm: formData.headCircumferenceCm || null,
        weight_for_age_percentile: formData.weightForAgePercentile || null,
        weight_for_height_percentile: formData.weightForHeightPercentile || null,
        height_for_age_percentile: formData.heightForAgePercentile || null,
        temperature_celsius: formData.temperatureCelsius || null,
        respiration_rate: formData.respirationRate || null,
        pulse_rate: formData.pulseRate || null,
        spo2_percentage: formData.spo2Percentage || null,
        other_vitals: formData.otherVitals || null,
        present_illness: formData.presentIllness || null,
        treatment_plan: formData.treatmentPlan || null,
        
        // Ongoing Health Note Fields
        performer_first_name: formData.performerFirstName || null,
        performer_middle_name: formData.performerMiddleName || null,
        performer_last_name: formData.performerLastName || null,
        medical_center_name: formData.medicalCenterName || null,
        doctor_specialty: formData.doctorSpecialty || null,
        diagnosis: formData.diagnosis || null,
        visit_reason: formData.visitReason || null,
        visit_details: formData.visitDetails || null,
        next_appointment_date: formData.nextAppointmentDate || null
      };
      
      await addMedicalRecord(childId, recordData);
      
      alert('Medical record added successfully');
      setShowAddForm(false);
      loadDocuments();
      resetForm();
    } catch (err) {
      alert('Failed to add medical record: ' + (err.response?.data?.message || err.message));
      console.error('Error adding medical record:', err);
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({
      medicalCondition: '',
      vaccinationStatus: '',
      lastCheckup: '',
      allergies: '',
      medications: '',
      doctorName: '',
      hospitalName: '',
      medicalReportFile: '',
      ageYears: '',
      heightCm: '',
      weightKg: '',
      headCircumferenceCm: '',
      weightForAgePercentile: '',
      weightForHeightPercentile: '',
      heightForAgePercentile: '',
      temperatureCelsius: '',
      respirationRate: '',
      pulseRate: '',
      spo2Percentage: '',
      otherVitals: '',
      presentIllness: '',
      treatmentPlan: '',
      performerFirstName: '',
      performerMiddleName: '',
      performerLastName: '',
      medicalCenterName: '',
      doctorSpecialty: '',
      diagnosis: '',
      visitReason: '',
      visitDetails: '',
      nextAppointmentDate: ''
    });
    setMedicalFile(null);
    setNoteType('ongoing_health');
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const exportToExcel = () => {
    const dataToExport = records.map(rec => ({
      'Date': rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '-',
      'Record Type': rec.note_type === 'home_health_care' ? 'Home Health Care' : 'Ongoing Health',
      'Doctor/Clinic': rec.doctor_name || rec.medical_center_name || '-',
      'ID': rec.id
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Medical Records');
    
    const fileName = `Medical_Records_${childId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportMedicalRecordsPDF = async () => {
    try {
      // Get child details
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
        { field: 'Date of Admission', value: child.date_of_admission ? new Date(child.date_of_admission).toLocaleDateString() : '-' },
        { field: '', value: '' }, // Spacer
        { field: 'Total Medical Records', value: records.length.toString() },
        { field: '', value: '' }, // Spacer
      ];
      
      // Add summary of each record
      records.forEach((rec, index) => {
        formattedData.push({
          field: `Record ${index + 1} - Type`,
          value: rec.note_type === 'home_health_care' ? 'Home Health Care' : 'Ongoing Health'
        });
        formattedData.push({
          field: `  Created Date`,
          value: rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '-'
        });
        
        if (rec.note_type === 'home_health_care') {
          formattedData.push({ field: `  Age`, value: rec.age_years ? `${rec.age_years} years` : '-' });
          formattedData.push({ field: `  Height`, value: rec.height_cm ? `${rec.height_cm} cm` : '-' });
          formattedData.push({ field: `  Weight`, value: rec.weight_kg ? `${rec.weight_kg} kg` : '-' });
          formattedData.push({ field: `  Temperature`, value: rec.temperature_celsius ? `${rec.temperature_celsius}°C` : '-' });
          formattedData.push({ field: `  Pulse Rate`, value: rec.pulse_rate ? `${rec.pulse_rate}/min` : '-' });
          formattedData.push({ field: `  Present Illness`, value: rec.present_illness || '-' });
          formattedData.push({ field: `  Treatment Plan`, value: rec.treatment_plan || '-' });
        } else {
          const performerName = [rec.performer_first_name, rec.performer_middle_name, rec.performer_last_name]
            .filter(Boolean).join(' ') || '-';
          formattedData.push({ field: `  Performer`, value: performerName });
          formattedData.push({ field: `  Medical Center`, value: rec.medical_center_name || '-' });
          formattedData.push({ field: `  Doctor Specialty`, value: rec.doctor_specialty || '-' });
          formattedData.push({ field: `  Diagnosis`, value: rec.diagnosis || '-' });
          formattedData.push({ field: `  Visit Reason`, value: rec.visit_reason || '-' });
          formattedData.push({ field: `  Next Appointment`, value: rec.next_appointment_date ? new Date(rec.next_appointment_date).toLocaleDateString() : '-' });
        }
        
        formattedData.push({ field: '', value: '' }); // Spacer between records
      });
      
      ExportUtils.exportToPDF(
        `Medical Records - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Medical_Records_${child.first_name}_${child.last_name}`
      );
    } catch (error) {
      console.error('Error exporting medical records PDF:', error);
      alert('Failed to export medical records. Please try again.');
    }
  };

  const exportSingleRecordPDF = async (record) => {
    try {
      // Get child details
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
        { field: '  Age', value: child.estimated_age || '-' },
        { field: '', value: '' }, // Spacer
        { field: 'Record Information', value: '' },
        { field: '  Record Type', value: record.note_type === 'home_health_care' ? 'Home Health Care Note' : 'Ongoing Health Note' },
        { field: '  Created Date', value: record.created_at ? new Date(record.created_at).toLocaleString() : '-' },
      ];
      
      // Add note-type specific fields based on actual form data
      if (record.note_type === 'home_health_care') {
        formattedData.push({ field: '', value: '' });
        formattedData.push({ field: 'Home Health Care Details', value: '' });
        if (record.age_years) formattedData.push({ field: '  Age', value: `${record.age_years} years` });
        if (record.height_cm) formattedData.push({ field: '  Height', value: `${record.height_cm} cm` });
        if (record.weight_kg) formattedData.push({ field: '  Weight', value: `${record.weight_kg} kg` });
        if (record.head_circumference_cm) formattedData.push({ field: '  Head Circumference', value: `${record.head_circumference_cm} cm` });
        if (record.weight_for_age_percentile) formattedData.push({ field: '  Weight for Age', value: record.weight_for_age_percentile });
        if (record.weight_for_height_percentile) formattedData.push({ field: '  Weight for Height', value: record.weight_for_height_percentile });
        if (record.height_for_age_percentile) formattedData.push({ field: '  Height for Age', value: record.height_for_age_percentile });
        if (record.temperature_celsius) formattedData.push({ field: '  Temperature', value: `${record.temperature_celsius}°C` });
        if (record.respiration_rate) formattedData.push({ field: '  Respiration Rate', value: `${record.respiration_rate}/min` });
        if (record.pulse_rate) formattedData.push({ field: '  Pulse Rate', value: `${record.pulse_rate}/min` });
        if (record.spo2_percentage) formattedData.push({ field: '  SpO2', value: `${record.spo2_percentage}%` });
        if (record.other_vitals) formattedData.push({ field: '  Other Vitals', value: record.other_vitals });
        if (record.present_illness) formattedData.push({ field: '  Present Illness', value: record.present_illness });
        if (record.treatment_plan) formattedData.push({ field: '  Treatment Plan', value: record.treatment_plan });
      } else {
        formattedData.push({ field: '', value: '' });
        formattedData.push({ field: 'Ongoing Health Note Details', value: '' });
        const performerName = [record.performer_first_name, record.performer_middle_name, record.performer_last_name]
          .filter(Boolean).join(' ') || '-';
        formattedData.push({ field: '  Performer Name', value: performerName });
        if (record.medical_center_name) formattedData.push({ field: '  Medical Center', value: record.medical_center_name });
        if (record.doctor_specialty) formattedData.push({ field: '  Doctor Specialty', value: record.doctor_specialty });
        if (record.diagnosis) formattedData.push({ field: '  Diagnosis', value: record.diagnosis });
        if (record.visit_reason) formattedData.push({ field: '  Visit Reason', value: record.visit_reason });
        if (record.visit_details) formattedData.push({ field: '  Visit Details', value: record.visit_details });
        if (record.next_appointment_date) formattedData.push({ field: '  Next Appointment', value: new Date(record.next_appointment_date).toLocaleDateString() });
      }
      
      // Add file attachment info
      if (record.medical_report_file) {
        formattedData.push({ field: '', value: '' });
        formattedData.push({ field: 'Attachments', value: '' });
        formattedData.push({ field: '  Medical Report', value: record.medical_report_file });
      }
      
      ExportUtils.exportToPDF(
        `${record.note_type === 'home_health_care' ? 'Home Health Care' : 'Ongoing Health'} - ${child.first_name} ${child.last_name}`,
        columns,
        formattedData,
        `Medical_Record_${record.note_type === 'home_health_care' ? 'Home' : 'Ongoing'}_${child.first_name}_${new Date().toISOString().split('T')[0]}`
      );
    } catch (error) {
      console.error('Error exporting single medical record PDF:', error);
      alert('Failed to export medical record. Please try again.');
    }
  };

  if (loading) return <div className="tab-panel"><div className="loading-container"><div className="spinner"></div><p>Loading records...</p></div></div>;

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h3>Medical Records</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {records.length > 0 && (
            <button onClick={exportToExcel} className="btn-secondary" title="Export to Excel">
              <i className='bx bxs-file-excel'></i> Export Excel
            </button>
          )}
          {user?.permissions?.includes('medical_manage') && (
            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
              <i className='bx bx-plus'></i> Add Record
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4>Add Medical Record</h4>
              <button onClick={() => setShowAddForm(false)} className="btn-close"><i className='bx bx-x'></i></button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Note Type Selection */}
              <div className="form-group">
                <label>Note Type *</label>
                <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="noteType"
                      value="home_health_care"
                      checked={noteType === 'home_health_care'}
                      onChange={(e) => handleNoteTypeChange(e.target.value)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Home Health Care Note
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="noteType"
                      value="ongoing_health"
                      checked={noteType === 'ongoing_health'}
                      onChange={(e) => handleNoteTypeChange(e.target.value)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Ongoing Health Note
                  </label>
                </div>
              </div>

              {/* Home Health Care Note Fields */}
              {noteType === 'home_health_care' && (
                <>
                  <h4 style={{ margin: '20px 0 10px', color: 'var(--primary-color)', borderBottom: '2px solid var(--primary-color)', paddingBottom: '5px' }}>
                    Home Health Care Note
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Age (years)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="ageYears"
                        value={formData.ageYears}
                        onChange={handleChange}
                        placeholder="e.g., 8.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Height (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="heightCm"
                        value={formData.heightCm}
                        onChange={handleChange}
                        placeholder="e.g., 125.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="weightKg"
                        value={formData.weightKg}
                        onChange={handleChange}
                        placeholder="e.g., 30.2"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Head Circumference (cm)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="headCircumferenceCm"
                        value={formData.headCircumferenceCm}
                        onChange={handleChange}
                        placeholder="e.g., 52.0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="temperatureCelsius"
                        value={formData.temperatureCelsius}
                        onChange={handleChange}
                        placeholder="e.g., 37.5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Respiration Rate (/min)</label>
                      <input
                        type="number"
                        name="respirationRate"
                        value={formData.respirationRate}
                        onChange={handleChange}
                        placeholder="e.g., 20"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Pulse Rate (/min)</label>
                      <input
                        type="number"
                        name="pulseRate"
                        value={formData.pulseRate}
                        onChange={handleChange}
                        placeholder="e.g., 80"
                      />
                    </div>
                    <div className="form-group">
                      <label>SpO2 (%)</label>
                      <input
                        type="number"
                        name="spo2Percentage"
                        value={formData.spo2Percentage}
                        onChange={handleChange}
                        placeholder="e.g., 98"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="form-group">
                      <label>Other Vitals</label>
                      <input
                        type="text"
                        name="otherVitals"
                        value={formData.otherVitals}
                        onChange={handleChange}
                        placeholder="Additional observations"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Weight for Age Percentile</label>
                      <input
                        type="text"
                        name="weightForAgePercentile"
                        value={formData.weightForAgePercentile}
                        onChange={handleChange}
                        placeholder="e.g., 75th"
                      />
                    </div>
                    <div className="form-group">
                      <label>Weight for Height Percentile</label>
                      <input
                        type="text"
                        name="weightForHeightPercentile"
                        value={formData.weightForHeightPercentile}
                        onChange={handleChange}
                        placeholder="e.g., 60th"
                      />
                    </div>
                    <div className="form-group">
                      <label>Height for Age Percentile</label>
                      <input
                        type="text"
                        name="heightForAgePercentile"
                        value={formData.heightForAgePercentile}
                        onChange={handleChange}
                        placeholder="e.g., 80th"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Present Illness</label>
                    <textarea
                      name="presentIllness"
                      value={formData.presentIllness}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe present illness..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Treatment Plan</label>
                    <textarea
                      name="treatmentPlan"
                      value={formData.treatmentPlan}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe treatment plan..."
                    />
                  </div>
                </>
              )}

              {/* Ongoing Health Note Fields */}
              {noteType === 'ongoing_health' && (
                <>
                  <h4 style={{ margin: '20px 0 10px', color: 'var(--primary-color)', borderBottom: '2px solid var(--primary-color)', paddingBottom: '5px' }}>
                    Ongoing Health Note
                  </h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Performer's First Name</label>
                      <input
                        type="text"
                        name="performerFirstName"
                        value={formData.performerFirstName}
                        onChange={handleChange}
                        placeholder="First name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Performer's Middle Name</label>
                      <input
                        type="text"
                        name="performerMiddleName"
                        value={formData.performerMiddleName}
                        onChange={handleChange}
                        placeholder="Middle name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Performer's Last Name</label>
                      <input
                        type="text"
                        name="performerLastName"
                        value={formData.performerLastName}
                        onChange={handleChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Name of Medical Center</label>
                      <input
                        type="text"
                        name="medicalCenterName"
                        value={formData.medicalCenterName}
                        onChange={handleChange}
                        placeholder="e.g., General Hospital"
                      />
                    </div>
                    <div className="form-group">
                      <label>Doctor's Name</label>
                      <input
                        type="text"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleChange}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div className="form-group">
                      <label>Doctor's Specialty</label>
                      <input
                        type="text"
                        name="doctorSpecialty"
                        value={formData.doctorSpecialty}
                        onChange={handleChange}
                        placeholder="e.g., Pediatrics"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Diagnosis</label>
                      <input
                        type="text"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                        placeholder="Medical diagnosis"
                      />
                    </div>
                    <div className="form-group">
                      <label>Visit Reason</label>
                      <input
                        type="text"
                        name="visitReason"
                        value={formData.visitReason}
                        onChange={handleChange}
                        placeholder="Reason for visit"
                      />
                    </div>
                    <div className="form-group">
                      <label>Next Appointment Date</label>
                      <input
                        type="date"
                        name="nextAppointmentDate"
                        value={formData.nextAppointmentDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Visit Details</label>
                    <textarea
                      name="visitDetails"
                      value={formData.visitDetails}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Details about the visit..."
                    />
                  </div>
                </>
              )}

              {/* Common Fields - File Upload */}
              <div className="form-group" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e0e0e0' }}>
                <label>Upload Medical Report</label>
                <input
                  type="file"
                  name="medicalReportUpload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
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
        <div className="empty-state"><i className='bx bx-medal'></i><p>No medical records</p></div>
      ) : (
        <div className="table-responsive">
          <table className="medical-records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Record Type</th>
                <th>Doctor/Clinic</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, index) => (
                <tr key={rec.id} onClick={() => handleViewDetails(rec)} style={{ cursor: 'pointer' }}>
                  <td>{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`badge ${rec.note_type === 'home_health_care' ? 'badge-info' : 'badge-success'}`}>
                      {rec.note_type === 'home_health_care' ? 'Home Health' : 'Ongoing Health'}
                    </span>
                  </td>
                  <td>
                    {rec.doctor_name || rec.medical_center_name || '-'}
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
              <h4>Medical Record Details</h4>
              <button onClick={() => setShowModal(false)} className="btn-close">
                <i className='bx bx-x'></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="record-detail-grid">
                <div className="detail-section">
                  <h5>Basic Information</h5>
                  <div className="detail-row">
                    <label>Record Type:</label>
                    <span className={`badge ${selectedRecord.note_type === 'home_health_care' ? 'badge-info' : 'badge-success'}`}>
                      {selectedRecord.note_type === 'home_health_care' ? 'Home Health Care' : 'Ongoing Health'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Date Created:</label>
                    <span>{selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Medical Condition:</label>
                    <span>{selectedRecord.medical_condition || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Vaccination Status:</label>
                    <span>{selectedRecord.vaccination_status || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Last Checkup:</label>
                    <span>{selectedRecord.last_medical_checkup ? new Date(selectedRecord.last_medical_checkup).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                {selectedRecord.note_type === 'home_health_care' && (
                  <div className="detail-section">
                    <h5>Home Health Care Note</h5>
                    <div className="detail-row">
                      <label>Age:</label>
                      <span>{selectedRecord.age_years ? `${selectedRecord.age_years} years` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Height:</label>
                      <span>{selectedRecord.height_cm ? `${selectedRecord.height_cm} cm` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Weight:</label>
                      <span>{selectedRecord.weight_kg ? `${selectedRecord.weight_kg} kg` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Head Circumference:</label>
                      <span>{selectedRecord.head_circumference_cm ? `${selectedRecord.head_circumference_cm} cm` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Temperature:</label>
                      <span>{selectedRecord.temperature_celsius ? `${selectedRecord.temperature_celsius}°C` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Pulse Rate:</label>
                      <span>{selectedRecord.pulse_rate ? `${selectedRecord.pulse_rate}/min` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Respiration:</label>
                      <span>{selectedRecord.respiration_rate ? `${selectedRecord.respiration_rate}/min` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>SpO2:</label>
                      <span>{selectedRecord.spo2_percentage ? `${selectedRecord.spo2_percentage}%` : '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Present Illness:</label>
                      <span>{selectedRecord.present_illness || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Treatment Plan:</label>
                      <span>{selectedRecord.treatment_plan || '-'}</span>
                    </div>
                  </div>
                )}

                {selectedRecord.note_type === 'ongoing_health' && (
                  <div className="detail-section">
                    <h5>Ongoing Health Note</h5>
                    <div className="detail-row">
                      <label>Performer:</label>
                      <span>
                        {[selectedRecord.performer_first_name, selectedRecord.performer_middle_name, selectedRecord.performer_last_name]
                          .filter(Boolean)
                          .join(' ') || '-'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <label>Medical Center:</label>
                      <span>{selectedRecord.medical_center_name || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Doctor:</label>
                      <span>{[selectedRecord.doctor_name, selectedRecord.doctor_specialty].filter(Boolean).join(' - ') || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Diagnosis:</label>
                      <span>{selectedRecord.diagnosis || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Visit Reason:</label>
                      <span>{selectedRecord.visit_reason || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Visit Details:</label>
                      <span>{selectedRecord.visit_details || '-'}</span>
                    </div>
                    <div className="detail-row">
                      <label>Next Appointment:</label>
                      <span>{selectedRecord.next_appointment_date ? new Date(selectedRecord.next_appointment_date).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h5>Additional Information</h5>
                  <div className="detail-row">
                    <label>Allergies:</label>
                    <span>{selectedRecord.allergies || 'None'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Medications:</label>
                    <span>{selectedRecord.medications || 'None'}</span>
                  </div>
                  {selectedRecord.medical_report_file && (
                    <div className="detail-row full-width">
                      <label>Medical Report:</label>
                      <a href={`http://localhost:5000${selectedRecord.medical_report_file}`} target="_blank" rel="noopener noreferrer">
                        <i className='bx bx-link'></i> View Document
                      </a>
                    </div>
                  )}
                </div>
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

export default MedicalTab;
