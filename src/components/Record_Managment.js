import React from "react";

const Record_Managment = ({RecordManopen}) => {
    if (!RecordManopen) return null;
    const records = [
        { name: 'John Doe', age: 8, grade: '3rd', status: 'Active' },
        { name: 'Jane Smith', age: 7, grade: '2nd', status: 'Inactive' },
        { name: 'Sam Brown', age: 9, grade: '4th', status: 'Active' },
    ];
    return (
    <div className="record-management-section">
            <h2>Record Management</h2>
            <table className="record-management-table"> 
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Grade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record, index) => (
                        <tr key={index}>
                            <td>{record.name}</td>
                            <td>{record.age}</td>
                            <td>{record.grade}</td>
                            <td>{record.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Record_Managment;