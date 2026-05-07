import { Term, TermProgress } from '../types';

const statusText = {
  new: 'Ещё не проходила',
  know: 'Знаю',
  confuse: 'Путаю',
  dontknow: 'Не знаю',
};

export function TermCard({
  term,
  progress,
  extra,
}: {
  term: Term;
  progress: TermProgress;
  extra?: React.ReactNode;
}) {
  return (
    <article className="term-card">
      <div className="term-card__head">
        <div>
          <strong>{term.abbr}</strong>
          {term.answers.length > 1 && <span className="term-tag">2 значения</span>}
        </div>
        <span className={`status-pill status-pill--${progress.status}`}>{statusText[progress.status]}</span>
      </div>

      <p className="term-card__answer">{term.answers.join(' / ')}</p>
      <p className="term-card__translation">{term.translation}</p>

      <div className="term-card__meta">
        <span>ошибки {Math.round(progress.mistakes)}</span>
        <span>успехи {progress.successes}</span>
        {extra}
      </div>
    </article>
  );
}
