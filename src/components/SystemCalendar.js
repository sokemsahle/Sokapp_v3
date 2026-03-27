import React, { useState, useEffect } from 'react';
import './Appointments.css';
import API_CONFIG from '../config/api';
import AppointmentModal from './AppointmentModal';
import { 
  formatDateToDDMMYYYY, 
  formatDateTime,
  getFirstDayOfMonth,
  getDaysInMonth,
  isToday,
  isSameDay
} from '../utils/dateUtils';

const SystemCalendar = ({ user }) => {
  const [view, setView] = useState('month'); // 'month' or 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [message, setMessage] = useState('');

  // Fetch all system appointments on mount and when view/date changes
  useEffect(() => {
    fetchAllAppointments();
  }, [view, currentDate]);

  const fetchAllAppointments = async () => {
    setLoading(true);
    try {
      let url;
      
      if (view === 'month') {
        // Fetch appointments for the entire month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString();
        const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        
        url = `${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.APPOINTMENTS_RANGE)}?startDate=${startDate}&endDate=${endDate}`;
      } else {
        // Fetch appointments for the selected day
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        url = `${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.APPOINTMENTS_RANGE)}?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('[SystemCalendar] Fetched result:', result);
      
      if (result.success) {
        // Backend returns: { success: true, data: [...] }
        console.log('[SystemCalendar] Fetched appointments count:', result.data?.length || 0);
        setAppointments(result.data || []);
      } else {
        setMessage('Failed to fetch system appointments');
      }
    } catch (error) {
      console.error('Error fetching system appointments:', error);
      setMessage('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppointment = (result) => {
    if (result.success) {
      setMessage(`Appointment ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
      fetchAllAppointments(); // Refresh the list
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const openCreateModal = (date = null) => {
    setModalMode('create');
    setSelectedAppointment(date ? { date } : null);
    setModalOpen(true);
  };

  const openEditModal = (appointment) => {
    setModalMode('edit');
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const closeModall = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setCurrentDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
  };

  // Get appointments for a specific day
  const getAppointmentsForDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_datetime);
      return isSameDay(date, aptDate);
    });
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = getFirstDayOfMonth(new Date(year, month, 1));
    const daysInMonth = getDaysInMonth(year, month);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="month-view">
        <div className="calendar-header">
          <button onClick={goToPreviousMonth} className="nav-btn">&lt;</button>
          <h3>{monthNames[month]} {year} - System Calendar</h3>
          <button onClick={goToNextMonth} className="nav-btn">&gt;</button>
        </div>
        
        <div className="calendar-grid">
          {/* Day names header */}
          <div className="calendar-row calendar-header-row">
            {dayNames.map(day => (
              <div key={day} className="calendar-cell day-name">{day}</div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="calendar-row">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="calendar-cell empty"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentDay = isToday(date);
              
              return (
                <div 
                  key={day} 
                  className={`calendar-cell day-cell ${isCurrentDay ? 'today' : ''}`}
                  onClick={() => openCreateModal(date)}
                >
                  <div className="day-number">
                    {day}
                    {isCurrentDay && <span className="today-indicator">●</span>}
                  </div>
                  
                  <div className="day-appointments">
                    {dayAppointments.slice(0, 3).map((apt, idx) => (
                      <div 
                        key={idx}
                        className="appointment-badge"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(apt);
                        }}
                        title={`${apt.title} - ${apt.creator_full_name} with ${apt.attendee_full_name}`}
                      >
                        {apt.title}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="more-appointments">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render day view (agenda list)
  const renderDayView = () => {
    const todayAppointments = appointments.sort((a, b) => 
      new Date(a.start_datetime) - new Date(b.start_datetime)
    );

    return (
      <div className="day-view">
        <div className="day-header">
          <button onClick={goToPreviousDay} className="nav-btn">&lt;</button>
          <h3>{formatDateToDDMMYYYY(currentDate.toISOString())} - System Calendar</h3>
          <button onClick={goToNextDay} className="nav-btn">&gt;</button>
        </div>
        
        <div className="agenda-list">
          {todayAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>No system appointments scheduled for this day.</p>
              <button onClick={() => openCreateModal()} className="btn-primary">
                Schedule Appointment
              </button>
            </div>
          ) : (
            todayAppointments.map((apt) => (
              <div 
                key={apt.id} 
                className="agenda-item"
                onClick={() => openEditModal(apt)}
              >
                <div className="agenda-time">
                  {formatDateTime(apt.start_datetime)}
                </div>
                <div className="agenda-content">
                  <h4>{apt.title}</h4>
                  <p className="agenda-participants">
                    <strong>Created by:</strong> {apt.creator_full_name} ({apt.creator_email})
                  </p>
                  <p className="agenda-participants">
                    <strong>With:</strong> {apt.attendee_full_name} ({apt.attendee_email})
                  </p>
                  {apt.description && (
                    <p className="agenda-description">{apt.description}</p>
                  )}
                  {apt.location && (
                    <p className="agenda-location">📍 {apt.location}</p>
                  )}
                  {apt.status && (
                    <span className={`agenda-status status-${apt.status}`}>
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h2>System Calendar - All Appointments</h2>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month View
            </button>
            <button 
              className={`toggle-btn ${view === 'day' ? 'active' : ''}`}
              onClick={() => setView('day')}
            >
              Day Agenda
            </button>
          </div>
          <button onClick={goToToday} className="btn-secondary">
            Today
          </button>
          <button onClick={() => openCreateModal()} className="btn-primary">
            + New Appointment
          </button>
        </div>
      </div>
      
      {message && (
        <div className="message-banner">{message}</div>
      )}
      
      {loading ? (
        <div className="loading-container">Loading system appointments...</div>
      ) : (
        view === 'month' ? renderMonthView() : renderDayView()
      )}
      
      <AppointmentModal
        isOpen={modalOpen}
        onClose={closeModall}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
        mode={modalMode}
      />
    </div>
  );
};

export default SystemCalendar;
