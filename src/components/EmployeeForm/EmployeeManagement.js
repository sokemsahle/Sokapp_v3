import React, { useState, useEffect } from 'react';
import EmployeeForm from './EmployeeForm';
import EmployeePDFGenerator from './EmployeePDFGenerator';
import ExportUtils from '../../utils/ExportUtils';
import './EmployeeManagement.css';
import API_CONFIG from '../../config/api';

const EmployeeManagement = ({ isOpen, selectedProgram }) => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [employeeDocuments, setEmployeeDocuments] = useState({});
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuId, setExportMenuId] = useState(null);
  const [lookupDepartments, setLookupDepartments] = useState([]);

  // Load employees from database on mount and when program changes
  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      fetchLookupDepartments();
    }
  }, [isOpen, selectedProgram]);

  // Fetch lookup departments
  const fetchLookupDepartments = async () => {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOOKUP_DATA));
      const result = await response.json();
      
      if (result.success) {
        setLookupDepartments(result.departments || []);
      }
    } catch (error) {
      console.error('Error fetching lookup departments:', error);
      // Fallback to default departments if API fails
      setLookupDepartments(['HR', 'Finance', 'IT', 'Operations', 'Sales', 'Marketing', 'Administration', 'Program']);
    }
  };

  // Render employee row
  const renderEmployeeRow = (employee) => {
    // Ensure status has a proper value
    const empStatus = employee.status || (employee.is_active ? 'Active' : 'Inactive');
    
    return (
      <tr key={employee.id} style={{opacity: empStatus === 'Active' ? 1 : empStatus === 'Former Employee' ? 0.5 : 0.6}}>
        <td className="emp-id">{employee.employee_id}</td>
        <td>
          <div className="emp-name">
            <div className="avatar">
              {employee.profile_image ? (
                <img 
                  src={employee.profile_image} 
                  alt={employee.full_name}
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.textContent = employee.full_name?.charAt(0).toUpperCase();
                  }}
                />
              ) : (
                employee.full_name?.charAt(0).toUpperCase()
              )}
            </div>
            <span>{employee.full_name}</span>
          </div>
        </td>
        <td>
          <span className="dept-badge">{employee.department}</span>
        </td>
        <td>{employee.position}</td>
        <td>{employee.email}</td>
        <td>
          <span className={`status-badge ${empStatus === 'Active' ? 'active' : empStatus === 'Former Employee' ? 'former' : 'inactive'}`}>
            {empStatus}
          </span>
        </td>
        <td>
          <div className="action-buttons">
            <button 
              className="btn-icon btn-edit" 
              title="Edit"
              onClick={() => handleEdit(employee)}
            >
              <i className='bx bx-edit'></i>
            </button>
            <button 
              className={`btn-icon ${empStatus === 'Active' ? 'btn-deactivate' : empStatus === 'Former Employee' ? 'btn-former' : 'btn-activate'}`}
              title={empStatus === 'Active' ? 'Deactivate' : empStatus === 'Former Employee' ? 'Reactivate' : 'Activate'}
              onClick={() => toggleEmployeeStatus(employee)}
            >
              <i className={`bx ${empStatus === 'Active' ? 'bx-pause' : empStatus === 'Former Employee' ? 'bx-revision' : 'bx-play'}`}></i>
            </button>
            <div className="individual-export-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="btn-icon"
                onClick={() => setExportMenuId(exportMenuId === employee.id ? null : employee.id)}
                title="Export Options"
              >
                <i className='bx bx-download'></i>
              </button>
              {exportMenuId === employee.id && (
                <div className="export-menu" style={{ position: 'absolute', right: 0, zIndex: 1000 }}>
                  <button onClick={() => exportSingleEmployeePDF(employee)} className="export-menu-item">
                    <i className='bx bx-file-pdf'></i> Export PDF
                  </button>
                  <button onClick={() => exportSingleEmployeeExcel(employee)} className="export-menu-item">
                    <i className='bx bx-file-excel'></i> Export Excel
                  </button>
                  <button onClick={() => printSingleEmployee(employee)} className="export-menu-item">
                    <i className='bx bx-print'></i> Print
                  </button>
                </div>
              )}
            </div>
            <button 
              className="btn-icon btn-delete" 
              title="Delete"
              onClick={() => handleDeleteEmployee(employee.id)}
            >
              <i className='bx bx-trash'></i>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const fetchEmployees = async () => {
    try {
      let url = API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.EMPLOYEES);
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Log first employee to debug status
          if (data.employees.length > 0) {
            console.log('First employee raw data:', {
              id: data.employees[0].id,
              name: data.employees[0].full_name,
              status: data.employees[0].status,
              is_active: data.employees[0].is_active
            });
          }
          setEmployees(data.employees);
          
          // Fetch documents for each employee
          const documentsMap = {};
          for (const employee of data.employees) {
            const docs = await fetchEmployeeDocumentsFunc(employee.id);
            documentsMap[employee.id] = docs;
          }
          setEmployeeDocuments(documentsMap);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch employee documents (renamed to avoid conflict)
  const fetchEmployeeDocumentsFunc = async (employeeId) => {
    try {
      const response = await fetch(API_CONFIG.getEmployeeUrl(employeeId, '/documents'));
      const result = await response.json();
      
      if (result.success) {
        return result.documents;
      } else {
        console.error('Failed to fetch documents:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  };



  const handleCreateEmployee = async (formData) => {
    try {
      // Helper to convert undefined to null
      const cleanValue = (val) => val === undefined ? null : val;
      
      // Clean all values before sending
      const dataToSend = {
        employeeId: cleanValue(formData.employeeId),
        fullName: cleanValue(formData.fullName),
        email: cleanValue(formData.email),
        phone: cleanValue(formData.phone),
        department: cleanValue(formData.department),
        position: cleanValue(formData.position),
        hireDate: cleanValue(formData.hireDate),
        salary: cleanValue(formData.salary),
        address: cleanValue(formData.address),
        emergencyContact: cleanValue(formData.emergencyContact),
        emergencyPhone: cleanValue(formData.emergencyPhone),
        profileImage: cleanValue(formData.profileImage),
        annualLeaveDays: formData.annualLeaveDays || 21,
        sickLeaveDays: formData.sickLeaveDays || 10,
        usedAnnualLeave: formData.usedAnnualLeave || 0,
        usedSickLeave: formData.usedSickLeave || 0,
        recognition: cleanValue(formData.recognition),
        recognitionDate: cleanValue(formData.recognitionDate)
      };
      
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.EMPLOYEES), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // After creating employee, upload documents if any
          if (formData.documents && formData.documents.length > 0) {
            await uploadEmployeeDocuments(data.employee.id, formData.documents);
          }
          
          setEmployees([...employees, data.employee]);
          setShowForm(false);
          alert('Employee created successfully!');
        }
      } else {
        alert('Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error creating employee');
    }
  };

  const handleUpdateEmployee = async (formData) => {
    try {
      // Helper to convert undefined to null
      const cleanValue = (val) => val === undefined ? null : val;
      
      // Include is_active and status from formData, with fallbacks
      const dataToSend = {
        employeeId: cleanValue(formData.employeeId),
        fullName: cleanValue(formData.fullName),
        email: cleanValue(formData.email),
        phone: cleanValue(formData.phone),
        department: cleanValue(formData.department),
        position: cleanValue(formData.position),
        hireDate: cleanValue(formData.hireDate),
        salary: cleanValue(formData.salary),
        address: cleanValue(formData.address),
        emergencyContact: cleanValue(formData.emergencyContact),
        emergencyPhone: cleanValue(formData.emergencyPhone),
        profileImage: cleanValue(formData.profileImage),
        annualLeaveDays: formData.annualLeaveDays || 21,
        sickLeaveDays: formData.sickLeaveDays || 10,
        usedAnnualLeave: formData.usedAnnualLeave || 0,
        usedSickLeave: formData.usedSickLeave || 0,
        recognition: cleanValue(formData.recognition),
        recognitionDate: cleanValue(formData.recognitionDate),
        program_id: cleanValue(formData.program_id),
        status: formData.status !== undefined ? formData.status : (editingEmployee?.status || 'Active'),
        is_active: formData.status === 'Active' // Sync is_active with status
      };
      
      console.log('Sending update data:', dataToSend);
      console.log('Program ID being sent:', formData.program_id);
      console.log('Employee ID:', editingEmployee.id);
      
      const url = API_CONFIG.getEmployeeUrl(editingEmployee.id);
      console.log('Request URL:', url);
      console.log('API_BASE_URL:', API_CONFIG.BASE_URL);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      .catch(error => {
        console.error('Fetch error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        throw error;
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Received non-JSON response:', textResponse.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Backend may not be running or route not found.');
      }
      
      const responseData = await response.json();
      console.log('Server response:', responseData);
      
      if (response.ok && responseData.success) {
        // After updating employee, upload documents if any
        if (formData.documents && formData.documents.length > 0) {
          await uploadEmployeeDocuments(editingEmployee.id, formData.documents);
        }
        
        const updatedEmployees = employees.map(emp => 
          emp.id === editingEmployee.id ? responseData.employee : emp
        );
        setEmployees(updatedEmployees);
        setEditingEmployee(null);
        setShowForm(false);
        alert('Employee updated successfully!');
      } else {
        console.error('Update failed:', responseData);
        alert('Failed to update employee: ' + (responseData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error updating employee: ' + error.message);
    }
  };

  // Function to upload employee documents
  const uploadEmployeeDocuments = async (employeeId, documents) => {
    for (const doc of documents) {
      try {
        // Create FormData to handle file upload
        const formData = new FormData();
        formData.append('name', doc.name);
        formData.append('type', doc.type);
        if (doc.file) {
          formData.append('file', doc.file, doc.file.name); // Append the actual file
        }
        if (doc.issueDate) formData.append('issue_date', doc.issueDate);
        if (doc.expiryDate) formData.append('expiry_date', doc.expiryDate);
        if (doc.notes) formData.append('notes', doc.notes);

        const response = await fetch(API_CONFIG.getEmployeeUrl(employeeId, '/documents'), {
          method: 'POST',
          body: formData // Send FormData instead of JSON
          // Don't set Content-Type header, let browser set it with boundary
        });

        const result = await response.json();
        if (!result.success) {
          console.error(`Failed to upload document ${doc.name}:`, result.message);
          alert(`Failed to save document: ${doc.name}`);
        }
      } catch (error) {
        console.error('Error uploading document:', error);
        alert(`Error uploading document: ${doc.name}`);
      }
    }
  };

  const fetchEmployeeDocuments = async (employeeId) => {
    try {
      const response = await fetch(API_CONFIG.getEmployeeUrl(employeeId, '/documents'));
      const result = await response.json();
      
      if (result.success) {
        return result.documents;
      } else {
        console.error('Failed to fetch documents:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  };

  // Function to generate employee PDF report
  const generateEmployeePDF = async (employee) => {
    try {
      // Fetch documents for this employee
      const documents = await fetchEmployeeDocuments(employee.id);
      
      // Generate the PDF report
      EmployeePDFGenerator.generateEmployeeReport(employee, documents);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const response = await fetch(API_CONFIG.getEmployeeUrl(id), {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setEmployees(employees.filter(emp => emp.id !== id));
          alert('Employee deleted successfully!');
        } else {
          alert('Failed to delete employee');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Error deleting employee');
      }
    }
  };

  const handleEdit = (employee) => {
    // Map database fields (snake_case) to form fields (camelCase)
    const mappedEmployee = {
      id: employee.id,
      employeeId: employee.employee_id,
      fullName: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      hireDate: employee.hire_date,
      salary: employee.salary,
      address: employee.address,
      emergencyContact: employee.emergency_contact,
      emergencyPhone: employee.emergency_phone,
      profileImage: employee.profile_image,
      annualLeaveDays: employee.annual_leave_days,
      sickLeaveDays: employee.sick_leave_days,
      usedAnnualLeave: employee.used_annual_leave,
      usedSickLeave: employee.used_sick_leave,
      recognition: employee.recognition,
      recognitionDate: employee.recognition_date,
      program_id: employee.program_id || '',
      isActive: employee.is_active,
      status: employee.status || (employee.is_active ? 'Active' : 'Inactive')
    };
    setEditingEmployee(mappedEmployee);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Toggle employee active status - cycles through: Active -> Inactive -> Former Employee -> Active
  const toggleEmployeeStatus = async (employee) => {
    try {
      // Determine next status in the cycle
      let newStatus;
      if (!employee.status || employee.status === 'Active') {
        newStatus = 'Inactive';
      } else if (employee.status === 'Inactive') {
        newStatus = 'Former Employee';
      } else {
        newStatus = 'Active'; // Cycle back to Active from Former Employee
      }
      
      // Helper to convert undefined to null
      const toNull = (val) => val === undefined ? null : val;
      
      const response = await fetch(API_CONFIG.getUrl(`/api/employees/${employee.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: toNull(employee.employee_id),
          fullName: toNull(employee.full_name),
          email: toNull(employee.email),
          phone: toNull(employee.phone),
          department: toNull(employee.department),
          position: toNull(employee.position),
          hireDate: toNull(employee.hire_date),
          salary: toNull(employee.salary),
          address: toNull(employee.address),
          emergencyContact: toNull(employee.emergency_contact),
          emergencyPhone: toNull(employee.emergency_phone),
          profileImage: toNull(employee.profile_image),
          annualLeaveDays: employee.annual_leave_days || 21,
          sickLeaveDays: employee.sick_leave_days || 10,
          usedAnnualLeave: employee.used_annual_leave || 0,
          usedSickLeave: employee.used_sick_leave || 0,
          recognition: toNull(employee.recognition),
          recognitionDate: toNull(employee.recognition_date),
          is_active: newStatus === 'Active', // Keep is_active in sync for backward compatibility
          status: newStatus
        })
      });
      
      const data = await response.json();
      console.log('Toggle status response:', data);
      
      if (response.ok && data.success) {
        setEmployees(employees.map(emp => 
          emp.id === employee.id ? { ...emp, status: newStatus, is_active: newStatus === 'Active' } : emp
        ));
        alert(`Employee ${newStatus.toLowerCase()} successfully!`);
      } else {
        alert('Failed to update employee status: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert('Failed to update employee status: ' + error.message);
    }
  };

  // Get unique departments from lookup list
  const departments = lookupDepartments;

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
      if (exportMenuId && !event.target.closest('.individual-export-dropdown')) {
        setExportMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu, exportMenuId]);

  // Export to PDF
  const handleExportPDF = () => {
    const columns = [
      { header: 'Employee ID', accessor: 'employee_id' },
      { header: 'Name', accessor: 'full_name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Position', accessor: 'position' },
      { header: 'Email', accessor: 'email' },
      { header: 'Status', accessor: 'status' }
    ];
    
    const formattedData = employees.map(emp => ({
      employee_id: emp.employee_id || 'N/A',
      full_name: emp.full_name,
      department: emp.department || '-',
      position: emp.position || '-',
      email: emp.email || '-',
      status: emp.status || (emp.is_active ? 'Active' : 'Inactive')
    }));
    
    ExportUtils.exportToPDF('Employee Management Report', columns, formattedData, 'Employees');
    setShowExportMenu(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const columns = [
      { header: 'Employee ID', accessor: 'employee_id' },
      { header: 'Name', accessor: 'full_name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Position', accessor: 'position' },
      { header: 'Email', accessor: 'email' },
      { header: 'Status', accessor: 'status' }
    ];
    
    const formattedData = employees.map(emp => ({
      employee_id: emp.employee_id || 'N/A',
      full_name: emp.full_name,
      department: emp.department || '-',
      position: emp.position || '-',
      email: emp.email || '-',
      status: emp.status || (emp.is_active ? 'Active' : 'Inactive')
    }));
    
    ExportUtils.exportToExcel(columns, formattedData, 'Employees', 'Employees');
    setShowExportMenu(false);
  };

  // Print
  const handlePrint = () => {
    const columns = [
      { header: 'Employee ID', accessor: 'employee_id' },
      { header: 'Name', accessor: 'full_name' },
      { header: 'Department', accessor: 'department' },
      { header: 'Position', accessor: 'position' },
      { header: 'Email', accessor: 'email' },
      { header: 'Status', accessor: 'status' }
    ];
    
    const formattedData = employees.map(emp => ({
      employee_id: emp.employee_id || 'N/A',
      full_name: emp.full_name,
      department: emp.department || '-',
      position: emp.position || '-',
      email: emp.email || '-',
      status: emp.status || (emp.is_active ? 'Active' : 'Inactive')
    }));
    
    ExportUtils.printData('Employee Management Report', columns, formattedData);
    setShowExportMenu(false);
  };

  // Export single employee to PDF
  const exportSingleEmployeePDF = (employee) => {
    generateEmployeePDF(employee);
    setExportMenuId(null);
  };

  // Export single employee to Excel
  const exportSingleEmployeeExcel = (employee) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Employee ID', value: employee.employee_id || '-' },
      { field: 'Full Name', value: employee.full_name },
      { field: 'Email', value: employee.email || '-' },
      { field: 'Phone', value: employee.phone || '-' },
      { field: 'Department', value: employee.department || '-' },
      { field: 'Position', value: employee.position || '-' },
      { field: 'Hire Date', value: employee.hire_date || '-' },
      { field: 'Salary', value: employee.salary ? `${parseFloat(employee.salary).toFixed(2)} Birr` : '-' },
      { field: 'Status', value: employee.status || (employee.is_active ? 'Active' : 'Inactive') }
    ];
    
    ExportUtils.exportToExcel(columns, formattedData, 'Employee Details', `Employee_${employee.id}`);
    setExportMenuId(null);
  };

  // Print single employee
  const printSingleEmployee = (employee) => {
    const columns = [
      { header: 'Field', accessor: 'field' },
      { header: 'Value', accessor: 'value' }
    ];
    
    const formattedData = [
      { field: 'Employee ID', value: employee.employee_id || '-' },
      { field: 'Full Name', value: employee.full_name },
      { field: 'Email', value: employee.email || '-' },
      { field: 'Phone', value: employee.phone || '-' },
      { field: 'Department', value: employee.department || '-' },
      { field: 'Position', value: employee.position || '-' },
      { field: 'Hire Date', value: employee.hire_date || '-' },
      { field: 'Salary', value: employee.salary ? `${parseFloat(employee.salary).toFixed(2)} Birr` : '-' },
      { field: 'Status', value: employee.status || (employee.is_active ? 'Active' : 'Inactive') }
    ];
    
    ExportUtils.printData(`Employee Profile - ${employee.full_name}`, columns, formattedData);
    setExportMenuId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="employee-management">
      <div className="page-header">
        <h2>Employee Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="export-dropdown" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="btn-secondary"
              type="button"
              title="Export options"
            >
              <i className='bx bx-download'></i> Export{' '}
              <i className='bx bx-chevron-down'></i>
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={handleExportPDF} className="export-menu-item">
                  <i className='bx bx-file-pdf'></i> Export PDF
                </button>
                <button onClick={handleExportExcel} className="export-menu-item">
                  <i className='bx bx-file-excel'></i> Export Excel
                </button>
                <button onClick={handlePrint} className="export-menu-item">
                  <i className='bx bx-print'></i> Print
                </button>
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <i className='bx bx-plus'></i> Add New Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <i className='bx bx-search'></i>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="filter-select"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <i className='bx bx-user'></i>
          <div>
            <h4>{employees.length}</h4>
            <span>Total Employees</span>
          </div>
        </div>
        <div className="stat-card">
          <i className='bx bx-file'></i>
          <div>
            <h4>{employees.reduce((acc, emp) => acc + (emp.documents?.length || 0), 0)}</h4>
            <span>Total Documents</span>
          </div>
        </div>
        <div className="stat-card">
          <i className='bx bx-building'></i>
          <div>
            <h4>{departments.length}</h4>
            <span>Departments</span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="employees-table-container">
        {filteredEmployees.length === 0 ? (
          <div className="no-data">
            <i className='bx bx-user-x'></i>
            <p>No employees found</p>
            {employees.length === 0 && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Add Your First Employee
              </button>
            )}
          </div>
        ) : (
          <table className="employees-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(renderEmployeeRow)}
            </tbody>
          </table>
        )}
      </div>

      {/* Employee Form Modal */}
      <EmployeeForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
        initialData={editingEmployee}
      />
    </div>
  );
};

export default EmployeeManagement;
