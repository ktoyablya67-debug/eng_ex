import { ProgressStats } from '../types';

export function ReadinessCard({ stats }: { stats: ProgressStats }) {
  return (
    <section className="readiness-card" aria-label="Готовность к экзамену">
      <div className="readiness-card__head">
        <div>
          <span className="eyebrow">Готовность</span>
          <div className="readiness-card__score">{stats.readiness}%</div>
        </div>
        <div className="readiness-card__status">{stats.readinessStatus}</div>
      </div>

      <div className="readiness-card__bar">
        <div className="readiness-card__fill" style={{ width: `${stats.readiness}%` }} />
      </div>

      <p>{stats.readinessAdvice}</p>

      <div className="readiness-card__stats">
        <span>Освоено {stats.mastered}</span>
        <span>В процессе {stats.almost}</span>
        <span>Слабые {stats.weak}</span>
      </div>
    </section>
  );
}
