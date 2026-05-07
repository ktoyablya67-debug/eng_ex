import { Link, useNavigate } from 'react-router-dom';
import { TermCard } from '../components/TermCard';
import { useStudy } from '../app/StudyContext';

export function WeakSpotsPage() {
  const { progress, weakTerms } = useStudy();
  const navigate = useNavigate();

  return (
    <div className="page">
      <section className="page-header">
        <span className="eyebrow">Weak spots</span>
        <h1>Слабые места</h1>
        <p>Не таблица, а компактные карточки: что чаще всего ломается, то и поднимаем наверх.</p>
      </section>

      <section className="trainer-card">
        <div className="action-row">
          <button className="button" onClick={() => navigate('/cards')} type="button">
            Повторить карточками
          </button>
          <button className="button button--secondary" onClick={() => navigate('/written-test')} type="button">
            Добрать письменно
          </button>
          <button className="button button--ghost" onClick={() => navigate('/blitz')} type="button">
            Добить блицем
          </button>
        </div>
      </section>

      <section className="term-list">
        {weakTerms.length === 0 ? (
          <div className="trainer-card empty-state">
            <h3>Пока чисто</h3>
            <p>Сначала пройди несколько циклов карточек, письменного теста или блица, и список ошибок появится здесь.</p>
          </div>
        ) : (
          weakTerms.map(({ term, score }) => (
            <TermCard
              key={term.id}
              term={term}
              progress={progress[term.id]}
              extra={
                <>
                  <span>priority {score}</span>
                  <span>
                    последняя ошибка{' '}
                    {progress[term.id].lastMistakeAt
                      ? new Date(progress[term.id].lastMistakeAt as number).toLocaleDateString()
                      : '—'}
                  </span>
                </>
              }
            />
          ))
        )}
      </section>

      <Link className="floating-cta" to="/exam-mode">
        Экзамен-режим
      </Link>
    </div>
  );
}
