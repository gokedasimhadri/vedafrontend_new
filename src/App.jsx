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
import { centralApi } from './api/centralApi';
import './styles/veda.css';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedEventForDetails, setSelectedEventForDetails] = useState(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState(null);

  // Load real backend data on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, evts] = await Promise.all([
        centralApi.getVedaCategories(),
        centralApi.getVedaEvents()
      ]);
      setCategories(cats || []);
      setEvents(evts || []);
    } catch (err) {
      console.error('Error fetching VEDA backend data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={darkMode ? 'dark-theme' : ''}>
      {/* Global Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page === 'events') {
            setSelectedCategory(null); // Show EXPLORE EVENTS landing view first
          }
        }}
        onRegisterClick={() => {
          if (events.length > 0) {
            setSelectedEventForRegister(events[0]);
          } else {
            setActivePage('events');
            setSelectedCategory(null);
          }
        }}
      />

      {/* Main Content Area - Multi-Page View Routing */}
      <main>
        {activePage === 'home' && (
          <HomePage
            events={events}
            categories={categories}
            onNavigate={(page) => {
              setActivePage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              setActivePage('events');
            }}
            onViewDetails={(evt) => setSelectedEventForDetails(evt)}
            onRegister={(evt) => setSelectedEventForRegister(evt)}
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
            onViewDetails={(evt) => setSelectedEventForDetails(evt)}
            onRegister={(evt) => setSelectedEventForRegister(evt)}
          />
        )}

        {activePage === 'schedule' && (
          <SchedulePage events={events} />
        )}

        {activePage === 'team' && (
          <TeamPage categories={categories} events={events} />
        )}

        {activePage === 'gallery' && (
          <GalleryPage />
        )}

        {activePage === 'contact' && (
          <ContactPage />
        )}
      </main>

      {/* Global Footer */}
      <Footer categories={categories} />

      {/* Details & Registration Modals */}
      {selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          onClose={() => setSelectedEventForDetails(null)}
          onRegister={(evt) => setSelectedEventForRegister(evt)}
        />
      )}

      {selectedEventForRegister && (
        <RegistrationModal
          event={selectedEventForRegister}
          onClose={() => setSelectedEventForRegister(null)}
        />
      )}
    </div>
  );
}
