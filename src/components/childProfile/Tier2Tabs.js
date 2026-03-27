import React, { useState } from 'react';
import GuardianTab from './GuardianTab';
import LegalTab from './LegalTab';
import MedicalTab from './MedicalTab';
import EducationTab from './EducationTab';
import CaseHistoryTab from './CaseHistoryTab';
import './ChildProfile.css';

const Tier2Tabs = ({ childId, child, user }) => {
  const [activeTab, setActiveTab] = useState('guardians');

  const tabs = [];

  // Check permissions for each tab
  if (user?.permissions?.includes('guardian_manage')) {
    tabs.push({ id: 'guardians', label: 'Family', icon: 'bx-user' });
  }
  if (user?.permissions?.includes('legal_manage')) {
    tabs.push({ id: 'legal', label: 'Legal Documents', icon: 'bx-file' });
  }
  if (user?.permissions?.includes('medical_manage')) {
    tabs.push({ id: 'medical', label: 'Medical Records', icon: 'bx-medal' });
  }
  if (user?.permissions?.includes('education_manage')) {
    tabs.push({ id: 'education', label: 'Education', icon: 'bx-book' });
  }
  if (user?.permissions?.includes('case_manage')) {
    tabs.push({ id: 'case', label: 'Case History', icon: 'bx-folder' });
  }

  if (tabs.length === 0) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'guardians':
        return <GuardianTab childId={childId} user={user} />;
      case 'legal':
        return <LegalTab childId={childId} user={user} />;
      case 'medical':
        return <MedicalTab childId={childId} user={user} />;
      case 'education':
        return <EducationTab childId={childId} user={user} />;
      case 'case':
        return <CaseHistoryTab childId={childId} user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="tier2-tabs">
      <div className="tabs-header">
        <h2>Extended Documentation</h2>
        <div className="tab-buttons">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`bx ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Tier2Tabs;
