import { ProgressStats } from '../types';

export function ProgressSummary({ stats }: { stats: ProgressStats }) {
  return (
    <section className="trainer-card progress-summary">
      <div className="progress-summary__hero">
        <div>
          <span className="eyebrow">Readiness</span>
          <h2>{stats.readiness}% к экзамену</h2>
          <p>Тренируем не узнавание, а вспоминание. Двигай слабые термины наверх и закрывай их короткими циклами.</p>
        </div>
        <div className="readiness-pill">{stats.readiness}%</div>
      </div>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Всего</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card">
          <span>Изучено</span>
          <strong>{stats.studied}</strong>
        </article>
        <article className="stat-card">
          <span>Уверенно знаю</span>
          <strong>{stats.know}</strong>
        </article>
        <article className="stat-card stat-card--danger">
          <span>Слабые</span>
          <strong>{stats.weak}</strong>
        </article>
      </div>
    </section>
  );
}
