import React, { useState } from 'react';
import RoomsManager from './RoomsManager';
import BedsManager from './BedsManager';
import FixedAssetsManager from './FixedAssetsManager';
import './Resources.css';

const ResourcesPage = ({ user }) => {
    const [activeTab, setActiveTab] = useState('rooms');

    return (
        <div className="settings-container">
            <h2>Organization - Resource Management</h2>
            
            <div className="resources-layout">
                {/* Tab Navigation */}
                <div className="resources-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rooms')}
                    >
                        <i className='bx bx-buildings'></i>
                        Dormitory Rooms
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'beds' ? 'active' : ''}`}
                        onClick={() => setActiveTab('beds')}
                    >
                        <i className='bx bx-bed'></i>
                        Beds
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assets')}
                    >
                        <i className='bx bx-store'></i>
                        Fixed Assets
                    </button>
                </div>

                {/* Tab Content */}
                <div className="resources-content">
                    {activeTab === 'rooms' && <RoomsManager user={user} />}
                    {activeTab === 'beds' && <BedsManager user={user} />}
                    {activeTab === 'assets' && <FixedAssetsManager user={user} />}
                </div>
            </div>
        </div>
    );
};

export default ResourcesPage;
