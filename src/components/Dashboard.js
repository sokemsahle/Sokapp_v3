import React, { useState, useEffect } from 'react';

const Dashboard = ({ selectedProgram }) => {
  const [staffList, setStaffList] = useState([]);
  const [staffCount, setStaffCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [underageCount, setUnderageCount] = useState(0);
  const [emptyBedsCount, setEmptyBedsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard statistics on mount
  useEffect(() => {
    fetchDashboardStats();
    fetchEmployees();
  }, [selectedProgram]);

  // Fetch dashboard statistics (children and beds)
  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch children data
      let childrenUrl = 'http://localhost:5000/api/children';
      if (selectedProgram) {
        childrenUrl += `?program_id=${selectedProgram}`;
      }
      const childrenResponse = await fetch(childrenUrl);
      const childrenResult = await childrenResponse.json();
      
      if (childrenResult.success && childrenResult.data) {
        const children = childrenResult.data;
        setChildrenCount(children.length);
        
        // Calculate underage children (estimated_age < 18 or date_of_birth indicates under 18)
        const now = new Date();
        const underage = children.filter(child => {
          // Check estimated_age first (if available)
          if (child.estimated_age !== null && child.estimated_age !== undefined) {
            return child.estimated_age < 18;
          }
          // Fallback to date_of_birth calculation
          if (child.date_of_birth) {
            const birthDate = new Date(child.date_of_birth);
            const age = now.getFullYear() - birthDate.getFullYear();
            const monthDiff = now.getMonth() - birthDate.getMonth();
            const adjustedAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate()) 
              ? age - 1 
              : age;
            return adjustedAge < 18;
          }
          return false;
        });
        setUnderageCount(underage.length);
      }
      
      // Fetch beds data
      const bedsResponse = await fetch('http://localhost:5000/api/beds');
      const bedsResult = await bedsResponse.json();
      
      if (bedsResult.success && bedsResult.data) {
        const beds = bedsResult.data;
        const emptyBeds = beds.filter(bed => bed.status === 'available');
        setEmptyBedsCount(emptyBeds.length);
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch employees from database in real-time
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/employees';
      if (selectedProgram) {
        url += `?program_id=${selectedProgram}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.employees) {
        // Filter out former employees and map employee data to staff format
        const activeEmployees = result.employees.filter(emp => {
          const empStatus = emp.status || (emp.is_active ? 'Active' : 'Inactive');
          return empStatus !== 'Former Employee';
        });
        
        const mappedStaff = activeEmployees.map(emp => ({
          id: emp.id,
          name: emp.full_name,
          role: emp.position || 'Staff Member',
          contact: emp.phone || emp.email || 'N/A',
          status: emp.status || (emp.is_active ? 'Active' : 'Inactive')
        }));
        
        // If no program selected, show first 6 as preview
        // If program IS selected, show ALL staff (program staff first, then others)
        const displayLimit = selectedProgram ? activeEmployees.length : 6;
        setStaffList(mappedStaff.slice(0, displayLimit));
        setStaffCount(activeEmployees.length);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter staff based on search query
  const filteredStaff = staffList.filter(staff => {
    const query = searchQuery.toLowerCase();
    return (
      staff.name.toLowerCase().includes(query) ||
      staff.role.toLowerCase().includes(query) ||
      staff.contact.toLowerCase().includes(query) ||
      staff.status.toLowerCase().includes(query)
    );
  });

  // Summary cards with real data
  const cards = [
    { icon: 'bx bx-face', value: statsLoading ? '-' : childrenCount.toString(), label: 'Total Children' },
    { icon: 'bx bx-user', value: loading ? '-' : staffCount.toString(), label: 'Staff Members' },
    { icon: 'bx bx-bed', value: statsLoading ? '-' : emptyBedsCount.toString(), label: 'Empty Beds' },
  ];

  return (
    <main>
      <div className="header">
        <h1>Dashboard</h1>
        <ul className="breadcrumb">
          <li><a href="#">Home</a></li>
          /
          <li><a href="#" className="active">Dashboard</a></li>
        </ul>
      </div>

      {/* Summary Cards */}
      <ul className="cards">
        {cards.map((card, index) => (
          <li key={index} className="card-item">
            <div className="card-icon">
                <i className={card.icon}></i>
            </div>
            <span className="info">
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </span>
          </li>
        ))}
      </ul>

      {/* Simple Staff Table Section */}
      <div className="table-data">
        <div className="order">
          <div className="head">
            <h3>Staff Members</h3>
            <div className="search-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '250px',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#888',
                    fontSize: '16px'
                  }}
                  title="Clear search"
                >
                  <i className='bx bx-x'></i>
                </button>
              )}
            </div>
            <i className='bx bx-filter'></i>
          </div>
          <div style={{ padding: '10px 0', fontSize: '14px', color: '#888' }}>
            {selectedProgram 
              ? `Showing all ${staffList.length} staff members (program staff shown first)`
              : `Showing ${filteredStaff.length} of ${staffList.length} staff members`}
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#888'}}>
                    <i className='bx bx-loader-alt bx-spin' style={{fontSize: '1.5rem', marginRight: '10px'}}></i>
                    Loading staff members...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#888'}}>
                    {staffList.length === 0 
                      ? 'No staff members found. Add employees in the Employees section.'
                      : 'No staff members matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <p style={{fontWeight: '500'}}>{staff.name}</p>
                    </td>
                    <td>{staff.role}</td>
                    <td>{staff.contact}</td>
                    <td>
                      <span className={`status ${staff.status.toLowerCase().replace(' ', '-')}`}>
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;