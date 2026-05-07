import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../app/StudyContext';
import { terms } from '../data/terms';
import {
  INITIAL_BATCH_SIZE,
  applyLearnBlitzAssessment,
  applyLearnCardAssessment,
  applyLearnWrittenAssessment,
  createInitialLearnProgress,
  createLearnSession,
  deriveLearnProgressCounter,
  finalizeLearnStep,
  getLearnStageTitle,
  getLearnSummary,
  requestFinalCheck,
  validateLearnSession,
} from '../features/learn/learnEngine';
import {
  loadLearnProgress,
  loadLearnSession,
  loadLearnSettings,
  resetLearnStorage,
  saveLearnProgress,
  saveLearnSession,
  saveLearnSettings,
} from '../features/learn/learnStorage';
import { compareAnswer, normalizeAnswer } from '../utils/answerCheck';
import { generateDistractors, getBlitzAnswer, getBlitzPrompt } from '../utils/generateDistractors';
import { getMemoryHint } from '../utils/memoryHints';
import { LearnQuestionMode, LearnSessionState, LearnSettings, LearnStage, Term } from '../types';

const defaultSettings: LearnSettings = {
  initialBatchSize: INITIAL_BATCH_SIZE,
  pace: 'cram',
  focus: 'all',
  cramMode: true,
};

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

