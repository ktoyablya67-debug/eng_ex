import { Link } from 'react-router-dom';
import { Award, BookMarked, BookOpenCheck, PencilLine, Play, TriangleAlert, Zap } from 'lucide-react';
import { ReadinessCard } from '../components/ReadinessCard';
import { useStudy } from '../app/StudyContext';

const quickActions = [
  { to: '/learn', label: 'Заучивание', hint: 'Партиями', icon: BookOpenCheck, featured: true },
  { to: '/cards', label: 'Карточки', hint: 'Вспомнить', icon: BookMarked },
  { to: '/written-test', label: 'Тест', hint: 'Написать', icon: PencilLine },
  { to: '/blitz', label: 'Блиц', hint: 'Проверить', icon: Zap },
  { to: '/exam-mode', label: 'Экзамен', hint: '10 минут', icon: Award },
];

function getRecommendation(stats: ReturnType<typeof useStudy>['stats'], weakCount: number) {
  if (stats.readiness >= 70) {
    return {
      title: 'Запусти экзамен-режим',
      text: 'Готовность уже высокая. Проверь слабые места в быстром сценарии.',
      to: '/exam-mode',
      icon: Award,
    };
  }

  if (weakCount > 0 && stats.studied > 10) {
    return {
      title: 'Повтори слабые',
      text: `${weakCount} терминов требуют внимания. Лучше закрыть их до новых.`,
      to: '/weak-spots',
      icon: TriangleAlert,
    };
  }

  if (stats.studied > 0) {
    return {
      title: 'Переходи к письменному тесту',
      text: 'Узнавание уже началось. Теперь закрепи точное написание.',
      to: '/written-test',
      icon: PencilLine,
    };
  }

  return {
    title: 'Начни с заучивания',
    text: 'Учить все 99 сразу не нужно. Начни с маленькой партии.',
    to: '/learn',
    icon: BookOpenCheck,
  };
}

export function HomePage() {
  const { stats, weakTerms } = useStudy();
  const recommendation = getRecommendation(stats, weakTerms.length);

  return (
    <div className="page home-page">
      <section className="home-hero">
        <h1>IT-аббревиатуры</h1>
        <p>Быстро выучить, узнать и написать расшифровки перед экзаменом.</p>
      </section>

      <ReadinessCard stats={stats} />

      <section className="home-section">
        <div className="home-section__title">
          <h2>Быстрый старт</h2>
        </div>
        <div className="quick-action-grid">
          {quickActions.map((item) => (
            <Link
              className={`quick-action ${item.featured ? 'quick-action--featured' : ''}`}
              key={item.to}
              to={item.to}
            >
              <item.icon aria-hidden="true" size={22} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="recommendation-card">
        <div className="recommendation-card__icon">
          <recommendation.icon aria-hidden="true" size={22} />
        </div>
        <div>
          <span className="eyebrow">Что сейчас</span>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.text}</p>
        </div>
        <Link className="button recommendation-card__button" to={recommendation.to}>
          <Play aria-hidden="true" size={18} />
          Открыть
        </Link>
      </section>

      <section className="compact-stats-row" aria-label="Краткая статистика">
        <span>Всего {stats.total}</span>
        <span>Видела {stats.studied}</span>
        <span>Слабые {stats.weak}</span>
      </section>
    </div>
  );
}
