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
import { centralApi } from './api/centralApi';
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingEventForRegister, setPendingEventForRegister] = useState(null);

  // Modals state
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]);

  // Load real backend data on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, evts, comm] = await Promise.all([
        centralApi.getVedaCategories(),
        centralApi.getVedaEvents(),
        centralApi.getOrganisationCommittee('VEDA')
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

  // Intercept registration to require login
  const handleInitiateRegister = (evt) => {
    const targetEvent = evt || (events.length > 0 ? events[0] : null);
    if (!targetEvent) return;

    if (!currentUser) {
      setPendingEventForRegister(targetEvent);
      setShowLoginModal(true);
    } else {
      setSelectedEventForRegister(targetEvent);
    }
  };

  const handleLoginSuccess = (student) => {
    setCurrentUser(student);
    if (pendingEventForRegister) {
      setSelectedEventForRegister(pendingEventForRegister);
      setPendingEventForRegister(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('veda_student');
    setCurrentUser(null);
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
      />

      {/* Main Content Area - Multi-Page View Routing */}
      <main>
        {selectedEventForDetails ? (
          <EventDetailPage
            event={selectedEventForDetails}
            committeeMembers={committeeMembers}
            onBack={() => {
              setSelectedEventForDetails(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRegister={(evt) => handleInitiateRegister(evt)}
          />
        ) : (
          <>
            {activePage === 'home' && (
              <HomePage
                events={events}
                categories={categories}
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
              />
            )}

            {activePage === 'events' && (
              <EventsPage
                events={events}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                loading={loading}
                onRefresh={loadData}
                onViewDetails={(evt) => {
                  setSelectedEventForDetails(evt);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRegister={(evt) => handleInitiateRegister(evt)}
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
          onClose={() => setSelectedEventForRegister(null)}
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
      />
    </div>
  );
}
