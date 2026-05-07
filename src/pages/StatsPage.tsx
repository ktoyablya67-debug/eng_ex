import { ProgressSummary } from '../components/ProgressSummary';
import { useStudy } from '../app/StudyContext';

export function StatsPage() {
  const { stats, getStatusCount, progress } = useStudy();
  const totalErrors = Object.values(progress).reduce((sum, item) => sum + item.mistakes, 0);

  return (
    <div className="page">
      <section className="page-header">
        <span className="eyebrow">Statistics</span>
        <h1>Статистика</h1>
        <p>Здесь только полезные цифры: готовность, точность письма, слабые зоны и статус по всем терминам.</p>
      </section>

      <ProgressSummary stats={stats} />

      <section className="stats-grid">
        <article className="stat-card">
          <span>Знаю</span>
          <strong>{getStatusCount('know')}</strong>
        </article>
        <article className="stat-card">
          <span>Путаю</span>
          <strong>{getStatusCount('confuse')}</strong>
        </article>
        <article className="stat-card">
          <span>Не знаю</span>
          <strong>{getStatusCount('dontknow')}</strong>
        </article>
        <article className="stat-card">
          <span>Ещё не проходила</span>
          <strong>{getStatusCount('unseen')}</strong>
        </article>
        <article className="stat-card">
          <span>Точность письменных</span>
          <strong>{stats.writtenAccuracy}%</strong>
        </article>
        <article className="stat-card stat-card--danger">
          <span>Ошибок всего</span>
          <strong>{Math.round(totalErrors)}</strong>
        </article>
        <article className="stat-card">
          <span>Серия правильных</span>
          <strong>{stats.streak}</strong>
        </article>
        <article className="stat-card">
          <span>Готовность</span>
          <strong>{stats.readiness}%</strong>
        </article>
      </section>
    </div>
  );
}
