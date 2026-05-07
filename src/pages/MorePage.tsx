import { Link } from 'react-router-dom';
import { Award, BarChart3, BookMarked, RotateCcw, Search, TriangleAlert } from 'lucide-react';
import { useStudy } from '../app/StudyContext';
import { resetLearnStorage } from '../features/learn/learnStorage';

const moreLinks = [
  { to: '/exam-mode', label: 'Экзамен', hint: 'Быстрый прогон перед зачётом', icon: Award },
  { to: '/weak-spots', label: 'Слабые', hint: 'Ошибки и повторение', icon: TriangleAlert },
  { to: '/terms', label: 'Термины', hint: 'Поиск по всему списку', icon: Search },
  { to: '/stats', label: 'Статистика', hint: 'Точность и прогресс', icon: BarChart3 },
  { to: '/cards', label: 'Карточки', hint: 'Классическое повторение', icon: BookMarked },
];

export function MorePage() {
  const { resetAll } = useStudy();
  const handleReset = () => {
    resetAll();
    resetLearnStorage();
  };

  return (
    <div className="page more-page">
      <section className="home-hero">
        <h1>Ещё</h1>
        <p>Дополнительные режимы и управление прогрессом.</p>
      </section>

      <section className="more-list">
        {moreLinks.map((item) => (
          <Link className="more-link" key={item.to} to={item.to}>
            <item.icon aria-hidden="true" size={22} />
            <span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
          </Link>
        ))}
        <button className="more-link more-link--danger" onClick={handleReset} type="button">
          <RotateCcw aria-hidden="true" size={22} />
          <span>
            <strong>Сбросить</strong>
            <small>Очистить учебный прогресс</small>
          </span>
        </button>
      </section>
    </div>
  );
}
