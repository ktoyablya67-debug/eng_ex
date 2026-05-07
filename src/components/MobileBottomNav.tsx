import { Link, useLocation } from 'react-router-dom';
import { BookOpenCheck, Home, Menu, PencilLine, Zap } from 'lucide-react';

const primaryLinks = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/learn', label: 'Учить', icon: BookOpenCheck },
  { to: '/written-test', label: 'Тест', icon: PencilLine },
  { to: '/blitz', label: 'Блиц', icon: Zap },
  { to: '/more', label: 'Ещё', icon: Menu },
];

const moreRoutes = new Set(['/more', '/cards', '/exam-mode', '/weak-spots', '/terms', '/stats']);

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {primaryLinks.map((link) => {
        const isMore = link.to === '/more';
        const isActive = isMore ? moreRoutes.has(pathname) : pathname === link.to;

        return (
          <Link
            key={link.to}
            className={`mobile-bottom-nav__item ${isActive ? 'is-active' : ''}`}
            to={link.to}
          >
            <link.icon aria-hidden="true" size={20} strokeWidth={2.2} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
