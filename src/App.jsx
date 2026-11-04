import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import SchedulePage from './pages/SchedulePage';
import TeamPage from './pages/TeamPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import EventDetailsModal from './components/EventDetailsModal';
import RegistrationModal from './components/RegistrationModal';
import EventDetailPage from './pages/EventDetailPage';
import StudentLoginModal from './components/StudentLoginModal';
import MyRegistrationsPage from './pages/MyRegistrationsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { centralApi, isEventRegisteredByStudent } from './api/centralApi';
import './styles/veda.css';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student auth state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('veda_student');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track student's registered events
  const [userRegistrations, setUserRegistrations] = useState(() => {
    try {
      const saved = localStorage.getItem('veda_student_registrations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingEventForRegister, setPendingEventForRegister] = useState(null);

  // Modals state
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]);

  // Fetch student's registrations to accurately detect already registered events
  const loadUserRegistrations = async (user = currentUser) => {
    const rollOrId = user?.roll || user?.rollNumber || user?._id;
    if (!rollOrId) {
      setUserRegistrations([]);
      localStorage.removeItem('veda_student_registrations');
      return;
    }
    try {
      const currentEventType = (import.meta.env.VITE_EVENT_TYPE || 'VEDA').toUpperCase();
      const currentAcademicYear = (import.meta.env.VITE_EVENT_ACADEMIC_YEAR || '2026-2027').trim();
      const list = await centralApi.getStudentRegistrationsWithPayments(rollOrId, currentEventType, currentAcademicYear);
      const safeList = Array.isArray(list) ? list : [];
      setUserRegistrations(safeList);
      try {
        localStorage.setItem('veda_student_registrations', JSON.stringify(safeList));
      } catch {
        // quota fallback
      }
    } catch (err) {
      console.error('Failed to load user registrations in App:', err);
    }
  };

  useEffect(() => {
    loadUserRegistrations();
  }, [currentUser]);

  // Load real backend data on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, evts, comm] = await Promise.all([
        centralApi.getVedaCategories(),
        centralApi.getVedaEvents(),
        centralApi.getOrganisationCommittee()
      ]);
      setCategories(cats || []);
      setEvents(evts || []);
      setCommitteeMembers(comm || []);
    } catch (err) {
      console.error('Error fetching VEDA backend data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenMyPasses = () => {
    setActivePage('my-passes');
    setSelectedEventForDetails(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Intercept registration to require login or redirect if already registered
  const handleInitiateRegister = (evt) => {
    const targetEvent = evt || (events.length > 0 ? events[0] : null);
    if (!targetEvent) return;

    if (!currentUser) {
      setPendingEventForRegister(targetEvent);
      setShowLoginModal(true);
      return;
    }

    // If already registered by this student, navigate directly to My Passes
    if (isEventRegisteredByStudent(targetEvent, userRegistrations)) {
      handleOpenMyPasses();
      return;
    }

    setSelectedEventForRegister(targetEvent);
  };

  const handleLoginSuccess = (student) => {
    setCurrentUser(student);
    loadUserRegistrations(student);
    if (pendingEventForRegister) {
      if (isEventRegisteredByStudent(pendingEventForRegister, userRegistrations)) {
        handleOpenMyPasses();
      } else {
        setSelectedEventForRegister(pendingEventForRegister);
      }
      setPendingEventForRegister(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('veda_student');
    localStorage.removeItem('veda_student_registrations');
    setCurrentUser(null);
    setUserRegistrations([]);
  };

  return (
    <div className={darkMode ? 'dark-theme' : ''}>
      {/* Global Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          setSelectedEventForDetails(null);
          if (page === 'events') {
            setSelectedCategory(null); // Show EXPLORE EVENTS landing view first
          }
        }}
        onRegisterClick={() => handleInitiateRegister(events[0])}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogoutClick={handleLogout}
        onMyPassesClick={handleOpenMyPasses}
      />

      {/* Main Content Area - Multi-Page View Routing */}
      <main>
        {selectedEventForDetails ? (
          <EventDetailPage
            event={selectedEventForDetails}
            committeeMembers={committeeMembers}
            userRegistrations={userRegistrations}
            onBack={() => {
              setSelectedEventForDetails(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRegister={(evt) => handleInitiateRegister(evt)}
            onMyPassesClick={handleOpenMyPasses}
          />
        ) : (
          <>
            {activePage === 'home' && (
              <HomePage
                events={events}
                categories={categories}
                userRegistrations={userRegistrations}
                onNavigate={(page) => {
                  setActivePage(page);
                  setSelectedEventForDetails(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId);
                  setActivePage('events');
                  setSelectedEventForDetails(null);
                }}
                onViewDetails={(evt) => {
                  setSelectedEventForDetails(evt);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRegister={(evt) => handleInitiateRegister(evt)}
                onMyPassesClick={handleOpenMyPasses}
              />
            )}

            {activePage === 'events' && (
              <EventsPage
                events={events}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                userRegistrations={userRegistrations}
                loading={loading}
                onRefresh={() => {
                  loadData();
                  loadUserRegistrations();
                }}
                onViewDetails={(evt) => {
                  setSelectedEventForDetails(evt);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRegister={(evt) => handleInitiateRegister(evt)}
                onMyPassesClick={handleOpenMyPasses}
              />
            )}

            {activePage === 'schedule' && (
              <SchedulePage events={events} />
            )}

            {activePage === 'team' && (
              <TeamPage categories={categories} events={events} committeeMembers={committeeMembers} />
            )}

            {activePage === 'gallery' && (
              <GalleryPage />
            )}

            {activePage === 'contact' && (
              <ContactPage />
            )}

            {activePage === 'my-passes' && currentUser && (
              <ErrorBoundary>
                <MyRegistrationsPage
                  currentUser={currentUser}
                  events={events}
                  onRegistrationUpdated={() => loadUserRegistrations()}
                  onRegisterMore={() => {
                    setActivePage('events');
                    setSelectedCategory(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </ErrorBoundary>
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer categories={categories} />

      {/* Registration Modal */}
      {selectedEventForRegister && (
        <RegistrationModal
          event={selectedEventForRegister}
          currentUser={currentUser}
          userRegistrations={userRegistrations}
          onClose={() => setSelectedEventForRegister(null)}
          onRequestLogin={() => setShowLoginModal(true)}
          onSuccess={() => {
            setSelectedEventForRegister(null);
            loadUserRegistrations();
            handleOpenMyPasses();
          }}
        />
      )}

      {/* Student Login & Sign Up Modal */}
      <StudentLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingEventForRegister(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        defaultMode="signup"
      />
    </div>
  );
}
