import { useEffect, useMemo, useState } from 'react';
import { ProgressMap, Term } from '../types';
import {
  generateDistractors,
  getBlitzAnswer,
  getBlitzPrompt,
  getMemoryHint,
} from '../utils/generateDistractors';

interface BlitzModeProps {
  terms: Term[];
  progress: ProgressMap;
  title: string;
  subtitle: string;
  sessionLength?: number;
  durationSec?: number;
  compact?: boolean;
  onAnswered: (termId: string, correct: boolean) => void;
  onExit: () => void;
  onComplete?: () => void;
}

interface BlitzQuestion {
  term: Term;
  choices: string[];
  correct: string;
  context: string;
}

const buildQuestion = (
  terms: Term[],
  progress: ProgressMap,
  hardMode: boolean,
  previousId?: string,
): BlitzQuestion | null => {
  if (terms.length === 0) {
    return null;
  }

  const weighted = terms.flatMap((term) => {
    const item = progress[term.id];
    const weight = item ? Math.min(7, 1 + item.mistakes + item.repeatLater) : 2;
    return Array.from({ length: weight }, () => term);
  });
  const candidates = weighted.filter((term) => term.id !== previousId);
  const term = (candidates.length > 0 ? candidates : weighted)[
    Math.floor(Math.random() * (candidates.length > 0 ? candidates.length : weighted.length))
  ];

  const correct = getBlitzAnswer(term);
  const prompt = getBlitzPrompt(term);
  const distractors = hardMode
    ? generateDistractors(term, terms)
    : [
        ...generateDistractors(term, terms).slice(0, 2),
        ...terms
          .filter((item) => item.id !== term.id && item.category === term.category)
          .map((item) => getBlitzAnswer(item))
          .filter((item) => item !== correct)
          .slice(0, 1),
      ].slice(0, 3);

  const choices = [correct, ...distractors].sort(() => Math.random() - 0.5);

  return { term, choices, correct, context: prompt.context };
};

