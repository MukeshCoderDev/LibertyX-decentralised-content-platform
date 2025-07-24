
import React, { useState, useCallback } from 'react';
import { Page } from './types';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import ExploreFeed from './components/ExploreFeed';
import WatchPage from './components/WatchPage';
import CreatorUpload from './components/CreatorUpload';
import CreatorDashboard from './components/CreatorDashboard';
import WalletProfile from './components/WalletProfile';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

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
      case Page.Profile:
        return <WalletProfile />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {currentPage !== Page.Landing && <Header onNavigate={navigate} currentPage={currentPage} />}
      <main>{renderPage()}</main>
    </div>
  );
};

export default App;
