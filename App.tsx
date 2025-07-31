
import React, { useState, useCallback } from 'react';
import './styles/animations.css';
import { Page } from './types';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import ExploreFeed from './components/ExploreFeed';
import WatchPage from './components/WatchPage';
import CreatorUpload from './components/CreatorUpload';
import CreatorDashboard from './components/CreatorDashboard';
import WalletProfile from './components/WalletProfile'; // Keep for now, might be removed later
import CreatorProfile from './components/CreatorProfile'; // Import new CreatorProfile
import CreatorRegistrationForm from './components/CreatorRegistrationForm'; // Import new CreatorRegistrationForm
import { GovernanceDashboard } from './components/GovernanceDashboard'; // Import governance dashboard
import { RealTimeDataSync } from './components/RealTimeDataSync'; // Import real-time data sync
import ErrorBoundary from './components/ErrorBoundary'; // Import error boundary
import { SocialTestPage } from './components/SocialTestPage'; // Import social test page
import { GamificationDashboard } from './components/GamificationDashboard'; // Import gamification dashboard
import AdminPanel from './components/admin/AdminPanel'; // Import admin panel for video management
// Temporarily commented out to fix import issues
// import { NotificationProvider } from './components/NotificationSystem'; // Import notification system

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false); // State for modal
  const [isNavigating, setIsNavigating] = useState(false); // Add navigation lock

  const navigate = useCallback((page: Page) => {
    // Prevent navigation if already on the same page or currently navigating
    if (page === currentPage || isNavigating) return;
    
    console.log(`Navigating from ${currentPage} to ${page}`);
    
    // Set navigation lock
    setIsNavigating(true);
    
    // Use requestAnimationFrame for smoother navigation
    requestAnimationFrame(() => {
      try {
        setCurrentPage(page);
        window.scrollTo(0, 0);
        console.log(`Navigation to ${page} completed`);
      } catch (error) {
        console.error('Navigation error:', error);
      } finally {
        // Release navigation lock after a short delay
        setTimeout(() => {
          setIsNavigating(false);
        }, 100);
      }
    });
  }, [currentPage, isNavigating]);

  const handleRegistrationSuccess = useCallback(() => {
    setShowRegistrationModal(false);
    navigate(Page.CreatorProfile); // Navigate to creator profile after registration
  }, [navigate]);

  const renderPage = () => {
    try {
      switch (currentPage) {
        case Page.Landing:
          return <LandingPage onNavigate={navigate} />;
        case Page.Explore:
          return <ExploreFeed onNavigate={navigate} />;
        case Page.Watch:
          return <WatchPage onNavigate={navigate} />;
        case Page.Upload:
          return <CreatorUpload onNavigate={navigate} />;
        case Page.Dashboard:
          return <CreatorDashboard onNavigate={navigate} />;
        case Page.Profile: // This will now show WalletProfile
          return <WalletProfile />;
        case Page.CreatorProfile: // New case for CreatorProfile
          return <CreatorProfile />;
        case Page.Governance: // New case for Governance
          return <GovernanceDashboard />;
        case Page.SocialTest: // New case for Social Test
          return <SocialTestPage />;
        case Page.Gamification: // New case for Gamification
          return <GamificationDashboard />;
        case Page.Admin: // New case for Admin Panel
          return <AdminPanel />;
        default:
          return <LandingPage onNavigate={navigate} />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <p className="text-text-secondary mb-4">There was an error loading this page.</p>
        <button 
          onClick={() => navigate(Page.Landing)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Go to Home
        </button>
      </div>;
    }
  };

  return (
    <ErrorBoundary>
      {/* Temporarily removed NotificationProvider to fix import issues */}
      <RealTimeDataSync>
        <div className="min-h-screen bg-background">
          {currentPage !== Page.Landing && currentPage !== Page.Watch && (
            <Header
              onNavigate={navigate}
              currentPage={currentPage}
              onOpenRegistrationModal={() => setShowRegistrationModal(true)} // Pass setter to Header
              isWatchPage={currentPage === Page.Watch} // Pass watch page detection
            />
          )}
          <main>{renderPage()}</main>
          {showRegistrationModal && (
            <CreatorRegistrationForm
              onRegistrationSuccess={handleRegistrationSuccess}
              onClose={() => setShowRegistrationModal(false)}
            />
          )}
        </div>
      </RealTimeDataSync>
    </ErrorBoundary>
  );
};

export default App;