export function BlitzMode({
  terms,
  progress,
  title,
  subtitle,
  sessionLength = 12,
  durationSec = 7,
  compact = false,
  onAnswered,
  onExit,
  onComplete,
}: BlitzModeProps) {
  const [hardMode, setHardMode] = useState(true);
  const [question, setQuestion] = useState<BlitzQuestion | null>(() => buildQuestion(terms, progress, true));
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lockedChoice, setLockedChoice] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mistakes, setMistakes] = useState<
    Array<{ term: Term; correct: string; selected: string; hint: string; context: string }>
  >([]);
  const [sessionTerms, setSessionTerms] = useState<Term[]>(terms);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setSessionTerms(terms);
    setQuestion(buildQuestion(terms, progress, hardMode));
    setTimeLeft(durationSec);
    setAnswered(0);
    setCorrectCount(0);
    setLockedChoice(null);
    setCurrentStreak(0);
    setBestStreak(0);
    setMistakes([]);
    setFinished(false);
  }, [terms, durationSec, hardMode]);

  useEffect(() => {
    if (lockedChoice || !question || finished) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setLockedChoice('__timeout__');
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockedChoice, question, durationSec, finished]);

  const accuracy = useMemo(
    () => (answered === 0 ? 0 : Math.round((correctCount / answered) * 100)),
    [answered, correctCount],
  );

  if (terms.length === 0 || !question) {
    return (
      <section className="panel trainer-empty">
        <h3>Блиц пока пуст</h3>
        <p>Сначала собери базу ошибок, чтобы таймер давил именно на слабые зоны.</p>
        <button className="button" onClick={onExit} type="button">
          Назад
        </button>
      </section>
    );
  }

  const isCorrect = lockedChoice === question.correct;

  const nextQuestion = () => {
    const wasCorrect = lockedChoice === question.correct;
    onAnswered(question.term.id, wasCorrect);
    const nextAnswered = answered + 1;
    if (wasCorrect) {
      setCorrectCount((value) => value + 1);
      setCurrentStreak((value) => {
        const next = value + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
    } else {
      setCurrentStreak(0);
      setMistakes((current) => [
        ...current,
        {
          term: question.term,
          correct: question.correct,
          selected: lockedChoice === '__timeout__' ? 'Время вышло' : lockedChoice ?? 'Нет ответа',
          hint: getMemoryHint(question.term),
          context: question.context,
        },
      ]);
    }

    if (nextAnswered >= sessionLength) {
      setAnswered(nextAnswered);
      setFinished(true);
      return;
    }

    setAnswered(nextAnswered);
    setQuestion(buildQuestion(sessionTerms, progress, hardMode, question.term.id));
    setLockedChoice(null);
    setTimeLeft(durationSec);
  };

  const restartWithTerms = (nextTerms: Term[]) => {
    setSessionTerms(nextTerms);
    setQuestion(buildQuestion(nextTerms, progress, hardMode));
    setTimeLeft(durationSec);
    setAnswered(0);
    setCorrectCount(0);
    setLockedChoice(null);
    setCurrentStreak(0);
    setBestStreak(0);
    setMistakes([]);
    setFinished(false);
  };

  if (finished) {
    return (
      <section className={`panel trainer-panel ${compact ? 'trainer-panel--compact' : ''}`}>
        <header className="trainer-header">
          <div>
            <span className="eyebrow">Speed Radar</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="button button--ghost" onClick={onExit} type="button">
            Выйти
          </button>
        </header>

        <div className="blitz-summary">
          <div className="stat-grid">
            <article className="stat-card">
              <span>Точность</span>
              <strong>{accuracy}%</strong>
            </article>
            <article className="stat-card">
              <span>Правильных</span>
              <strong>{correctCount}</strong>
            </article>
            <article className="stat-card">
              <span>Лучшая серия</span>
              <strong>{bestStreak}</strong>
            </article>
            <article className="stat-card stat-card--danger">
              <span>Ошибки</span>
              <strong>{mistakes.length}</strong>
            </article>
          </div>

          <div className="weak-actions">
            {mistakes.length > 0 && (
              <button
                className="button"
                onClick={() => restartWithTerms(mistakes.map((item) => item.term))}
                type="button"
              >
                Повторить только ошибки
              </button>
            )}
            {onComplete ? (
              <button className="button button--secondary" onClick={onComplete} type="button">
                Продолжить
              </button>
            ) : (
              <button className="button button--secondary" onClick={() => restartWithTerms(terms)} type="button">
                Новый блиц
              </button>
            )}
          </div>

          <div className="mistake-list">
            {mistakes.length === 0 ? (
              <div className="empty-state">
                <h3>Без ошибок</h3>
                <p>Это уже похоже на экзаменационный темп. Можно сразу идти в письменный тест.</p>
              </div>
            ) : (
              mistakes.map((item, index) => (
                <article className="mistake-item" key={`${item.term.id}-${index}`}>
                  <strong>{getBlitzPrompt(item.term).title}</strong>
                  {item.context && <span>{item.context}</span>}
                  <p>Правильно: {item.correct}</p>
                  <p>Выбрано: {item.selected}</p>
                  <p>Подсказка: {item.hint}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`panel trainer-panel ${compact ? 'trainer-panel--compact' : ''}`}>
      <header className="trainer-header">
        <div>
          <span className="eyebrow">Speed Radar</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="trainer-actions">
          <span className="session-badge">
            {answered} / {sessionLength}
          </span>
          <label className="mode-toggle">
            <input
              checked={hardMode}
              onChange={(event) => setHardMode(event.target.checked)}
              type="checkbox"
            />
            <span>{hardMode ? 'Жёсткий блиц' : 'Обычный блиц'}</span>
          </label>
          <button className="button button--ghost" onClick={onExit} type="button">
            Выйти
          </button>
        </div>
      </header>

      <div className="blitz-layout">
        <div className="blitz-topbar">
          <div className="timer-shell">
            <span>Таймер</span>
            <strong>{timeLeft}s</strong>
          </div>
          <div className="timer-track">
            <div className="timer-fill" style={{ width: `${(timeLeft / durationSec) * 100}%` }} />
          </div>
          <div className="timer-shell">
            <span>Серия</span>
            <strong>{currentStreak}</strong>
          </div>
        </div>

        <div className="prompt-tile">
          <span className="eyebrow">Instant recognition</span>
          <div className="card-stage__abbr">{getBlitzPrompt(question.term).title}</div>
          {question.context && <div className="dual-term-badge">{question.context}</div>}
        </div>

        <div className="choice-grid">
          {question.choices.map((choice) => {
            const isLocked = Boolean(lockedChoice);
            const isSelected = lockedChoice === choice;
            const stateClass = isLocked
              ? choice === question.correct
                ? 'choice-card--correct'
                : isSelected
                  ? 'choice-card--wrong'
                  : ''
              : '';

            return (
              <button
                key={choice}
                className={`choice-card ${stateClass}`}
                disabled={isLocked}
                onClick={() => setLockedChoice(choice)}
                type="button"
              >
                {choice}
              </button>
            );
          })}
        </div>

        {lockedChoice && (
          <div className={`blitz-feedback ${isCorrect ? 'blitz-feedback--correct' : 'blitz-feedback--wrong'}`}>
            <strong>{isCorrect ? 'Точно знаешь' : 'Ошибка зафиксирована'}</strong>
            <span>Правильно: {question.correct}</span>
            {!isCorrect && (
              <span>
                Выбрано: {lockedChoice === '__timeout__' ? 'Время вышло' : lockedChoice}. Подсказка:{' '}
                {getMemoryHint(question.term)}
              </span>
            )}
            <button className="button" onClick={nextQuestion} type="button">
              Дальше
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
