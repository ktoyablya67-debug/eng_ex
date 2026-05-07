import { useEffect, useState } from 'react';
import { ProgressMap, StudyStatus, Term } from '../types';

interface CardTrainerProps {
  terms: Term[];
  progress: ProgressMap;
  title: string;
  subtitle: string;
  sessionLength?: number;
  compact?: boolean;
  onRate: (termId: string, status: Exclude<StudyStatus, 'new'>) => void;
  onExit: () => void;
  onComplete?: () => void;
}

const statusLabels: Record<Exclude<StudyStatus, 'new'>, string> = {
  know: 'Знаю',
  confuse: 'Путаю',
  dontknow: 'Не знаю',
};

const statusWeights: Record<StudyStatus, number> = {
  new: 2,
  know: 1,
  confuse: 3,
  dontknow: 4,
};

const displayAnswer = (term: Term) =>
  term.answers.length > 1 ? term.answers.join(' / ') : term.answers[0];

const pickWeightedTerm = (
  terms: Term[],
  progress: ProgressMap,
  previousId?: string,
): Term | null => {
  if (terms.length === 0) {
    return null;
  }

  const pool = terms.flatMap((term) => {
    const item = progress[term.id];
    const baseWeight = item
      ? Math.min(6, statusWeights[item.status] + item.mistakes + item.repeatLater)
      : 2;

    return Array.from({ length: Math.max(baseWeight, 1) }, () => term);
  });

  const filteredPool = pool.filter((term) => term.id !== previousId);
  const source = filteredPool.length > 0 ? filteredPool : pool;
  return source[Math.floor(Math.random() * source.length)];
};

export function CardTrainer({
  terms,
  progress,
  title,
  subtitle,
  sessionLength = 20,
  compact = false,
  onRate,
  onExit,
  onComplete,
}: CardTrainerProps) {
  const [currentTerm, setCurrentTerm] = useState<Term | null>(() => pickWeightedTerm(terms, progress));
  const [revealed, setRevealed] = useState(false);
  const [pendingRating, setPendingRating] = useState<Exclude<StudyStatus, 'new'> | null>(null);
  const [completed, setCompleted] = useState(0);

  const nextCard = () => {
    if (completed + (pendingRating ? 1 : 0) >= sessionLength && onComplete) {
      onComplete();
      return;
    }

    setCompleted((value) => value + (pendingRating ? 1 : 0));
    setCurrentTerm((term) => pickWeightedTerm(terms, progress, term?.id));
    setPendingRating(null);
    setRevealed(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!pendingRating) {
          setRevealed((value) => !value);
          return;
        }

        nextCard();
      }

      if (!revealed || pendingRating) {
        return;
      }

      if (!currentTerm) {
        return;
      }

      if (event.key === '1') {
        onRate(currentTerm.id, 'know');
        setPendingRating('know');
      }

      if (event.key === '2') {
        onRate(currentTerm.id, 'confuse');
        setPendingRating('confuse');
      }

      if (event.key === '3') {
        onRate(currentTerm.id, 'dontknow');
        setPendingRating('dontknow');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTerm?.id, onRate, pendingRating, revealed]);

  if (terms.length === 0 || !currentTerm) {
    return (
      <section className="panel trainer-empty">
        <h3>Сейчас слабых терминов нет</h3>
        <p>Сначала пройди карточки или письменный тест, чтобы система собрала проблемные места.</p>
        <button className="button" onClick={onExit} type="button">
          Назад
        </button>
      </section>
    );
  }

  const doneCount = completed + (pendingRating ? 1 : 0);

  return (
    <section className={`panel trainer-panel ${compact ? 'trainer-panel--compact' : ''}`}>
      <header className="trainer-header">
        <div>
          <span className="eyebrow">Flash Recall</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="trainer-actions">
          <span className="session-badge">
            {Math.min(doneCount, sessionLength)} / {sessionLength}
          </span>
          <button className="button button--ghost" onClick={onExit} type="button">
            Выйти
          </button>
        </div>
      </header>

      <div className="card-stage">
        <button
          aria-label={revealed ? 'Показана расшифровка' : 'Показана аббревиатура'}
          className={`flip-card ${revealed ? 'flip-card--revealed' : ''}`}
          onClick={() => {
            if (!pendingRating) {
              setRevealed((value) => !value);
            }
          }}
          type="button"
        >
          <div className="flip-card__inner">
            <div className="flip-card__face flip-card__face--front">
              <span className="flip-card__label">Abbreviation</span>
              <div className="card-stage__abbr">{currentTerm.abbr}</div>
              <p className="flip-card__hint">Нажми на карточку или `Space`, чтобы переворачивать её туда-сюда.</p>
            </div>

            <div className="flip-card__face flip-card__face--back">
              <span className="flip-card__label">Expansion</span>
              <div className="answer-reveal__text">{displayAnswer(currentTerm)}</div>
              <div className="flip-card__translation">
                <strong>{currentTerm.translation}</strong>
                <span>{currentTerm.memoryHint}</span>
              </div>
              {currentTerm.answers.length > 1 && (
                <div className="dual-term-badge">Двойной термин: допустимы оба значения</div>
              )}
              <p className="flip-card__hint">Переворачивай карту столько раз, сколько нужно для быстрого узнавания.</p>
            </div>
          </div>
        </button>

        <div className="card-controls">
          {!revealed ? (
            <p className="trainer-tip">Формат как в Quizlet: карта переворачивается и только потом ты фиксируешь результат.</p>
          ) : (
            <>
              <div className="status-row">
                {(['know', 'confuse', 'dontknow'] as const).map((status, index) => (
                  <button
                    key={status}
                    className={`button status-button status-button--${status}`}
                    disabled={Boolean(pendingRating)}
                    onClick={() => {
                      onRate(currentTerm.id, status);
                      setPendingRating(status);
                    }}
                    type="button"
                  >
                    {index + 1}. {statusLabels[status]}
                  </button>
                ))}
              </div>

              {pendingRating ? (
                <div className="feedback-strip">
                  <span>
                    Отмечено: <strong>{statusLabels[pendingRating]}</strong>
                  </span>
                  <button className="button button--ghost" onClick={nextCard} type="button">
                    Space — следующая карточка
                  </button>
                </div>
              ) : (
                <p className="trainer-tip">Сначала оцени ответ: 1 — знаю, 2 — путаю, 3 — не знаю.</p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
