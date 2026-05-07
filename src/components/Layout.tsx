import { Outlet } from 'react-router-dom';
import { DesktopNav } from './DesktopNav';
import { MobileBottomNav } from './MobileBottomNav';

export function Layout() {
  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <DesktopNav />
      <main className="main-content">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
