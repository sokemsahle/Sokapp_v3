import React, { useState } from "react";
import ChildReport from "./Report/ChildReport";
import EmployeeReport from "./Report/EmployeeReport";
import InventoryReport from "./Report/InventoryReport";
import UserActivityReport from "./Report/UserActivityReport";
import AttendanceReport from "./Report/AttendanceReport";
import "./Report/Report.css";

const Report = ({Reportopen, selectedProgram}) => {
    const [activeReport, setActiveReport] = useState('child');

    // Don't render if Reportopen is false
    if (!Reportopen) return null;

    const renderActiveReport = () => {
        switch(activeReport) {
            case 'child':
                return <ChildReport selectedProgram={selectedProgram} />;
            case 'employee':
                return <EmployeeReport selectedProgram={selectedProgram} />;
            case 'inventory':
                return <InventoryReport selectedProgram={selectedProgram} />;
            case 'userActivity':
                return <UserActivityReport selectedProgram={selectedProgram} />;
            case 'attendance':
                return <AttendanceReport selectedProgram={selectedProgram} />;
            default:
                return <ChildReport />;
        }
    };

    return (
        <div className="report-section">
            <div className="report-header">
                <h2>Reports</h2>
            </div>

            <div className="report-container">
                {/* Sidebar Report Menu */}
                <div className="report-sidebar">
                    <h3>Available Reports</h3>
                    <ul className="report-menu">
                        <li 
                            className={activeReport === 'child' ? 'active' : ''}
                            onClick={() => setActiveReport('child')}
                        >
                            <i className='bx bx-child'></i>
                            <div className="menu-text">
                                <span className="menu-title">Child Report</span>
                                <span className="menu-description">Age distribution & demographics</span>
                            </div>
                        </li>
                        <li 
                            className={activeReport === 'employee' ? 'active' : ''}
                            onClick={() => setActiveReport('employee')}
                        >
                            <i className='bx bx-user'></i>
                            <div className="menu-text">
                                <span className="menu-title">Employee Report</span>
                                <span className="menu-description">Department & status distribution</span>
                            </div>
                        </li>
                        <li 
                            className={activeReport === 'inventory' ? 'active' : ''}
                            onClick={() => setActiveReport('inventory')}
                        >
                            <i className='bx bx-package'></i>
                            <div className="menu-text">
                                <span className="menu-title">Inventory Report</span>
                                <span className="menu-description">Category & status distribution</span>
                            </div>
                        </li>
                        <li 
                            className={activeReport === 'userActivity' ? 'active' : ''}
                            onClick={() => setActiveReport('userActivity')}
                        >
                            <i className='bx bx-user-circle'></i>
                            <div className="menu-text">
                                <span className="menu-title">User Activity</span>
                                <span className="menu-description">Login tracking & audit trail</span>
                            </div>
                        </li>
                        <li 
                            className={activeReport === 'attendance' ? 'active' : ''}
                            onClick={() => setActiveReport('attendance')}
                        >
                            <i className='bx bx-time-five'></i>
                            <div className="menu-text">
                                <span className="menu-title">Attendance Report</span>
                                <span className="menu-description">Employee attendance tracking</span>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Report Content Area */}
                <div className="report-content">
                    {renderActiveReport()}
                </div>
            </div>
        </div>
    )
};
export default Report;
