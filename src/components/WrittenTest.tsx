import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnswerComparison, ProgressMap, Term } from '../types';
import { buildHint, compareAnswer } from '../utils/answerCheck';

interface WrittenTestProps {
  terms: Term[];
  progress: ProgressMap;
  title: string;
  subtitle: string;
  sessionLength?: number;
  compact?: boolean;
  onJudged: (termId: string, comparison: AnswerComparison, repeatLater: boolean) => void;
  onExit: () => void;
  onOpenWeakSpots?: () => void;
  onComplete?: () => void;
}

const displayAnswers = (term: Term) => term.answers.join(' / ');

const pickWeightedTerm = (terms: Term[], progress: ProgressMap, excludeId?: string): Term | null => {
  if (terms.length === 0) {
    return null;
  }

  const pool = terms.flatMap((term) => {
    const item = progress[term.id];
    const weight = item ? Math.min(7, 2 + item.mistakes + item.repeatLater) : 2;
    return Array.from({ length: weight }, () => term);
  });
  const candidates = pool.filter((term) => term.id !== excludeId);
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
};

export function WrittenTest({
  terms,
  progress,
  title,
  subtitle,
  sessionLength = 12,
  compact = false,
  onJudged,
  onExit,
  onOpenWeakSpots,
  onComplete,
}: WrittenTestProps) {
  const [currentTerm, setCurrentTerm] = useState<Term | null>(() => pickWeightedTerm(terms, progress));
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerComparison | null>(null);
  const [answered, setAnswered] = useState(0);
  const [repeatLater, setRepeatLater] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentTerm?.id, result]);

  const hint = useMemo(() => buildHint(currentTerm?.answers[0] ?? ''), [currentTerm]);

  if (terms.length === 0 || !currentTerm) {
    return (
      <section className="panel trainer-empty">
        <h3>Пока не из чего собирать письменный добор</h3>
        <p>Сделай несколько попыток в других режимах, и здесь появятся реальные слабые места.</p>
        <button className="button" onClick={onExit} type="button">
          Назад
        </button>
      </section>
    );
  }

  const handleNext = (forceRepeatLater = repeatLater) => {
    if (!result) {
      return;
    }

    onJudged(currentTerm.id, result, forceRepeatLater);
    const nextAnswered = answered + 1;
    if (nextAnswered >= sessionLength && onComplete) {
      onComplete();
      return;
    }

    setAnswered(nextAnswered);
    setCurrentTerm(pickWeightedTerm(terms, progress, currentTerm.id));
    setAnswer('');
    setResult(null);
    setRepeatLater(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || result) {
      return;
    }

    setResult(compareAnswer(answer, currentTerm.answers));
  };

  return (
    <section className={`panel trainer-panel ${compact ? 'trainer-panel--compact' : ''}`}>
      <header className="trainer-header">
        <div>
          <span className="eyebrow">Typing Drill</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="trainer-actions">
          <span className="session-badge">
            {answered} / {sessionLength}
          </span>
          <button className="button button--ghost" onClick={onExit} type="button">
            Выйти
          </button>
        </div>
      </header>

      <div className="written-layout">
        <div className="prompt-tile">
          <span className="eyebrow">Write it clean</span>
          <div className="card-stage__abbr">{currentTerm.abbr}</div>
          {currentTerm.answers.length > 1 && (
            <div className="dual-term-badge">У этого сокращения два правильных значения</div>
          )}
          <p>Не угадывай форму. Пиши полную английскую расшифровку и смотри разбор ошибки сразу под полем.</p>
        </div>

        <form className="written-form" onSubmit={submit}>
          <label>
            <span>Твой ответ</span>
            <input
              ref={inputRef}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type the full expansion"
              type="text"
            />
          </label>

          {!result ? (
            <button className="button" type="submit">
              Проверить
            </button>
          ) : (
            <div className={`written-feedback written-feedback--${result.verdict}`}>
              <div className="feedback-headline">
                <strong>
                  {result.verdict === 'correct'
                    ? 'Точно'
                    : result.verdict === 'almost'
                      ? 'Почти, но фиксируем'
                      : 'Ошибка'}
                </strong>
                <span>Ошиблась здесь — значит, завтра не ошибёшься.</span>
              </div>

              <div className="feedback-comparison">
                <div>
                  <span>Что написано</span>
                  <p>{answer}</p>
                </div>
                <div>
                  <span>Правильный вариант</span>
                  <p>{displayAnswers(currentTerm)}</p>
                </div>
              </div>

              {result.differences.length > 0 && (
                <div className="diff-list">
                  {result.differences.map((difference, index) => (
                    <div className="diff-chip" key={`${difference.expected}-${difference.actual}-${index}`}>
                      <span>{difference.actual}</span>
                      <strong>{difference.expected}</strong>
                    </div>
                  ))}
                </div>
              )}

              {(result.verdict === 'incorrect' || result.verdict === 'almost') && (
                <>
                  <div className="hint-box">
                    <span>Подсказка</span>
                    <p>{hint}</p>
                  </div>
                  <label className="repeat-toggle">
                    <input
                      checked={repeatLater}
                      onChange={(event) => setRepeatLater(event.target.checked)}
                      type="checkbox"
                    />
                    <span>Повторить позже</span>
                  </label>
                </>
              )}

              <div className="action-row">
                <button className="button" onClick={() => handleNext()} type="button">
                  Следующий
                </button>
                <button className="button button--secondary" onClick={() => handleNext(true)} type="button">
                  Повторить позже
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => {
                    handleNext(true);
                    onOpenWeakSpots?.();
                  }}
                  type="button"
                >
                  В слабые
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
