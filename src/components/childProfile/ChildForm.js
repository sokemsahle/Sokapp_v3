import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createChild, updateChild, getChild } from '../../services/childService';
import { getPrograms } from '../../services/programService';
import resourceService from '../../services/resourceService';
import axios from 'axios';
import './ChildProfile.css';

const ChildForm = ({ user, mode, childId, onBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  // Use childId from props OR from URL params (for direct URL access)
  const effectiveChildId = childId || id;
  const isEditMode = !!effectiveChildId || mode === 'edit';
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    estimatedAge: '',
    ageType: 'actual', // 'actual' for DOB, 'estimated' for estimated age
    placeOfBirth: '',
    nationality: '',
    religion: '',
    bloodGroup: '',
    disabilityStatus: false,
    disabilityDescription: '',
    healthStatus: '',
    dateOfAdmission: new Date().toISOString().split('T')[0],
    admittedBy: user?.id || '',
    currentStatus: 'Active',
    profilePhoto: '',
    program_id: '',
    room_id: '',
    bed_id: ''
  });

  // Handle file selection
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    loadPrograms();
    loadRooms();
    if (isEditMode && effectiveChildId) {
      loadChildData(effectiveChildId);
    }
  }, [effectiveChildId]);

  const loadPrograms = async () => {
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.programs);
      }
    } catch (err) {
      console.error('Error loading programs:', err);
    }
  };

  const loadRooms = async () => {
    try {
      const result = await resourceService.getRooms();
      if (result.success) {
        setRooms(result.data || []);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const loadBeds = async (roomId) => {
    try {
      const result = await resourceService.getBedsByRoom(roomId, 'available');
      if (result.success) {
        setBeds(result.data || []);
      } else {
        setBeds([]);
      }
    } catch (err) {
      console.error('Error loading beds:', err);
      setBeds([]);
    }
  };

  const loadChildData = async (childIdToLoad) => {
    try {
      setLoading(true);
      const result = await getChild(childIdToLoad);
      const child = result.data;
      
      // Helper function to format date to YYYY-MM-DD for date inputs
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return ''; // Invalid date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      setFormData({
        firstName: child.first_name || '',
        middleName: child.middle_name || '',
        lastName: child.last_name || '',
        gender: child.gender || '',
        dateOfBirth: formatDateForInput(child.date_of_birth),
        estimatedAge: child.estimated_age || '',
        ageType: child.date_of_birth ? 'actual' : (child.estimated_age ? 'estimated' : 'actual'),
        placeOfBirth: child.place_of_birth || '',
        nationality: child.nationality || '',
        religion: child.religion || '',
        bloodGroup: child.blood_group || '',
        disabilityStatus: child.disability_status || false,
        disabilityDescription: child.disability_description || '',
        healthStatus: child.health_status || '',
        dateOfAdmission: formatDateForInput(child.date_of_admission),
        admittedBy: child.admitted_by || '',
        currentStatus: child.current_status || 'Active',
        profilePhoto: child.profile_photo || '',
        program_id: child.program_id || '',
        room_id: child.room_id ? child.room_id.toString() : '',
        bed_id: child.bed_id ? child.bed_id.toString() : ''
      });

      // Load beds if room is assigned
      if (child.room_id) {
        await loadBeds(child.room_id);
      }
    } catch (err) {
      alert('Failed to load child data');
      console.error('Error loading child:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      
      // Validate age based on selected type
      if (formData.ageType === 'actual' && !formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
      if (formData.ageType === 'estimated' && !formData.estimatedAge) {
        newErrors.estimatedAge = 'Estimated age is required';
      }
    }
    
    // Validate step 2 before moving to step 3
    if (currentStep === 2) {
      // Optional: Add any step 2 validations here if needed
      // For now, no required fields in step 2
    }
    
    if (currentStep === 3) {
      if (!formData.dateOfAdmission) newErrors.dateOfAdmission = 'Admission date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.log('Current step:', step);
    console.log('Validating step:', step);
    
    if (validateStep(step)) {
      console.log('Validation passed, moving to step:', step + 1);
      setStep(prev => prev + 1);
    } else {
      console.log('Validation failed');
    }
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  // Helper function to calculate age from date of birth
  const calculateAgeFromDOB = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - today.getFullYear();
    const monthDiff = now.getMonth() - today.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < today.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Save button clicked, current step:', step);
    
    // Validate only the current step's required fields
    // This allows saving partial data from any step
    if (!validateStep(step)) {
      console.log('Current step validation failed');
      return;
    }
    
    // If on step 3, also validate all previous steps for completeness
    if (step === 3) {
      // Validate step 1
      const step1Valid = validateStep(1);
      // Validate step 2 (no required fields currently)
      const step2Valid = validateStep(2);
      // Validate step 3
      const step3Valid = validateStep(3);
      
      if (!step1Valid || !step2Valid || !step3Valid) {
        console.log('Full form validation failed');
        return;
      }
    }

    try {
      setLoading(true);
      
      let childId;
      
      if (isEditMode) {
        await updateChild(effectiveChildId, formData);
        alert('Child profile updated successfully');
        childId = effectiveChildId;
      } else {
        const result = await createChild(formData);
        alert('Child profile created successfully');
        childId = result.data.id;
      }
      
      // Upload photo if selected
      if (photoFile && childId) {
        const photoFormData = new FormData();
        photoFormData.append('profilePhoto', photoFile);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        await axios.post(`${apiUrl}/api/children/${childId}/upload-photo`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      if (onBack) {
        onBack();
      } else if (isEditMode) {
        navigate(`/admin/children/${childId}`);
      } else {
        navigate(`/admin/children/${childId}`);
      }
    } catch (err) {
      alert(isEditMode ? 'Failed to update child profile' : 'Failed to create child profile');
      console.error('Error saving child:', err);
    } finally {
      setLoading(false);
    }
  };

  const canCreateChild = user?.permissions?.includes('child_create');
  const canUpdateChild = user?.permissions?.includes('child_update');

  if ((isEditMode && !canUpdateChild) || (!isEditMode && !canCreateChild)) {
    return (
      <div className="child-form">
        <div className="error-message">
          <i className='bx bx-lock'></i>
          <p>You do not have permission to {isEditMode ? 'edit' : 'create'} child profiles</p>
        </div>
      </div>
    );
  }

  if (loading && isEditMode) {
    return (
      <div className="child-form">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading child data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="child-form">
      <div className="form-header">
        <button onClick={() => onBack ? onBack() : navigate(isEditMode ? `/admin/children/${effectiveChildId}` : '/admin/children')} className="btn-back">
          <i className='bx bx-arrow-back'></i>
        </button>
        <h1>{isEditMode ? 'Edit Child Profile' : 'Add New Child'}</h1>
      </div>

      <div className="progress-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Basic Info</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Additional Info</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Admission</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tier1-form" noValidate>
        {step === 1 && (
          <div className="form-step">
            <h2>Basic Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <span className="error-text">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <span className="error-text">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="error-text">{errors.gender}</span>}
              </div>

              <div className="form-group full-width">
                <label>Age Type *</label>
                <div className="radio-group" style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ageType"
                      value="actual"
                      checked={formData.ageType === 'actual'}
                      onChange={handleChange}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Actual Age (Date of Birth)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="ageType"
                      value="estimated"
                      checked={formData.ageType === 'estimated'}
                      onChange={handleChange}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Estimated Age</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-row">
              {formData.ageType === 'actual' && (
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={errors.dateOfBirth ? 'error' : ''}
                  />
                  {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                  {formData.dateOfBirth && calculateAgeFromDOB(formData.dateOfBirth) !== null && (
                    <small style={{ color: 'var(--primary)', fontWeight: '600', marginTop: '5px', display: 'block' }}>
                      Calculated Age: {calculateAgeFromDOB(formData.dateOfBirth)} years old
                    </small>
                  )}
                </div>
              )}

              {formData.ageType === 'estimated' && (
                <div className="form-group">
                  <label>Estimated Age *</label>
                  <input
                    type="number"
                    name="estimatedAge"
                    value={formData.estimatedAge}
                    onChange={handleChange}
                    min="0"
                    max="18"
                    placeholder="Years"
                    className={errors.estimatedAge ? 'error' : ''}
                  />
                  {errors.estimatedAge && <span className="error-text">{errors.estimatedAge}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Additional Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Place of Birth</label>
                <input
                  type="text"
                  name="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Health Status</label>
                <textarea
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any health conditions, allergies, or medical notes..."
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Admission Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Date of Admission *</label>
                <input
                  type="date"
                  name="dateOfAdmission"
                  value={formData.dateOfAdmission}
                  onChange={handleChange}
                  className={errors.dateOfAdmission ? 'error' : ''}
                />
                {errors.dateOfAdmission && <span className="error-text">{errors.dateOfAdmission}</span>}
              </div>

              <div className="form-group">
                <label>Current Status</label>
                <select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Reunified">Reunified</option>
                  <option value="Adopted">Adopted</option>
                  <option value="Deceased">Deceased</option>
                  <option value="Transferred">Transferred</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Program</label>
                <select
                  name="program_id"
                  value={formData.program_id}
                  onChange={handleChange}
                >
                  <option value="">No Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assign Dormitory Room</label>
                <select
                  name="room_id"
                  value={formData.room_id}
                  onChange={(e) => {
                    const roomId = e.target.value;
                    setFormData({ ...formData, room_id: roomId, bed_id: '' });
                    if (roomId) {
                      loadBeds(roomId);
                    } else {
                      setBeds([]);
                    }
                  }}
                >
                  <option value="">No Room Assignment</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.room_name} (Available: {room.available_beds || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assign Bed</label>
                <select
                  name="bed_id"
                  value={formData.bed_id}
                  onChange={handleChange}
                  disabled={!formData.room_id}
                >
                  <option value="">No Bed Assignment</option>
                  {beds.map(bed => (
                    <option key={bed.id} value={bed.id}>
                      {bed.bed_number}
                    </option>
                  ))}
                </select>
                {!formData.room_id && (
                  <small style={{ color: '#999', fontSize: '12px' }}>
                    Please select a room first
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>Profile Photo</label>
                {photoPreview && (
                  <div style={{ marginBottom: '10px' }}>
                    <img src={photoPreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '2px solid var(--primary)' }} />
                  </div>
                )}
                <input
                  type="file"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  placeholder="Upload profile photo"
                />
                <small style={{ display: 'block', marginTop: '5px', color: 'var(--dark-gray)' }}>
                  Accepted formats: JPEG, PNG, WebP. Max size: 5MB
                </small>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button type="button" onClick={handlePrevious} className="btn-secondary">
              <i className='bx bx-arrow-back'></i> Previous
            </button>
          )}
          
          {/* Always show Save button - allows saving at any step */}
          <button type="submit" className="btn-success" disabled={loading}>
            {loading ? 'Saving...' : (isEditMode ? 'Update Child' : 'Create Child')}
          </button>
          
          {/* Show Next button only on steps 1 and 2 */}
          {step < 3 && (
            <button type="button" onClick={handleNext} className="btn-primary">
              Next <i className='bx bx-arrow-forward'></i>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChildForm;
