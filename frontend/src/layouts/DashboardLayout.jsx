import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import NotificationToast from '../components/NotificationToast';
import AgentSimulationModal from '../components/AgentSimulationModal';
import DemoGuideModal from '../components/DemoGuideModal';
import GlobalModals from '../components/modals/GlobalModals';
import { ChevronRight } from 'lucide-react';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('oist_sidebar_open');
    if (saved !== null) return saved === 'true';
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [demoGuideOpen, setDemoGuideOpen] = useState(false);
  const location = useLocation();

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('oist_sidebar_open', String(next));
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('oist_sidebar_open', 'false');
  };

  // Touch Swipe Gesture Detection for Slidable Sidebar (Mobile & Touch screens)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // If horizontal swipe is dominant
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
        if (diffX > 0 && touchStartX < 50 && !isSidebarOpen) {
          // Swiped right from left screen edge -> Slide sidebar open
          setIsSidebarOpen(true);
        } else if (diffX < 0 && isSidebarOpen) {
          // Swiped left -> Slide sidebar closed
          setIsSidebarOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);

  return (
    <div className="app-container">
      {/* Slidable Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onToggle={handleToggleSidebar}
        onOpenDemoGuide={() => setDemoGuideOpen(true)}
      />

      {/* Floating Edge Slide-Open Tab (when sidebar is slid closed) */}
      {!isSidebarOpen && (
        <button
          onClick={handleToggleSidebar}
          className="floating-slide-tab"
          title="Slide sidebar open"
          aria-label="Slide sidebar open"
        >
          <ChevronRight size={16} />
          <span>MENU</span>
        </button>
      )}

      {/* Main Content Area with fluid width and dynamic shift */}
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        <main style={{ flex: 1, minWidth: 0, width: '100%', overflowX: 'hidden' }}>
          {/* Animated Page Shift Container when any menu item or route is selected */}
          <div key={location.pathname} className="page-shift-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals & Portals */}
      <NotificationToast />
      <AgentSimulationModal />
      <DemoGuideModal isOpen={demoGuideOpen} onClose={() => setDemoGuideOpen(false)} />
      <GlobalModals />
    </div>
  );
}
