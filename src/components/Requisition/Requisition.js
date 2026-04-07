import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import './Requisition.css';
import { getPrograms } from '../../services/programService';

const Requisition = ({ isOpen, mode = 'create', requisitionId, onBack, currentUser, userRoles: parentUserRoles }) => {
  // --- 1. State Definitions ---
  const [formData, setFormData] = useState({
    requestor: '',
    date: new Date().toISOString().substr(0, 10),
    department: '',
    description: '', // This maps to "General purpose"
    requestedBy: '',
    reviewedBy: '',
    approvedBy: '',
    authorizedBy: '',
    program_id: '',
    status: ''
  });

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, price: 0, total: 0 }
  ]);

  const sigPad = useRef({}); // For requestor signature
  const reviewSigPad = useRef({}); // For reviewer signature
  const approveSigPad = useRef({}); // For approver signature
  const authorizeSigPad = useRef({}); // For authorizer signature
  const [signature, setSignature] = useState(null);
  const [approvedSignature, setApprovedSignature] = useState(null);
  const [authorizedSignature, setAuthorizedSignature] = useState(null);
  const [reviewedSignature, setReviewedSignature] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === 'edit'); // Only enable editing in edit mode
  const [rolesLoading, setRolesLoading] = useState(false); // Track if roles are being loaded
  const [programs, setPrograms] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false); // Track if requisition is fully approved
  const [isRejecting, setIsRejecting] = useState(false); // Track if showing rejection modal
  const [rejectionNote, setRejectionNote] = useState(''); // Store rejection note
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false); // Track rejection submission
  const [pendingSignatureType, setPendingSignatureType] = useState(null); // Track which signature needs to be saved
  
  console.log('DEBUG: Requisition component rendered with:', { mode, requisitionId, isOpen, currentUser });
  
  // User role permissions for requisition workflow
  const [userRoles, setUserRoles] = useState({
    isReviewer: false,
    isApprover: false,
    isAuthorizer: false,
    isFinance: false
  });
  
  // Load user roles when component mounts or currentUser changes (only if not provided by parent)
  useEffect(() => {
    loadPrograms();
    if (currentUser?.email && !parentUserRoles) {
      fetchUserRoles();
    } else if (parentUserRoles) {
      // Use roles from parent component
      setUserRoles(parentUserRoles);
      setRolesLoading(false);
      console.log('DEBUG: Using userRoles from parent:', parentUserRoles);
    }
  }, [currentUser, parentUserRoles]);
  
  // Fetch requisition data when in edit or view mode
  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && requisitionId) {
      console.log('DEBUG: Edit/View mode detected, fetching requisition data for ID:', requisitionId);
      console.log('DEBUG: Current user:', currentUser);
      console.log('DEBUG: User is admin:', currentUser?.is_admin);
      fetchRequisitionData(requisitionId);
    }
  }, [mode, requisitionId]);
  
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
  
  const fetchUserRoles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/requisition-roles?email=${encodeURIComponent(currentUser.email)}`);
      const result = await response.json();
        
      if (result.success) {
        setUserRoles({
          isReviewer: result.roles.includes('reviewer'),
          isApprover: result.roles.includes('approver'),
          isAuthorizer: result.roles.includes('authorizer'),
          isFinance: result.roles.includes('finance')
        });
        console.log('User roles loaded:', result.roles);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setRolesLoading(false); // Always set loading to false after fetch completes
    }
  };
    
  const fetchRequisitionData = async (id) => {
    try {
      setLoading(true);
      
      console.log('DEBUG: Fetching requisition data for ID:', id);
      console.log('DEBUG: Current user email:', currentUser?.email);
      console.log('DEBUG: Current user ID:', currentUser?.id);
      console.log('DEBUG: User roles:', userRoles);
      console.log('DEBUG: User is admin:', currentUser?.is_admin);
      
      // Fetch requisition data with user email and ID for access validation
      console.log('DEBUG: Fetching requisition data...');
      const apiUrl = currentUser?.email 
        ? `http://localhost:5000/api/requisition/${id}?email=${encodeURIComponent(currentUser.email)}&userId=${encodeURIComponent(currentUser.id || '')}`
        : `http://localhost:5000/api/requisition/${id}`;
      console.log('DEBUG: API URL:', apiUrl);
      const response = await fetch(apiUrl);
      
      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Backend may not be running on port 5000.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('DEBUG: Response received:', result);
      console.log('DEBUG: Requisition data loaded for ID:', id);
      console.log('DEBUG: Current user:', currentUser?.email);
      
      if (result.success) {
        const data = result.data;
        
        console.log('DEBUG: Requisition data loaded successfully:', data);
        console.log('DEBUG: Setting form data with requestor:', data.requestor_name);
        
        // No access check needed - ViewRequisitionPage already handled it
        // Just load the data
        
        setFormData({
          requestor: data.requestor_name || '',
          date: data.request_date ? data.request_date.substr(0, 10) : new Date().toISOString().substr(0, 10),
          department: data.department || '',
          description: data.purpose || '',
          requestedBy: data.requested_by || '',
          reviewedBy: data.reviewed_by || '',
          approvedBy: data.approved_by || '',
          authorizedBy: data.authorized_by || '',
          program_id: data.program_id || '',
          status: data.status || '',
          rejection_note: data.rejection_note || '',
          rejected_by: data.rejected_by || '',
          rejected_at: data.rejected_at || ''
        });
        
        if (data.signature_data) {
          setSignature(data.signature_data);
        }
        if (data.approved_signature) {
          setApprovedSignature(data.approved_signature);
        }
        if (data.authorized_signature) {
          setAuthorizedSignature(data.authorized_signature);
        }
        
        if (data.reviewed_signature) {
          setReviewedSignature(data.reviewed_signature);
        }
        
        // Check if requisition is completed (fully approved)
        const isRequisitionCompleted = !!data.authorized_signature || data.status === 'authorized';
        setIsCompleted(isRequisitionCompleted);
        console.log('DEBUG: Requisition completed status:', isRequisitionCompleted, 'authorized_signature:', !!data.authorized_signature, 'status:', data.status);
        
        // Store rejection details if rejected
        if (data.status === 'rejected') {
          console.log('Requisition was rejected:', {
            note: data.rejection_note,
            by: data.rejected_by,
            at: data.rejected_at
          });
        }
        
        if (data.items && data.items.length > 0) {
          setItems(data.items.map((item, index) => ({
            id: index + 1,
            description: item.description || '',
            quantity: parseFloat(item.quantity) || 1,
            price: parseFloat(item.unit_price) || 0,
            total: parseFloat(item.total_price) || 0
          })));
        }
        
        if (data.signature_data) {
          setSignature(data.signature_data);
        }
      } else {
        alert('Failed to load requisition data');
      }
    } catch (error) {
      console.error('Error fetching requisition:', error);
      // Provide more specific error message
      if (error.message.includes('HTML')) {
        alert('Cannot connect to backend API. Please ensure:\n1. Backend server is running on port 5000\n2. Check browser console for details');
      } else {
        alert('Failed to connect to server: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Helper Functions ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (id, field, value) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate total
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.price || 0);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: items.length + 1, description: '', quantity: 1, price: 0, total: 0 }
    ]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // --- 3. Signature Functions ---
  
  // Helper function to get pen color based on theme
  const getPenColor = () => {
    if (typeof window !== 'undefined' && document.body.classList.contains('dark')) {
      return '#ffffff';
    }
    return '#000000';
  };
  
  // Helper function to get canvas background color
  const getCanvasBgColor = () => {
    if (typeof window !== 'undefined' && document.body.classList.contains('dark')) {
      return '#1a1a1a';
    }
    return '#ffffff';
  };
  
  // Canvas configuration for accurate drawing
  const getCanvasProps = (signatureType) => ({
    className: 'sigCanvas',
    style: { 
      backgroundColor: getCanvasBgColor(),
      width: '100%',
      height: '150px'
    },
    width: 400,
    height: 150
  });
  
  const clearSignature = (signatureType) => {
    // Determine which pad to use based on signature type
    let padToUse = sigPad;
    if (signatureType === 'reviewed') {
      padToUse = reviewSigPad;
    } else if (signatureType === 'approved') {
      padToUse = approveSigPad;
    } else if (signatureType === 'authorized') {
      padToUse = authorizeSigPad;
    }
      
    padToUse.current.clear();
      
    if (signatureType === 'approved') {
      setApprovedSignature(null);
    } else if (signatureType === 'authorized') {
      setAuthorizedSignature(null);
    } else if (signatureType === 'reviewed') {
      setReviewedSignature(null);
    } else {
      setSignature(null);
    }
  };
    
  const saveSignature = (signatureType) => {
    console.log('=== saveSignature called ===');
    console.log('signatureType:', signatureType);
    
    // Determine which pad to use based on signature type
    let padToUse = sigPad;
    if (signatureType === 'reviewed') {
      padToUse = reviewSigPad;
    } else if (signatureType === 'approved') {
      padToUse = approveSigPad;
    } else if (signatureType === 'authorized') {
      padToUse = authorizeSigPad;
    }
    
    console.log('padToUse ref:', padToUse);
    console.log('padToUse.current:', padToUse.current);
      
    if (padToUse.current && !padToUse.current.isEmpty()) {
      console.log('✓ Canvas is NOT empty, proceeding...');
      // FIX: Replace getTrimmedCanvas() with getCanvas() 
      // This avoids the "trim_canvas is not a function" error
      const canvas = padToUse.current.getCanvas();
      const dataURL = canvas.toDataURL('image/png');
      
      console.log('✓ Generated dataURL, length:', dataURL ? dataURL.length : 0);
        
      if (signatureType === 'approved') {
        console.log('Setting approvedSignature with length:', dataURL.length);
        setApprovedSignature(dataURL);
        // Force a log right after setting
        setTimeout(() => {
          console.log('>>> IMMEDIATE CHECK after setApprovedSignature:', dataURL ? dataURL.substring(0, 50) + '...' : 'NULL');
        }, 0);
      } else if (signatureType === 'authorized') {
        console.log('Setting authorizedSignature...');
        setAuthorizedSignature(dataURL);
      } else if (signatureType === 'reviewed') {
        console.log('Setting reviewedSignature...');
        setReviewedSignature(dataURL);
      } else {
        console.log('Setting requestor signature...');
        setSignature(dataURL);
      }
        
      setIsSigning(false);
      
      // Track which signature type was just added for the "Save Signature" button
      setPendingSignatureType(signatureType);
      console.log('Set pendingSignatureType to:', signatureType);
      console.log('Current state values will update on next render...');
      
      // Auto-save in view mode - PASS THE SIGNATURE DATA DIRECTLY TO AVOID TIMING ISSUES
      if (mode === 'view' && requisitionId) {
        console.log('Auto-saving in view mode with signature data...');
        handleSignatureSubmitWithDirectData(signatureType, dataURL);
      }
    } else {
      console.error('✗ Canvas is EMPTY or padToUse.current is null!');
      console.error('padToUse.current:', padToUse.current);
      if (padToUse.current) {
        console.error('Canvas isEmpty():', padToUse.current.isEmpty());
      }
      alert("Please provide a signature first.");
    }
  };
  
  // --- 4. Save Signature Changes in View Mode ---
  const handleSignatureSubmit = async (signatureType) => {
    if (!requisitionId) {
      alert('Cannot save - requisition ID not available');
      return;
    }
    
    // If no signatureType provided, use the pending one from state
    const typeToSave = signatureType || pendingSignatureType;
    
    console.log('=== handleSignatureSubmit START ===');
    console.log('Arguments signatureType:', signatureType);
    console.log('State pendingSignatureType:', pendingSignatureType);
    console.log('Computed typeToSave:', typeToSave);
    
    if (!typeToSave) {
      alert('No signature to save. Please add a signature first.');
      return;
    }
    
    try {
      console.log('DEBUG: Checking signature states...');
      console.log('typeToSave:', typeToSave);
      console.log('reviewedSignature length:', reviewedSignature ? reviewedSignature.length : 'NULL');
      console.log('approvedSignature length:', approvedSignature ? approvedSignature.length : 'NULL');
      console.log('authorizedSignature length:', authorizedSignature ? authorizedSignature.length : 'NULL');
      console.log('formData.reviewedBy:', formData.reviewedBy);
      console.log('formData.approvedBy:', formData.approvedBy);
      console.log('formData.authorizedBy:', formData.authorizedBy);
      
      // Build payload with ONLY the signature that was just added
      const payload = {};
      
      if (typeToSave === 'reviewed') {
        console.log('Checking reviewed signature...');
        if (reviewedSignature) {
          payload.reviewed_signature = reviewedSignature;
          payload.reviewed_by = formData.reviewedBy || null;
          console.log('✓ Added reviewed_signature to payload, length:', reviewedSignature.length);
        } else {
          console.log('✗ reviewedSignature is NULL/undefined');
        }
      } else if (typeToSave === 'approved') {
        console.log('Checking approved signature...');
        if (approvedSignature) {
          payload.approved_signature = approvedSignature;
          payload.approved_by = formData.approvedBy || null;
          console.log('✓ Added approved_signature to payload, length:', approvedSignature.length);
        } else {
          console.log('✗ approvedSignature is NULL/undefined');
        }
      } else if (typeToSave === 'authorized') {
        console.log('Checking authorized signature...');
        if (authorizedSignature) {
          payload.authorized_signature = authorizedSignature;
          payload.authorized_by = formData.authorizedBy || null;
          console.log('✓ Added authorized_signature to payload, length:', authorizedSignature.length);
        } else {
          console.log('✗ authorizedSignature is NULL/undefined');
        }
      }
      
      console.log('Final payload keys:', Object.keys(payload));
      
      // Check if we have anything to send
      if (Object.keys(payload).length === 0) {
        console.error('ERROR: Payload is empty!');
        console.error('Type to save:', typeToSave);
        console.error('All signature states:', { reviewedSignature: !!reviewedSignature, approvedSignature: !!approvedSignature, authorizedSignature: !!authorizedSignature });
        alert('No signature to save. Type: ' + typeToSave + '. Check browser console for details.');
        return;
      }
      
      console.log('=== SAVING SIGNATURE CHANGES ===');
      console.log('Signature type to save:', typeToSave);
      console.log('Pending signature type from state:', pendingSignatureType);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`http://localhost:5000/api/requisition/${requisitionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      console.log('Response:', result);
      
      if (result.success) {
        alert('Signature saved successfully!');
        // Clear the pending signature type
        setPendingSignatureType(null);
        // Refresh the requisition data
        if (onBack) {
          onBack();
        }
      } else {
        alert('Failed to save signature: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving signatures:', error);
      alert('Error saving signature: ' + error.message);
    }
  };
  
  // New function to handle signature submission with direct data (avoids React async state timing issues)
  const handleSignatureSubmitWithDirectData = async (signatureType, signatureData) => {
    if (!requisitionId) {
      alert('Cannot save - requisition ID not available');
      return;
    }
    
    console.log('=== handleSignatureSubmitWithDirectData START ===');
    console.log('signatureType:', signatureType);
    console.log('signatureData length:', signatureData ? signatureData.length : 'NULL');
    
    if (!signatureType || !signatureData) {
      alert('No signature to save. Please add a signature first.');
      return;
    }
    
    try {
      console.log('Building payload with direct signature data...');
      
      // Build payload with the direct signature data passed as parameter
      const payload = {};
      
      if (signatureType === 'reviewed') {
        payload.reviewed_signature = signatureData;
        payload.reviewed_by = formData.reviewedBy || null;
        console.log('✓ Added reviewed_signature to payload, length:', signatureData.length);
      } else if (signatureType === 'approved') {
        payload.approved_signature = signatureData;
        payload.approved_by = formData.approvedBy || null;
        console.log('✓ Added approved_signature to payload, length:', signatureData.length);
      } else if (signatureType === 'authorized') {
        payload.authorized_signature = signatureData;
        payload.authorized_by = formData.authorizedBy || null;
        console.log('✓ Added authorized_signature to payload, length:', signatureData.length);
      }
      
      console.log('Final payload keys:', Object.keys(payload));
      
      // Check if we have anything to send
      if (Object.keys(payload).length === 0) {
        console.error('ERROR: Payload is empty!');
        alert('No signature to save. Type: ' + signatureType);
        return;
      }
      
      console.log('=== SAVING SIGNATURE WITH DIRECT DATA ===');
      console.log('Signature type:', signatureType);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(`http://localhost:5000/api/requisition/${requisitionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      console.log('Response:', result);
      
      if (result.success) {
        alert('Signature saved successfully!');
        // Clear the pending signature type
        setPendingSignatureType(null);
        // Refresh the requisition data
        if (onBack) {
          onBack();
        }
      } else {
        alert('Failed to save signature: ' + result.message);
      }
    } catch (error) {
      console.error('Error saving signature with direct data:', error);
      alert('Error saving signature: ' + error.message);
    }
  };
  
  // --- 5. Backend Submission Function ---
  const handleSubmit = async () => {
    // Basic Validation
    if (!formData.requestor || !formData.department) {
      alert("Please fill in Requestor Name and Department.");
      return;
    }
    if (!formData.requestedBy) {
      alert("Please fill in Requested By field.");
      return;
    }
    if (items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    if (!signature) {
      alert("Please sign as Requestor before submitting.");
      return;
    }

    // Prepare the payload
    const payload = {
      requestor: formData.requestor,
      userEmail: currentUser?.email || '',
      department: formData.department,
      date: formData.date,
      description: formData.description,
      requestedBy: formData.requestedBy,
      reviewedBy: formData.reviewedBy || null,
      approvedBy: formData.approvedBy || null,
      authorizedBy: formData.authorizedBy || null,
      program_id: formData.program_id || null,
      items: items,
      grandTotal: items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0),
      signature: signature,
      approvedSignature: approvedSignature || null,
      authorizedSignature: authorizedSignature || null,
      reviewedSignature: reviewedSignature || null
    };

    try {
      const isEditMode = mode === 'edit' && requisitionId;
      const url = isEditMode 
        ? `http://localhost:5000/api/requisition/${requisitionId}`
        : 'http://localhost:5000/api/requisition';
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('=== SUBMITTING REQUISITION ===');
      console.log('URL:', url);
      console.log('Method:', method);
      console.log('reviewedSignature state:', reviewedSignature ? 'EXISTS (length: ' + reviewedSignature.length + ')' : 'NULL');
      console.log('approvedSignature state:', approvedSignature ? 'EXISTS (length: ' + approvedSignature.length + ')' : 'NULL');
      console.log('authorizedSignature state:', authorizedSignature ? 'EXISTS (length: ' + authorizedSignature.length + ')' : 'NULL');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('User Email:', payload.userEmail);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response Status:', response.status);
      const result = await response.json();
      console.log('Response Data:', result);

      if (result.success) {
        alert(isEditMode 
          ? 'Requisition Updated Successfully!' 
          : 'Requisition Submitted Successfully! ID: ' + result.id);
        
        console.log('✅ Submission successful! Email should be sent to reviewers if configured.');
        
        // Call onBack to navigate back and refresh notification count
        if (onBack) {
          onBack();
        } else {
          // Reset form if not navigating back
          setFormData({
              requestor: '',
              date: new Date().toISOString().substr(0, 10),
              department: '',
              description: '',
              requestedBy: '',
              reviewedBy: '',
              approvedBy: '',
              authorizedBy: '',
              program_id: ''
          });
          setItems([{ id: 1, description: '', quantity: 1, price: 0, total: 0 }]);
          setSignature(null);
          setApprovedSignature(null);
          setAuthorizedSignature(null);
          setReviewedSignature(null);
        }
      } else {
        alert('Error: ' + result.message);
        console.error('❌ Submission failed:', result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error('Full error details:', error.message);
      alert('Failed to connect to server. Ensure backend is running.');
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

  // Function to handle requisition rejection
  const handleRejection = async () => {
    if (!requisitionId) {
      alert('Cannot reject requisition - ID is not available');
      return;
    }
    
    if (!rejectionNote.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setRejectionSubmitting(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/requisition/${requisitionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectionNote: rejectionNote,
          rejectedBy: currentUser?.full_name || currentUser?.email || 'Unknown',
          rejectedByEmail: currentUser?.email || ''
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Requisition rejected successfully. Requester has been notified via email.');
        setIsRejecting(false);
        setRejectionNote('');
        // Refresh the requisition data
        if (onBack) {
          onBack();
        }
      } else {
        alert('Failed to reject requisition: ' + result.message);
      }
    } catch (error) {
      console.error('Error rejecting requisition:', error);
      alert('Error rejecting requisition: ' + error.message);
    } finally {
      setRejectionSubmitting(false);
    }
  };
  
  // Function to send notification email
  const sendNotification = async (reqId, recipientType) => {
    if (!reqId) {
      alert('Cannot send notification - requisition ID not available');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/requisition/${reqId}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientType }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Notification sent successfully: ${result.message}`);
      } else {
        alert(`Failed to send notification: ${result.message}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification: ' + error.message);
    }
  };

  if (!isOpen) return null;

  if (loading || rolesLoading) {
    return (
      <main className="requisition-container">
        <div className="header">
          <h1>{mode === 'edit' ? 'Edit Requisition' : 'New Requisition'}</h1>
        </div>
        <div className="form-card">
          <div className="loading-spinner">
            {rolesLoading ? 'Loading user permissions...' : 'Loading requisition data...'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="requisition-container">
      <div className="header">
        <h1>{mode === 'edit' ? 'Edit Requisition' : mode === 'view' ? 'View Requisition' : 'New Requisition'}</h1>
        <ul className="breadcrumb">
          <li><a href="#" onClick={(e) => { e.preventDefault(); onBack && onBack(); }}>Requisition List</a></li>
          /
          <li><a href="#" className="active">{mode === 'edit' ? 'Edit' : mode === 'view' ? 'View' : 'Create New'}</a></li>
        </ul>
      </div>

      <div className="form-card">
        {/* Rejection Notice Banner */}
        {formData.status === 'rejected' && (
          <div style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '15px 20px',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className='bx bx-x-circle' style={{ fontSize: '24px' }}></i>
              This Requisition Has Been Rejected
            </h3>
            <div style={{ marginLeft: '32px' }}>
              <p style={{ margin: '5px 0' }}>
                <strong>Reason:</strong> {formData.rejection_note || 'No reason provided'}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>Rejected By:</strong> {formData.rejected_by || 'Unknown'}
              </p>
              {formData.rejected_at && (
                <p style={{ margin: '5px 0' }}>
                  <strong>Date:</strong> {new Date(formData.rejected_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
        {/* Header Section */}
        <div className="form-header-grid">
          <div className="input-group">
            <label>General Purpose</label>
            <input 
              type="text" 
              name="requestedBy" 
              value={formData.requestedBy} 
              onChange={handleInputChange} 
              placeholder={mode === 'view' ? "" : "Enter reason for request"}
              disabled={mode === 'view' || isCompleted}
              readOnly={mode === 'view'}
            />
            </div>
          
          <div className="input-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleInputChange} 
              disabled={mode === 'view' || isCompleted}
              readOnly={mode === 'view'}
            />
          </div>
          <div className="input-group">
            <label>Department</label>
            <select name="department" value={formData.department} onChange={handleInputChange} disabled={mode === 'view' || isCompleted}>
              <option value="">Select Department</option>
              <option value="Admin">Administration</option>
              <option value="Program">Program</option>
            </select>
          </div>
          
          {/* Show Program selection only when department is Program */}
          {formData.department === 'Program' && (
            <div className="input-group">
              <label>Program</label>
              <select 
                name="program_id" 
                value={formData.program_id || ''} 
                onChange={mode === 'view' ? undefined : handleInputChange}
                disabled={mode === 'view' || isCompleted}
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
          )}
          
            <div className="input-group">
            <label>Requsted by</label>
            <input 
              type="text" 
              name="requestor" 
              value={formData.requestor} 
              onChange={handleInputChange} 
              placeholder={mode === 'view' ? "" : "Enter your name"}
              disabled={mode === 'view' || isCompleted}
              readOnly={mode === 'view'}
            />
          </div>
          {/* Added Description Field if needed, or map 'General Purpose' to description above */}
           <div className="input-group">
            <label>Description</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              placeholder={mode === 'view' ? "" : "Details about request"}
              disabled={mode === 'view' || isCompleted}
              readOnly={mode === 'view'}
            />
          </div>

          
          
          
        </div>

        {/* Dynamic Items Table */}
        <div className="items-table-container">
          <h3>Items Requested</h3>
          <table className="requisition-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th width="100">Quantity</th>
                <th width="120">Price/Units</th>
                <th width="120">Estimated Price </th>
                <th width="50"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input 
                      type="text" 
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder={mode === 'view' ? "" : "Item name or details"}
                      disabled={mode === 'view' || isCompleted}
                      readOnly={mode === 'view'}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                      disabled={mode === 'view' || isCompleted}
                      readOnly={mode === 'view'}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value))}
                      disabled={mode === 'view' || isCompleted}
                      readOnly={mode === 'view'}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={item.total} 
                      readOnly 
                      className="readonly-input"
                    />
                  </td>
                  <td>
                    {mode === 'view' || isCompleted ? (
                      <span>-</span>
                    ) : (
                      <button 
                        className="btn-delete" 
                        onClick={() => removeItem(item.id)}
                        title="Remove Item"
                      >
                        <i className='bx bx-trash'></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="table-actions">
            {!(mode === 'view' || isCompleted) && (
              <button className="btn-add" onClick={addItem}>
                <i className='bx bx-plus'></i> Add Item
              </button>
            )}
            <div className="grand-total">
              <span>Total:</span>
              <span className="amount">{grandTotal.toFixed(2)} Birr</span>
            </div>
          </div>
        </div>

        {/* Approval Section */}
        <div className="approvals-section">
          <h3>Approvals</h3>
          {!userRoles.isReviewer && !userRoles.isApprover && !userRoles.isAuthorizer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') && (
            <div className="admin-only-notice">
              <i className='bx bx-info-circle'></i>
              <span>Only users with requisition roles (reviewer, approver, authorizer) or administrators can sign.</span>
            </div>
          )}
          <div className="approval-grid">
            
            <div className="approval-box signature-box">
              <label>Requested By:</label>
              
              {mode === 'view' ? (
                signature ? (
                  <div className="signature-preview">
                    <img src={signature} alt="Requestor Signature" />
                  </div>
                ) : isSigning === 'requestor' ? (
                  // Show signature pad when signing as requestor
                  <div className="signature-pad-container">
                    <SignatureCanvas 
                      ref={sigPad}
                      penColor={getPenColor()}
                      canvasProps={getCanvasProps('requestor')}
                    />
                    <div className="sig-controls">
                      <button className="btn-sig-clear" onClick={() => clearSignature('requestor')}>Clear</button>
                      <button className="btn-sig-save" onClick={() => saveSignature('requestor')}>Save</button>
                    </div>
                  </div>
                ) : (
                  // Show sign button for requestor even in view mode
                  currentUser?.email ? (
                    <button 
                      className="btn-sign-trigger"
                      onClick={() => {
                        setIsSigning('requestor');
                      }}
                    >
                      <i className='bx bx-pen'></i> Sign Request
                    </button>
                  ) : (
                    <div className="no-signature">No signature</div>
                  )
                )
              ) : (
                <>
                  {!isSigning && !signature ? (
                    <button className="btn-sign-trigger" onClick={() => setIsSigning('requestor')}>
                      <i className='bx bx-pen'></i> Click to Sign
                    </button>
                  ) : isSigning === 'requestor' ? (
                    <div className="signature-pad-container">
                      <SignatureCanvas 
                        ref={sigPad}
                        penColor={getPenColor()}
                        canvasProps={getCanvasProps('requestor')}
                      />
                      <div className="sig-controls">
                        <button className="btn-sig-clear" onClick={() => clearSignature('requestor')}>Clear</button>
                        <button className="btn-sig-save" onClick={() => saveSignature('requestor')}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="signature-preview">
                      <img src={signature} alt="Requestor Signature" />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="approval-box signature-box">
              <label>Reviewed By:</label>
              <input 
                type="text" 
                value={formData.reviewedBy} 
                onChange={handleInputChange}
                name="reviewedBy"
                placeholder={mode === 'view' ? "" : "Enter reviewer name"}
                disabled={(mode === 'view' && !(userRoles.isReviewer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1'))) || isCompleted}
                readOnly={mode === 'view' && !(userRoles.isReviewer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1'))}
              />
              {mode === 'view' || isCompleted ? (
                reviewedSignature ? (
                  <div className="signature-preview">
                    <img src={reviewedSignature} alt="Reviewed Signature" />
                  </div>
                ) : isSigning === 'reviewed' ? (
                  // Show signature pad when signing
                  <div className="signature-pad-container">
                    <SignatureCanvas 
                      ref={reviewSigPad}
                      penColor={getPenColor()}
                      canvasProps={getCanvasProps('reviewed')}
                    />
                    <div className="sig-controls">
                      <button className="btn-sig-clear" onClick={() => { console.log('Clear clicked for reviewed'); clearSignature('reviewed'); }}>Clear</button>
                      <button className="btn-sig-save" onClick={(e) => { console.log('SAVE BUTTON CLICKED (reviewed)!'); e.preventDefault(); e.stopPropagation(); saveSignature('reviewed'); }}>Save</button>
                    </div>
                  </div>
                ) : (
                  // Show sign button for reviewers even in view mode
                  userRoles.isReviewer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? (
                    <button 
                      className="btn-sign-trigger"
                      onClick={() => {
                        if (formData.reviewedBy) {
                          setIsSigning('reviewed');
                        } else {
                          alert('Please enter the reviewer name first');
                        }
                      }}
                      disabled={!formData.reviewedBy || isCompleted}
                    >
                      <i className='bx bx-pen'></i> Sign Review
                    </button>
                  ) : (
                    <div className="no-signature">No signature</div>
                  )
                )
              ) : (
                <>
                  {isSigning === 'reviewed' ? (
                    // Show signature pad when signing in edit/non-view mode
                    <div className="signature-pad-container">
                      <SignatureCanvas 
                        ref={reviewSigPad}
                        penColor={getPenColor()}
                        canvasProps={getCanvasProps('reviewed')}
                      />
                      <div className="sig-controls">
                        <button className="btn-sig-clear" onClick={() => clearSignature('reviewed')}>Clear</button>
                        <button className="btn-sig-save" onClick={() => saveSignature('reviewed')}>Save</button>
                      </div>
                    </div>
                  ) : !reviewedSignature ? (
                    <button 
                      className={`btn-sign-trigger ${!userRoles.isReviewer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? 'disabled' : ''}`}
                      onClick={() => {
                        // Check if user has reviewer role or is admin
                        const canReview = userRoles.isReviewer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1');
                        if (!canReview) {
                          alert('Only users with reviewer role can sign the review section.');
                          return;
                        }
                        
                        if (formData.reviewedBy) {
                          setIsSigning('reviewed');
                        } else {
                          alert('Please enter the reviewer name first');
                        }
                      }}
                      disabled={!userRoles.isReviewer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') || !formData.reviewedBy || isCompleted}
                    >
                      <i className='bx bx-pen'></i> 
                      {!userRoles.isReviewer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? 'Reviewers Only' : 'Sign Review'}
                    </button>
                  ) : (
                    <div className="signature-preview">
                      <img src={reviewedSignature} alt="Reviewed Signature" />
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="approval-box signature-box">
              <label>Approved By:</label>
              <input 
                type="text" 
                value={formData.approvedBy} 
                onChange={handleInputChange}
                name="approvedBy"
                placeholder={mode === 'view' ? "" : "Enter approver name"}
                disabled={(mode === 'view' && !(userRoles.isApprover || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1'))) || isCompleted}
                readOnly={mode === 'view' && !(userRoles.isApprover || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1'))}
              />
              {mode === 'view' || isCompleted ? (
                approvedSignature ? (
                  <div className="signature-preview">
                    <img src={approvedSignature} alt="Approved Signature" />
                  </div>
                ) : isSigning === 'approved' ? (
                  // Show signature pad when signing
                  <div className="signature-pad-container">
                    <SignatureCanvas 
                      ref={approveSigPad}
                      penColor={getPenColor()}
                      canvasProps={getCanvasProps('approved')}
                    />
                    <div className="sig-controls">
                      <button className="btn-sig-clear" onClick={() => { console.log('Clear clicked for approved'); clearSignature('approved'); }}>Clear</button>
                      <button className="btn-sig-save" onClick={(e) => { console.log('SAVE BUTTON CLICKED!'); e.preventDefault(); e.stopPropagation(); saveSignature('approved'); }}>Save</button>
                    </div>
                  </div>
                ) : (
                  // Show sign button for approvers even in view mode
                  userRoles.isApprover || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? (
                    <button 
                      className="btn-sign-trigger"
                      onClick={() => {
                        if (formData.approvedBy) {
                          setIsSigning('approved');
                        } else {
                          alert('Please enter the approver name first');
                        }
                      }}
                      disabled={!formData.approvedBy || isCompleted}
                    >
                      <i className='bx bx-pen'></i> Sign Approval
                    </button>
                  ) : (
                    <div className="no-signature">No signature</div>
                  )
                )
              ) : (
                <>
                  {isSigning === 'approved' ? (
                    // Show signature pad when signing in edit/non-view mode
                    <div className="signature-pad-container">
                      <SignatureCanvas 
                        ref={approveSigPad}
                        penColor={getPenColor()}
                        canvasProps={getCanvasProps('approved')}
                      />
                      <div className="sig-controls">
                        <button className="btn-sig-clear" onClick={() => clearSignature('approved')}>Clear</button>
                        <button className="btn-sig-save" onClick={() => saveSignature('approved')}>Save</button>
                      </div>
                    </div>
                  ) : !approvedSignature ? (
                    <button 
                      className={`btn-sign-trigger ${!userRoles.isApprover && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? 'disabled' : ''}`}
                      onClick={() => {
                        // Check if user has approver role or is admin
                        const canApprove = userRoles.isApprover || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1');
                        if (!canApprove) {
                          alert('Only users with approver role can sign the approval section.');
                          return;
                        }
                        
                        if (formData.approvedBy) {
                          setIsSigning('approved');
                        } else {
                          alert('Please enter the approver name first');
                        }
                      }}
                      disabled={!userRoles.isApprover && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') || !formData.approvedBy || isCompleted}
                    >
                      <i className='bx bx-pen'></i> 
                      {!userRoles.isApprover && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? 'Approvers Only' : 'Sign Approval'}
                    </button>
                  ) : (
                    <div className="signature-preview">
                      <img src={approvedSignature} alt="Approved Signature" />
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="approval-box signature-box">
              <label>Authorized By:</label>
              <input 
                type="text" 
                value={formData.authorizedBy} 
                onChange={handleInputChange}
                name="authorizedBy"
                placeholder={mode === 'view' ? "" : "Enter authorizer name"}
                disabled={(mode === 'view' && !(userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1'))) || isCompleted}
                readOnly={mode === 'view' && !(userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1'))}
              />
              {mode === 'view' || isCompleted ? (
                authorizedSignature ? (
                  <div className="signature-preview">
                    <img src={authorizedSignature} alt="Authorized Signature" />
                  </div>
                ) : isSigning === 'authorized' ? (
                  // Show signature pad when signing
                  <div className="signature-pad-container">
                    <SignatureCanvas 
                      ref={authorizeSigPad}
                      penColor={getPenColor()}
                      canvasProps={getCanvasProps('authorized')}
                    />
                    <div className="sig-controls">
                      <button className="btn-sig-clear" onClick={() => { console.log('Clear clicked for authorized'); clearSignature('authorized'); }}>Clear</button>
                      <button className="btn-sig-save" onClick={(e) => { console.log('SAVE BUTTON CLICKED (authorized)!'); e.preventDefault(); e.stopPropagation(); saveSignature('authorized'); }}>Save</button>
                    </div>
                  </div>
                ) : (
                  // Show sign button for authorizers even in view mode
                  userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? (
                    <button 
                      className="btn-sign-trigger"
                      onClick={() => {
                        if (formData.authorizedBy) {
                          setIsSigning('authorized');
                        } else {
                          alert('Please enter the authorizer name first');
                        }
                      }}
                      disabled={!formData.authorizedBy || isCompleted}
                    >
                      <i className='bx bx-pen'></i> Sign Authorization
                    </button>
                  ) : (
                    <div className="no-signature">No signature</div>
                  )
                )
              ) : (
                <>
                  {isSigning === 'authorized' ? (
                    // Show signature pad when signing in edit/non-view mode
                    <div className="signature-pad-container">
                      <SignatureCanvas 
                        ref={authorizeSigPad}
                        penColor={getPenColor()}
                        canvasProps={getCanvasProps('authorized')}
                      />
                      <div className="sig-controls">
                        <button className="btn-sig-clear" onClick={() => clearSignature('authorized')}>Clear</button>
                        <button className="btn-sig-save" onClick={() => saveSignature('authorized')}>Save</button>
                      </div>
                    </div>
                  ) : !authorizedSignature ? (
                    <button 
                      className={`btn-sign-trigger ${!userRoles.isAuthorizer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? 'disabled' : ''}`}
                      onClick={() => {
                        // Check if user has authorizer role or is admin
                        const canAuthorize = userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1');
                        if (!canAuthorize) {
                          alert('Only users with authorizer role can sign the authorization section.');
                          return;
                        }
                        
                        if (formData.authorizedBy) {
                          setIsSigning('authorized');
                        } else {
                          alert('Please enter the authorizer name first');
                        }
                      }}
                      disabled={!userRoles.isAuthorizer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') || !formData.authorizedBy || isCompleted}
                    >
                      <i className='bx bx-pen'></i> 
                      {!userRoles.isAuthorizer && !(currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1') ? 'Authorizers Only' : 'Sign Authorization'}
                    </button>
                  ) : (
                    <div className="signature-preview">
                      <img src={authorizedSignature} alt="Authorized Signature" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-footer">
          <button className="btn-secondary" onClick={onBack}>Back to List</button>
          <div className="form-footer-right">
            {isCompleted && (
              <div style={{ marginRight: 'auto', color: '#28a745', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <i className='bx bx-check-circle' style={{ fontSize: '20px', marginRight: '8px' }}></i>
                <span>Approval Completed - No Further Edits Allowed</span>
              </div>
            )}
            
            {/* Show Reject button only for users with requisition roles (not requesters) and not completed */}
            {(userRoles.isReviewer || userRoles.isApprover || userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1')) && !isCompleted && (
              <button 
                className="btn-danger" 
                onClick={() => setIsRejecting(true)}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                <i className='bx bx-x-circle'></i> Reject Requisition
              </button>
            )}
            
            {/* Show Update button for users with roles in view mode who have edited fields */}
            {mode === 'view' && !isCompleted && (userRoles.isReviewer || userRoles.isApprover || userRoles.isAuthorizer || (currentUser?.is_admin === 1 || currentUser?.is_admin === true || currentUser?.is_admin === '1')) && (
              <button className="btn-primary" onClick={handleSignatureSubmit}>
                <i className='bx bx-save'></i> Save Signature
              </button>
            )}
            
            {/* Show Submit/Update button only in create/edit modes */}
            {mode !== 'view' && !isCompleted && (
              <button className="btn-primary" onClick={handleSubmit}>
                {mode === 'edit' ? 'Update Requisition' : 'Submit Requisition'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Rejection Modal */}
      {isRejecting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, color: '#dc3545', marginBottom: '15px' }}>
              <i className='bx bx-x-circle'></i> Reject Requisition
            </h2>
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Are you sure you want to reject this requisition? The requester will receive an email notification with the reason.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Reason for Rejection <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                disabled={rejectionSubmitting}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setIsRejecting(false);
                  setRejectionNote('');
                }}
                disabled={rejectionSubmitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejection}
                disabled={rejectionSubmitting || !rejectionNote.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: rejectionSubmitting ? '#a0a0a0' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rejectionSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {rejectionSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <i className='bx bx-x-circle'></i> Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Requisition;