export function LearnPage() {
  const navigate = useNavigate();
  const { markBlitz, markCard, markWritten } = useStudy();
  const [learnProgress, setLearnProgress] = useState(() =>
    createInitialLearnProgress(terms, loadLearnProgress()),
  );
  const [settings, setSettings] = useState<LearnSettings>(() => loadLearnSettings() ?? defaultSettings);
  const [session, setSession] = useState<LearnSessionState | null>(() => {
    const progress = createInitialLearnProgress(terms, loadLearnProgress());
    return validateLearnSession(loadLearnSession(), terms, progress);
  });
  const [resumePrompt, setResumePrompt] = useState(() => {
    const progress = createInitialLearnProgress(terms, loadLearnProgress());
    const restored = validateLearnSession(loadLearnSession(), terms, progress);
    return Boolean(restored && restored.stage !== 'session-complete');
  });
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState<{
    title: string;
    lines: string[];
    tone: 'neutral' | 'success' | 'danger' | 'warm';
    allowWrittenOverride?: boolean;
  } | null>(null);
  const [lastWrittenAttempt, setLastWrittenAttempt] = useState<{
    termId: string;
    session: LearnSessionState;
  } | null>(null);

  useEffect(() => {
    saveLearnProgress(learnProgress);
  }, [learnProgress]);

  useEffect(() => {
    saveLearnSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveLearnSession(session);
  }, [session]);

  const currentTerm = useMemo(
    () => terms.find((term) => term.id === session?.currentItem?.termId) ?? null,
    [session],
  );

  const summary = useMemo(() => {
    const ids = session?.introducedIds.length ? session.introducedIds : terms.map((term) => term.id);
    return getLearnSummary(learnProgress, ids);
  }, [learnProgress, session]);

  const blitzChoices = useMemo(() => {
    if (!currentTerm || session?.currentItem?.mode !== 'hard-blitz') {
      return [];
    }
    return shuffle([getBlitzAnswer(currentTerm), ...generateDistractors(currentTerm, terms)]);
  }, [currentTerm, session?.currentItem?.mode, session?.currentItem?.termId]);

  useEffect(() => {
    setRevealed(false);
    setAnswer('');
    setSelectedChoice(null);
  }, [session?.currentItem?.termId, session?.currentItem?.mode, session?.stage]);

  const startSession = (nextSettings = settings) => {
    const nextSession = createLearnSession(terms, learnProgress, nextSettings);
    setSession(nextSession);
    setResumePrompt(false);
  };

  const resetSession = () => {
    resetLearnStorage();
    const freshProgress = createInitialLearnProgress(terms);
    setLearnProgress(freshProgress);
    setSession(null);
    setResumePrompt(false);
    setSettings(defaultSettings);
  };

  const completeTransition = (
    nextProgress: ReturnType<typeof createInitialLearnProgress>,
    nextSession: LearnSessionState,
  ) => {
    const finalized = finalizeLearnStep(nextSession, nextProgress, terms);
    setLearnProgress(nextProgress);
    setSession(finalized);
  };

  const handleCardAnswer = (assessment: 'know' | 'confuse' | 'dontknow' | 'remembered' | 'partial' | 'forgot') => {
    if (!currentTerm || !session?.currentItem) return;
    const updated = applyLearnCardAssessment(learnProgress, session, currentTerm.id, assessment);
    if (assessment === 'know' || assessment === 'remembered') {
      markCard(currentTerm.id, 'know');
    } else if (assessment === 'confuse' || assessment === 'partial') {
      markCard(currentTerm.id, 'confuse');
    } else {
      markCard(currentTerm.id, 'dontknow');
    }

    completeTransition(updated.progress, updated.session);

    if (assessment === 'dontknow' || assessment === 'forgot') {
      setFeedback({
        title: 'Вернёмся к этому термину позже',
        lines: [currentTerm.answers.join(' / '), `Подсказка: ${getMemoryHint(currentTerm)}`],
        tone: 'danger',
      });
    } else if (assessment === 'confuse' || assessment === 'partial') {
      setFeedback({
        title: 'Почти, но оставляем в активном повторении',
        lines: [currentTerm.answers.join(' / '), `Подсказка: ${getMemoryHint(currentTerm)}`],
        tone: 'warm',
      });
    }
  };

  const handleBlitzAnswer = (choice: string) => {
    if (!currentTerm || !session) return;
    setSelectedChoice(choice);
    const acceptedAnswers = Array.from(new Set([getBlitzAnswer(currentTerm), ...currentTerm.answers]));
    const normalizedChoice = normalizeAnswer(choice);
    const correct = acceptedAnswers.some((acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedChoice);
    const updated = applyLearnBlitzAssessment(learnProgress, session, currentTerm.id, correct);
    markBlitz(currentTerm.id, correct);
    completeTransition(updated.progress, updated.session);
    setFeedback({
      title: correct ? 'Точно' : 'Ошибка зафиксирована',
      lines: correct
        ? [getBlitzAnswer(currentTerm)]
        : [
            `Правильно: ${getBlitzAnswer(currentTerm)}`,
            `Выбрано: ${choice}`,
            `Подсказка: ${getMemoryHint(currentTerm)}`,
          ],
      tone: correct ? 'success' : 'danger',
    });
  };

  const handleWrittenSubmit = () => {
    if (!currentTerm || !session || !answer.trim()) return;
    const attempt = { termId: currentTerm.id, session };
    const comparison = compareAnswer(answer, currentTerm.answers);
    const updated = applyLearnWrittenAssessment(learnProgress, session, currentTerm.id, comparison);
    markWritten(currentTerm.id, comparison, comparison.verdict !== 'correct');
    completeTransition(updated.progress, updated.session);
    setLastWrittenAttempt(comparison.verdict === 'correct' ? null : attempt);
    setFeedback({
      title:
        comparison.verdict === 'correct'
          ? 'Ответ засчитан'
          : comparison.verdict === 'almost'
            ? 'Почти, но нужно перепечатать позже'
            : 'Нужно перепечатать позже',
      lines: [
        `Правильно: ${currentTerm.answers.join(' / ')}`,
        `Твой ответ: ${answer}`,
        `Подсказка: ${getMemoryHint(currentTerm)}`,
      ],
      tone:
        comparison.verdict === 'correct' ? 'success' : comparison.verdict === 'almost' ? 'warm' : 'danger',
      allowWrittenOverride: comparison.verdict !== 'correct',
    });
  };

  const handleWrittenSkip = () => {
    if (!currentTerm || !session) return;
    const comparison = compareAnswer('', currentTerm.answers);
    const updated = applyLearnWrittenAssessment(learnProgress, session, currentTerm.id, comparison, { skipped: true });
    completeTransition(updated.progress, updated.session);
    setLastWrittenAttempt(null);
    setFeedback({
      title: 'Пропущено',
      lines: [
        `Правильно: ${currentTerm.answers.join(' / ')}`,
        `Подсказка: ${getMemoryHint(currentTerm)}`,
      ],
      tone: 'neutral',
    });
  };

  const handleWrittenOverride = () => {
    if (!lastWrittenAttempt) return;
    const term = terms.find((item) => item.id === lastWrittenAttempt.termId);
    if (!term) return;
    const comparison = compareAnswer(term.answers[0], term.answers);
    const updated = applyLearnWrittenAssessment(
      learnProgress,
      lastWrittenAttempt.session,
      lastWrittenAttempt.termId,
      comparison,
      { overrideCorrect: true },
    );
    markWritten(lastWrittenAttempt.termId, comparison, false);
    completeTransition(updated.progress, updated.session);
    setLastWrittenAttempt(null);
    setFeedback({
      title: 'Засчитано как правильный ответ',
      lines: [`Правильно: ${term.answers.join(' / ')}`],
      tone: 'success',
    });
  };

  const openFinalCheck = () => {
    if (!session) return;
    setSession(requestFinalCheck(session, learnProgress, terms));
  };

  const renderStartScreen = () => (
    <section className="trainer-card learn-start-card">
      <span className="eyebrow">Learn mode</span>
      <h1>Заучивание</h1>
      <p>Будем учить маленькими партиями: сначала 10 терминов, потом слабые + новые, затем блиц и письменный ответ.</p>

      <div className="learn-settings-grid">
        <div className="settings-block">
          <span>Размер первой партии</span>
          <div className="chip-scroll">
            {[10, 15, 20].map((size) => (
              <button
                key={size}
                className={`filter-chip ${settings.initialBatchSize === size ? 'filter-chip--active' : ''}`}
                onClick={() => setSettings((current) => ({ ...current, initialBatchSize: size }))}
                type="button"
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-block">
          <span>Скорость</span>
          <div className="chip-scroll">
            {[
              { key: 'cram', label: 'Срочно к экзамену' },
              { key: 'normal', label: 'Нормально' },
              { key: 'thorough', label: 'Тщательно' },
            ].map((item) => (
              <button
                key={item.key}
                className={`filter-chip ${settings.pace === item.key ? 'filter-chip--active' : ''}`}
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    pace: item.key as LearnSettings['pace'],
                    cramMode: item.key === 'cram',
                  }))
                }
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-block">
          <span>Фокус</span>
          <div className="chip-scroll">
            {[
              { key: 'all', label: 'Все термины' },
              { key: 'weak', label: 'Только слабые' },
              { key: 'new', label: 'Только новые' },
              { key: 'not-mastered', label: 'Только не mastered' },
            ].map((item) => (
              <button
                key={item.key}
                className={`filter-chip ${settings.focus === item.key ? 'filter-chip--active' : ''}`}
                onClick={() => setSettings((current) => ({ ...current, focus: item.key as LearnSettings['focus'] }))}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="action-row">
        <button className="button" onClick={() => startSession()} type="button">
          Начать заучивание
        </button>
        <button className="button button--ghost" onClick={resetSession} type="button">
          Начать заново
        </button>
      </div>
    </section>
  );

  if (resumePrompt && session) {
    return (
      <div className="page">
        <section className="trainer-card learn-start-card">
          <span className="eyebrow">Resume learn</span>
          <h1>Продолжить заучивание</h1>
          <p>Активная сессия уже есть. Можно продолжить с того же места или начать заново с новой партией.</p>
          <div className="action-row">
            <button className="button" onClick={() => setResumePrompt(false)} type="button">
              Продолжить
            </button>
            <button className="button button--ghost" onClick={resetSession} type="button">
              Начать заново
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!session) {
    return <div className="page">{renderStartScreen()}</div>;
  }

  if (session.stage === 'session-complete') {
    const topWeak = [...session.introducedIds]
      .sort((left, right) => learnProgress[left].confidence - learnProgress[right].confidence)
      .slice(0, 10)
      .map((id) => terms.find((term) => term.id === id)!)
      .filter(Boolean);

    return (
      <div className="page">
        <section className="trainer-card learn-summary-card">
          <span className="eyebrow">Session complete</span>
          <h1>Итог заучивания</h1>
          <div className="stats-grid">
            <article className="stat-card">
              <span>Mastered</span>
              <strong>{summary.mastered}</strong>
            </article>
            <article className="stat-card">
              <span>Almost</span>
              <strong>{summary.almost}</strong>
            </article>
            <article className="stat-card stat-card--danger">
              <span>Weak</span>
              <strong>{summary.weak}</strong>
            </article>
            <article className="stat-card">
              <span>Нужно перепечатать</span>
              <strong>{summary.needsRetype}</strong>
            </article>
            <article className="stat-card">
              <span>Письменная точность</span>
              <strong>{summary.writtenAccuracy}%</strong>
            </article>
            <article className="stat-card">
              <span>Блиц-точность</span>
              <strong>{summary.blitzAccuracy}%</strong>
            </article>
          </div>

          <div className="term-list">
            {topWeak.map((term) => (
              <article className="term-card" key={term.id}>
                <div className="term-card__head">
                  <strong>{term.abbr}</strong>
                  <span className={`status-pill status-pill--${learnProgress[term.id].status}`}>
                    {learnProgress[term.id].status}
                  </span>
                </div>
                <p className="term-card__answer">{term.answers.join(' / ')}</p>
                <p className="term-card__translation">{term.translation}</p>
              </article>
            ))}
          </div>

          <div className="action-row">
            <button
              className="button"
              onClick={() =>
                startSession({
                  ...settings,
                  focus: 'weak',
                })
              }
              type="button"
            >
              Повторить слабые
            </button>
            <button
              className="button button--secondary"
              onClick={() =>
                startSession({
                  ...settings,
                  focus: 'not-mastered',
                })
              }
              type="button"
            >
              Продолжить с новыми
            </button>
            <button className="button button--ghost" onClick={() => navigate('/exam-mode')} type="button">
              Финальная проверка
            </button>
            <button className="button button--ghost" onClick={() => navigate('/')} type="button">
              На главную
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!currentTerm || !session.currentItem) {
    return <div className="page">{renderStartScreen()}</div>;
  }

  const currentProgress = learnProgress[currentTerm.id];
  const prompt = getBlitzPrompt(currentTerm);
  const progressValue = session.introducedIds.length === 0 ? 0 : Math.round((summary.mastered / session.introducedIds.length) * 100);
  const stageCounter = deriveLearnProgressCounter(session);
  const stageStepMap: Record<LearnStage, number> = {
    'intro-cards': 1,
    'recall-cards': 2,
    'hard-blitz': 3,
    written: 4,
    'mixed-review': 5,
    'final-check': 6,
    'session-complete': 6,
  };

  const currentStageIndex = stageStepMap[session.stage];
  const compactStageLabel =
    session.stage === 'intro-cards'
      ? 'Карточки'
      : session.stage === 'recall-cards'
        ? 'Recall'
        : session.stage === 'hard-blitz'
          ? 'Блиц'
          : session.stage === 'written'
            ? 'Письменный ответ'
            : session.stage === 'mixed-review'
              ? 'Смешанное повторение'
              : 'Финальная проверка';

  const renderFlipLearnCard = (options: {
    frontHint: string;
    backCaption: string;
    actions: React.ReactNode;
  }) => (
    <>
      <button
        aria-label={revealed ? 'Показана расшифровка' : 'Показана аббревиатура'}
        className={`flip-card learn-flip-card ${revealed ? 'flip-card--revealed' : ''}`}
        onClick={() => setRevealed((value) => !value)}
        type="button"
      >
        <div className="flip-card__inner">
          <div className="flip-card__face flip-card__face--front">
            <span className="flip-card__label">{compactStageLabel}</span>
            <div className="card-stage__abbr">{currentTerm.abbr}</div>
            <p className="flip-card__hint">{options.frontHint}</p>
          </div>

          <div className="flip-card__face flip-card__face--back">
            <span className="flip-card__label">Ответ</span>
            <div className="answer-reveal__text">{currentTerm.answers.join(' / ')}</div>
            <div className="flip-card__translation">
              <strong>{currentTerm.translation}</strong>
              <span>{getMemoryHint(currentTerm)}</span>
            </div>
            <p className="flip-card__hint">{options.backCaption}</p>
          </div>
        </div>
      </button>

      {revealed && <div className="learn-actions">{options.actions}</div>}
    </>
  );

  const renderTask = () => {
    if (session.currentItem?.mode === 'intro-card') {
      return (
        <div className="learn-task-card">
          {renderFlipLearnCard({
            frontHint: 'Нажми, чтобы перевернуть',
            backCaption: 'Посмотрела ответ — сразу оцени уверенность.',
            actions: (
              <>
                <button className="button status-button--know" onClick={() => handleCardAnswer('know')} type="button">
                  Знаю
                </button>
                <button className="button status-button--confuse" onClick={() => handleCardAnswer('confuse')} type="button">
                  Путаю
                </button>
                <button className="button status-button--dontknow" onClick={() => handleCardAnswer('dontknow')} type="button">
                  Не знаю
                </button>
              </>
            ),
          })}
        </div>
      );
    }

    if (session.currentItem?.mode === 'recall-card') {
      return (
        <div className="learn-task-card">
          {renderFlipLearnCard({
            frontHint: 'Сначала вспомни сама, потом переверни',
            backCaption: 'Честно зафиксируй, насколько быстро вспомнила.',
            actions: (
              <>
                <button className="button status-button--know" onClick={() => handleCardAnswer('remembered')} type="button">
                  Вспомнила
                </button>
                <button className="button status-button--confuse" onClick={() => handleCardAnswer('partial')} type="button">
                  Частично
                </button>
                <button className="button status-button--dontknow" onClick={() => handleCardAnswer('forgot')} type="button">
                  Не вспомнила
                </button>
              </>
            ),
          })}
        </div>
      );
    }

    if (session.currentItem?.mode === 'hard-blitz') {
      return (
        <div className="learn-task-card">
          <span className="eyebrow">Hard blitz</span>
          <div className="card-stage__abbr">{prompt.title}</div>
          {prompt.context && <div className="dual-term-badge">{prompt.context}</div>}
          <p className="learn-task-card__subtle">Выбери точную расшифровку среди похожих вариантов.</p>
          <div className="choice-grid choice-grid--single">
            {blitzChoices.map((choice) => {
              const isSelected = selectedChoice === choice;
              const isCorrectChoice = normalizeAnswer(choice) === normalizeAnswer(getBlitzAnswer(currentTerm));

              return (
                <button
                  key={choice}
                  className={`choice-card ${
                    isSelected ? (isCorrectChoice ? 'choice-card--correct' : 'choice-card--wrong') : ''
                  }`}
                  onClick={() => handleBlitzAnswer(choice)}
                  type="button"
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="learn-task-card">
        <span className="eyebrow">Written answer</span>
        <div className="card-stage__abbr">{currentTerm.abbr}</div>
        {currentProgress.needsRetype && <div className="dual-term-badge">Нужно перепечатать правильно</div>}
        <p className="learn-task-card__subtle">Напиши полную английскую расшифровку без подсказки.</p>
        <label className="search-field">
          <span>Полная английская расшифровка</span>
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type the full expansion"
            type="text"
          />
        </label>
        <button className="button" onClick={handleWrittenSubmit} type="button">
          Проверить ответ
        </button>
        <button className="button button--ghost" onClick={handleWrittenSkip} type="button">
          Пропустить
        </button>
      </div>
    );
  };

  return (
    <div className="page learn-page">
      <section className="learn-layout">
        <div className="learn-main">
          <section className="trainer-card learn-topbar-card">
            <div className="learn-topbar">
              <button aria-label="Назад" className="icon-button" onClick={() => navigate('/')} type="button">
                ←
              </button>
              <div className="learn-topbar__title">Заучивание</div>
              <button
                aria-label="Показать детали"
                className="icon-button"
                onClick={() => setShowDetails((value) => !value)}
                type="button"
              >
                i
              </button>
            </div>

            <div className="learn-progress-compact">
              <div className="learn-progress-bar">
                <div className="learn-progress-bar__fill" style={{ width: `${progressValue}%` }} />
              </div>
              <div className="learn-progress-compact__row">
                <span>Этап: {compactStageLabel}</span>
                <span>
                  {stageCounter.numerator}/{stageCounter.denominator}
                </span>
              </div>
              <div className="learn-progress-compact__meta">
                Партия {session.batchNumber} · Слабые повторяются чаще
              </div>
            </div>
          </section>

          {feedback ? (
            <section className={`trainer-card learn-feedback learn-feedback--${feedback.tone}`}>
              <strong>{feedback.title}</strong>
              {feedback.lines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
              <button className="button" onClick={() => setFeedback(null)} type="button">
                Дальше
              </button>
              {feedback.allowWrittenOverride && (
                <button className="button button--secondary" onClick={handleWrittenOverride} type="button">
                  Я написал правильно
                </button>
              )}
            </section>
          ) : (
            <section className="trainer-card">{renderTask()}</section>
          )}

          <details className={`trainer-card learn-details-sheet ${showDetails ? 'is-open' : ''}`} open={showDetails}>
            <summary
              onClick={(event) => {
                event.preventDefault();
                setShowDetails((value) => !value);
              }}
            >
              {showDetails ? 'Скрыть детали' : 'Показать детали'}
            </summary>
            <div className="learn-details-sheet__content">
              <div className="stat-grid">
                <article className="stat-card">
                  <span>Mastered</span>
                  <strong>{summary.mastered}</strong>
                </article>
                <article className="stat-card">
                  <span>Weak</span>
                  <strong>{summary.weak}</strong>
                </article>
                <article className="stat-card">
                  <span>Нужно перепечатать</span>
                  <strong>{summary.needsRetype}</strong>
                </article>
                <article className="stat-card">
                  <span>Осталось новых</span>
                  <strong>{session.remainingNewIds.length}</strong>
                </article>
              </div>
              <div className="action-row">
                <button className="button button--secondary" onClick={openFinalCheck} type="button">
                  Финальная проверка
                </button>
                <button className="button button--ghost" onClick={resetSession} type="button">
                  Начать заново
                </button>
              </div>
            </div>
          </details>
        </div>

        <aside className="trainer-card learn-sidebar">
          <span className="eyebrow">Session state</span>
          <h2>{getLearnStageTitle(session.stage)}</h2>
          <div className="stat-grid">
            <article className="stat-card">
              <span>Mastered</span>
              <strong>{summary.mastered}</strong>
            </article>
            <article className="stat-card">
              <span>Weak</span>
              <strong>{summary.weak}</strong>
            </article>
            <article className="stat-card">
              <span>Нужно перепечатать</span>
              <strong>{summary.needsRetype}</strong>
            </article>
            <article className="stat-card">
              <span>Письменная точность</span>
              <strong>{summary.writtenAccuracy}%</strong>
            </article>
          </div>
          <div className="term-card">
            <strong>{currentTerm.abbr}</strong>
            <p className="term-card__answer">{currentTerm.answers.join(' / ')}</p>
            <p className="term-card__translation">confidence {currentProgress.confidence}%</p>
          </div>
          <div className="action-row">
            <button className="button button--secondary" onClick={openFinalCheck} type="button">
              Финальная проверка
            </button>
            <button className="button button--ghost" onClick={resetSession} type="button">
              Начать заново
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
