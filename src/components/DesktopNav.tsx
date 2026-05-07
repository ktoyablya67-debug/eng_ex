import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Главная' },
  { to: '/learn', label: 'Заучивание' },
  { to: '/cards', label: 'Карточки' },
  { to: '/written-test', label: 'Тест' },
  { to: '/blitz', label: 'Блиц' },
  { to: '/exam-mode', label: 'Экзамен' },
  { to: '/weak-spots', label: 'Слабые' },
  { to: '/terms', label: 'Термины' },
  { to: '/stats', label: 'Статистика' },
];

export function DesktopNav() {
  return (
    <header className="desktop-nav">
      <div className="desktop-nav__inner">
        <NavLink className="brand-mark" to="/">
          Memory Control Room
        </NavLink>
        <nav className="desktop-nav__links" aria-label="Desktop navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) => `desktop-nav__link ${isActive ? 'is-active' : ''}`}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
