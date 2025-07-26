
import React, { useState, useCallback } from 'react';
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
// Temporarily commented out to fix import issues
// import { NotificationProvider } from './components/NotificationSystem'; // Import notification system

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false); // State for modal

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const handleRegistrationSuccess = useCallback(() => {
    setShowRegistrationModal(false);
    navigate(Page.CreatorProfile); // Navigate to creator profile after registration
  }, [navigate]);

  const renderPage = () => {
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
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <ErrorBoundary>
      {/* Temporarily removed NotificationProvider to fix import issues */}
      <RealTimeDataSync>
        <div className="min-h-screen bg-background">
          {currentPage !== Page.Landing && (
            <Header
              onNavigate={navigate}
              currentPage={currentPage}
              onOpenRegistrationModal={() => setShowRegistrationModal(true)} // Pass setter to Header
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
