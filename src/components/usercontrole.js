import React, { useState, useEffect } from "react";
import './usercontrole.css';
import API_CONFIG from '../config/api';

const UserControle = ({UserControlopen}) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    
    // User modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        full_name: '',
        email: '',
        role_id: '',
        department: '',
        phone: '',
        program_id: '',
        requisition_roles: []
    });
    
    // Role modal states
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleFormData, setRoleFormData] = useState({
        name: '',
        description: '',
        permission_ids: []
    });

    // Program modal states
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);
    const [programFormData, setProgramFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });

    useEffect(() => {
        console.log('UserControle: UserControlopen =', UserControlopen);
        if (UserControlopen) {
            fetchUsers();
            fetchRoles();
            fetchPermissions();
            fetchPrograms();
        }
    }, [UserControlopen]);

    if (!UserControlopen) return null;

    const fetchUsers = async () => {
        try {
            setLoading(true);
            console.log('Fetching users from:', API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS));
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS));
            console.log('Users response status:', response.status);
            const result = await response.json();
            console.log('Users response data:', result);
            if (result.success) {
                setUsers(result.data);
            } else {
                console.error('API returned success: false', result);
                alert('Failed to fetch users: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to connect to server. Please ensure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROLES));
            const result = await response.json();
            if (result.success) {
                setRoles(result.data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PERMISSIONS));
            const result = await response.json();
            if (result.success) {
                setPermissions(result.data);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const fetchPrograms = async () => {
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROGRAMS));
            const result = await response.json();
            if (result.success) {
                setPrograms(result.programs);
            }
        } catch (error) {
            console.error('Error fetching programs:', error);
        }
    };

    const handleUserInputChange = (e) => {
        const { name, value } = e.target;
        setUserFormData({ ...userFormData, [name]: value });
    };

    const handleRequisitionRoleChange = (roleType) => {
        const newRoles = userFormData.requisition_roles.includes(roleType)
            ? userFormData.requisition_roles.filter(role => role !== roleType)
            : [...userFormData.requisition_roles, roleType];
        setUserFormData({ ...userFormData, requisition_roles: newRoles });
    };

    const handleRoleInputChange = (e) => {
        const { name, value } = e.target;
        setRoleFormData({ ...roleFormData, [name]: value });
    };

    const handlePermissionChange = (permissionId) => {
        const newPermissionIds = roleFormData.permission_ids.includes(permissionId)
            ? roleFormData.permission_ids.filter(id => id !== permissionId)
            : [...roleFormData.permission_ids, permissionId];
        setRoleFormData({ ...roleFormData, permission_ids: newPermissionIds });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.USERS), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userFormData)
            });
            const result = await response.json();
            if (result.success) {
                alert('User created successfully!');
                setShowCreateModal(false);
                setUserFormData({
                    full_name: '',
                    email: '',
                    role_id: '',
                    department: '',
                    phone: '',
                    program_id: ''
                });
                fetchUsers();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user');
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...userFormData,
                requisition_roles: userFormData.requisition_roles
            };
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                alert('User updated successfully!');
                setShowEditModal(false);
                setEditingUser(null);
                fetchUsers();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/${userId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                alert('User deleted successfully!');
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            // Determine new status based on current status
            let newIsActive;
            if (user.is_active) {
                newIsActive = false;  // Toggle from active to inactive
            } else {
                newIsActive = true;   // Toggle from inactive to active
            }
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: user.full_name,
                    email: user.email,
                    role_id: user.role_id || '',
                    department: user.department || '',
                    phone: user.phone || '',
                    is_active: newIsActive
                })
            });
            
            const data = await response.json();
            console.log('Toggle status response:', data);
            
            if (response.ok && data.success) {
                setUsers(users.map(u => 
                    u.id === user.id ? { ...u, is_active: newIsActive } : u
                ));
                alert(`User status updated successfully!`);
            } else {
                alert('Failed to update user status: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Failed to update user status: ' + error.message);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setUserFormData({
            full_name: user.full_name,
            email: user.email,
            role_id: user.role_id || '',
            department: user.department || '',
            phone: user.phone || '',
            program_id: user.program_id || '',
            is_active: user.is_active,
            requisition_roles: user.requisition_roles ? user.requisition_roles.split(',') : []
        });
        setShowEditModal(true);
    };

    // Role management functions
    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.ROLES), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roleFormData)
            });
            const result = await response.json();
            if (result.success) {
                alert('Role created successfully!');
                setShowRoleModal(false);
                setRoleFormData({ name: '', description: '', permission_ids: [] });
                fetchRoles();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating role:', error);
            alert('Failed to create role');
        }
    };

    const handleEditRole = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROLES}/${editingRole.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...roleFormData,
                    is_active: editingRole.is_active
                })
            });
            const result = await response.json();
            if (result.success) {
                alert('Role updated successfully!');
                setShowRoleModal(false);
                setEditingRole(null);
                fetchRoles();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROLES}/${roleId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                alert('Role deleted successfully!');
                fetchRoles();
            }
        } catch (error) {
            console.error('Error deleting role:', error);
            alert('Failed to delete role');
        }
    };

    const openEditRoleModal = (role) => {
        setEditingRole(role);
        setRoleFormData({
            name: role.name,
            description: role.description || '',
            permission_ids: role.permissions ? role.permissions.map(p => p.id) : []
        });
        setShowRoleModal(true);
    };

    const openCreateRoleModal = () => {
        setEditingRole(null);
        setRoleFormData({ name: '', description: '', permission_ids: [] });
        setShowRoleModal(true);
    };

    // Program management functions
    const handleCreateProgram = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROGRAMS), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(programFormData)
            });
            const result = await response.json();
            if (result.success) {
                alert('Program created successfully!');
                setShowProgramModal(false);
                setProgramFormData({ name: '', description: '', is_active: true });
                fetchPrograms();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating program:', error);
            alert('Failed to create program');
        }
    };

    const handleEditProgram = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROGRAMS}/${editingProgram.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(programFormData)
            });
            const result = await response.json();
            if (result.success) {
                alert('Program updated successfully!');
                setShowProgramModal(false);
                setEditingProgram(null);
                fetchPrograms();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating program:', error);
            alert('Failed to update program');
        }
    };

    const handleDeleteProgram = async (programId) => {
        if (!window.confirm('Are you sure you want to delete this program? This will fail if the program is assigned to any users, employees, or children.')) return;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROGRAMS}/${programId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                alert('Program deleted successfully!');
                fetchPrograms();
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting program:', error);
            alert('Failed to delete program');
        }
    };

    const openEditProgramModal = (program) => {
        setEditingProgram(program);
        setProgramFormData({
            name: program.name,
            description: program.description || '',
            is_active: program.is_active
        });
        setShowProgramModal(true);
    };

    const openCreateProgramModal = () => {
        setEditingProgram(null);
        setProgramFormData({ name: '', description: '', is_active: true });
        setShowProgramModal(true);
    };

    const handleProgramInputChange = (e) => {
        const { name, value } = e.target;
        setProgramFormData({ 
            ...programFormData, 
            [name]: name === 'is_active' ? value === 'true' : value 
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {});

    return (    
    <div className="user-control-section">
            {console.log('UserControle rendering, UserControlopen:', UserControlopen, 'loading:', loading)}
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <i className='bx bx-user'></i> Users
                </button>
                <button 
                    className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <i className='bx bx-shield'></i> Roles & Permissions
                </button>
                <button 
                    className={`tab ${activeTab === 'programs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('programs')}
                >
                    <i className='bx bx-folder'></i> Programs
                </button>
            </div>

            {activeTab === 'users' && (
                <>
                    <div className="user-control-header">
                        <h2>User Management</h2>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            <i className='bx bx-plus'></i> Create New User
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">Loading users...</div>
                    ) : (
                        <table className="user-control-table"> 
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Requisition Roles</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>    
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.full_name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className="role-badge">
                                                {user.role_name || 'No Role'}
                                            </span>
                                        </td>
                                        <td>{user.department || '-'}</td>
                                        <td>
                                            {user.requisition_roles ? (
                                                user.requisition_roles.split(',').map((role, index) => (
                                                    <span key={index} className="role-badge" style={{marginRight: '5px', marginTop: '3px', display: 'inline-block'}}>
                                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                                    </span>
                                                ))
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{formatDate(user.created_at)}</td>
                                        <td className="actions">
                                            <button className="btn-icon" onClick={() => openEditModal(user)} title="Edit">
                                                <i className='bx bx-edit'></i>
                                            </button>
                                            <button 
                                                className={`btn-icon ${user.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                                                title={user.is_active ? 'Deactivate' : 'Activate'}
                                                onClick={() => toggleUserStatus(user)}
                                            >
                                                <i className={`bx ${user.is_active ? 'bx-pause' : 'bx-play'}`}></i>
                                            </button>
                                            <button className="btn-icon delete" onClick={() => handleDeleteUser(user.id)} title="Delete">
                                                <i className='bx bx-trash'></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {activeTab === 'roles' && (
                <>
                    <div className="user-control-header">
                        <h2>Role Management</h2>
                        <button className="btn-primary" onClick={openCreateRoleModal}>
                            <i className='bx bx-plus'></i> Create New Role
                        </button>
                    </div>

                    <div className="roles-grid">
                        {roles.map((role) => (
                            <div key={role.id} className="role-card">
                                <div className="role-card-header">
                                    <h3>{role.name}</h3>
                                    <div className="role-actions">
                                        <button className="btn-icon" onClick={() => openEditRoleModal(role)} title="Edit">
                                            <i className='bx bx-edit'></i>
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDeleteRole(role.id)} title="Delete">
                                            <i className='bx bx-trash'></i>
                                        </button>
                                    </div>
                                </div>
                                <p className="role-description">{role.description || 'No description'}</p>
                                <div className="role-permissions">
                                    <h4>Permissions:</h4>
                                    <div className="permission-tags">
                                        {role.permissions && role.permissions.map(perm => (
                                            <span key={perm.id} className="permission-tag">{perm.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'programs' && (
                <>
                    <div className="user-control-header">
                        <h2>Program Management</h2>
                        <button className="btn-primary" onClick={openCreateProgramModal}>
                            <i className='bx bx-plus'></i> Create New Program
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading">Loading programs...</div>
                    ) : (
                        <table className="user-control-table">
                            <thead>
                                <tr>
                                    <th>Program Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {programs.map((program) => (
                                    <tr key={program.id}>
                                        <td>{program.name}</td>
                                        <td>{program.description || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${program.is_active ? 'active' : 'inactive'}`}>
                                                {program.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{formatDate(program.created_at)}</td>
                                        <td className="actions">
                                            <button className="btn-icon" onClick={() => openEditProgramModal(program)} title="Edit">
                                                <i className='bx bx-edit'></i>
                                            </button>
                                            <button className="btn-icon delete" onClick={() => handleDeleteProgram(program.id)} title="Delete">
                                                <i className='bx bx-trash'></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create New User</h3>
                            <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="full_name" value={userFormData.full_name} onChange={handleUserInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={userFormData.email} onChange={handleUserInputChange} required />
                            </div>
                            {/* Password field removed - admins no longer set passwords. Users receive email invitations. */}
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role_id" value={userFormData.role_id} onChange={handleUserInputChange} required>
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input type="text" name="department" value={userFormData.department} onChange={handleUserInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Program</label>
                                <select name="program_id" value={userFormData.program_id} onChange={handleUserInputChange}>
                                    <option value="">No Program</option>
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>{program.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={userFormData.phone} onChange={handleUserInputChange} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Edit User</h3>
                            <button className="btn-close" onClick={() => setShowEditModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={handleEditUser}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" name="full_name" value={userFormData.full_name} onChange={handleUserInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={userFormData.email} onChange={handleUserInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role_id" value={userFormData.role_id} onChange={handleUserInputChange}>
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input type="text" name="department" value={userFormData.department} onChange={handleUserInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Program</label>
                                <select name="program_id" value={userFormData.program_id} onChange={handleUserInputChange}>
                                    <option value="">No Program</option>
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>{program.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={userFormData.phone} onChange={handleUserInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="is_active" value={userFormData.is_active} onChange={handleUserInputChange}>
                                    <option value={true}>Active</option>
                                    <option value={false}>Inactive</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Requisition Roles</label>
                                <div className="permissions-grid">
                                    {['Reviewer', 'Approver', 'Authorizer', 'Finance'].map(role => {
                                        const roleKey = role.toLowerCase();
                                        return (
                                            <label key={roleKey} className="permission-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={userFormData.requisition_roles.includes(roleKey)}
                                                    onChange={() => handleRequisitionRoleChange(roleKey)}
                                                />
                                                <span>{role}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Update User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create/Edit Role Modal */}
            {showRoleModal && (
                <div className="modal-overlay">
                    <div className="modal modal-large">
                        <div className="modal-header">
                            <h3>{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
                            <button className="btn-close" onClick={() => setShowRoleModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={editingRole ? handleEditRole : handleCreateRole}>
                            <div className="form-group">
                                <label>Role Name</label>
                                <input type="text" name="name" value={roleFormData.name} onChange={handleRoleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input type="text" name="description" value={roleFormData.description} onChange={handleRoleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Permissions</label>
                                <div className="permissions-grid">
                                    {/* Children Permissions Section - Highlighted */}
                                    {groupedPermissions['Children'] && (
                                        <div className="permission-category children-section" style={{border: '2px solid #4CAF50', borderRadius: '8px', padding: '15px', marginBottom: '15px', backgroundColor: '#f9fff9'}}>
                                            <h4 style={{color: '#4CAF50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <i className='bx bx-user' style={{fontSize: '20px'}}></i>
                                                👶 Child Management Permissions
                                            </h4>
                                            {groupedPermissions['Children'].map(perm => (
                                                <label key={perm.id} className="permission-checkbox" style={{backgroundColor: 'white', border: '1px solid #ddd', padding: '8px', borderRadius: '5px', marginBottom: '5px'}}>
                                                    <input
                                                        type="checkbox"
                                                        checked={roleFormData.permission_ids.includes(perm.id)}
                                                        onChange={() => handlePermissionChange(perm.id)}
                                                    />
                                                    <span><strong>{perm.name}</strong> - {perm.description}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Other Permission Categories */}
                                    {Object.entries(groupedPermissions).map(([category, perms]) => {
                                        if (category === 'Children') return null; // Skip Children as we already showed it above
                                        return (
                                            <div key={category} className="permission-category">
                                                <h4>{category}</h4>
                                                {perms.map(perm => (
                                                    <label key={perm.id} className="permission-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={roleFormData.permission_ids.includes(perm.id)}
                                                            onChange={() => handlePermissionChange(perm.id)}
                                                        />
                                                        <span>{perm.description}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingRole ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create/Edit Program Modal */}
            {showProgramModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingProgram ? 'Edit Program' : 'Create New Program'}</h3>
                            <button className="btn-close" onClick={() => setShowProgramModal(false)}>
                                <i className='bx bx-x'></i>
                            </button>
                        </div>
                        <form onSubmit={editingProgram ? handleEditProgram : handleCreateProgram}>
                            <div className="form-group">
                                <label>Program Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={programFormData.name} 
                                    onChange={handleProgramInputChange} 
                                    placeholder="e.g., Youth Empowerment Program"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    name="description" 
                                    value={programFormData.description} 
                                    onChange={handleProgramInputChange} 
                                    placeholder="Brief description of the program..."
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select 
                                    name="is_active" 
                                    value={programFormData.is_active} 
                                    onChange={handleProgramInputChange}
                                >
                                    <option value={true}>Active</option>
                                    <option value={false}>Inactive</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowProgramModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {editingProgram ? 'Update Program' : 'Create Program'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default UserControle;