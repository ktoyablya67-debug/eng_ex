import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { terms } from '../data/terms';
import {
  AnswerComparison,
  FilterKey,
  ProgressMap,
  ProgressStats,
  StudyStatus,
  Term,
  TermProgress,
} from '../types';
import { createEmptyProgress, loadProgress, resetProgressStorage, saveProgress } from '../utils/storage';
import { calculateReadiness } from '../utils/readiness';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const ensureProgress = (progress: ProgressMap): ProgressMap =>
  terms.reduce<ProgressMap>((accumulator, term) => {
    const current = progress[term.id] ?? createEmptyProgress();
    accumulator[term.id] = {
      ...createEmptyProgress(),
      ...current,
    };
    return accumulator;
  }, {});

const calculateWeakScore = (term: Term, progress: ProgressMap) => {
  const item = progress[term.id];
  const statusPenalty =
    item.status === 'dontknow' ? 4 : item.status === 'confuse' ? 2 : item.status === 'new' ? 1 : 0;

  return item.mistakes * 3 + item.repeatLater * 2 + statusPenalty - item.successes;
};

const calculateStats = (progress: ProgressMap): ProgressStats => {
  const entries = terms.map((term) => progress[term.id]);
  const writtenAttempts = entries.reduce((sum, item) => sum + item.writtenAttempts, 0);
  const writtenCorrect = entries.reduce((sum, item) => sum + item.writtenCorrect, 0);
  const studied = entries.filter(
    (item) => item.cardReviews > 0 || item.writtenAttempts > 0 || item.blitzAttempts > 0,
  ).length;
  const know = entries.filter((item) => item.status === 'know').length;
  const weak = terms.filter((term) => calculateWeakScore(term, progress) > 0).length;
  const streak = Math.max(...entries.map((item) => item.currentStreak), 0);
  const readiness = calculateReadiness(progress, terms);

  return {
    total: terms.length,
    studied,
    know,
    weak,
    mastered: readiness.mastered,
    almost: readiness.almost,
    writtenAccuracy: writtenAttempts === 0 ? 0 : Math.round((writtenCorrect / writtenAttempts) * 100),
    blitzAccuracy: readiness.blitzAccuracy,
    coverage: readiness.coverage,
    streak,
    readiness: readiness.readiness,
    readinessStatus: readiness.readinessStatus,
    readinessAdvice: readiness.readinessAdvice,
  };
};

const getExamPlan = (progress: ProgressMap) => {
  const ranked = [...terms].sort((left, right) => calculateWeakScore(right, progress) - calculateWeakScore(left, progress));
  const weak = ranked.slice(0, 8);
  const tricky = ranked
    .filter((term) => !weak.find((item) => item.id === term.id))
    .sort((left, right) => {
      const leftComplexity = left.answers[0].length + (left.answers.length > 1 ? 15 : 0);
      const rightComplexity = right.answers[0].length + (right.answers.length > 1 ? 15 : 0);
      return rightComplexity - leftComplexity;
    })
    .slice(0, 8);
  const blitz = ranked.filter((term) => !weak.find((item) => item.id === term.id)).slice(0, 12);
  return { weak, tricky, blitz };
};

const matchesFilter = (term: Term, filter: FilterKey, progress: ProgressMap) => {
  const item = progress[term.id];
  switch (filter) {
    case 'know':
      return item.status === 'know';
    case 'confuse':
      return item.status === 'confuse';
    case 'dontknow':
      return item.status === 'dontknow';
    case 'errors':
      return item.mistakes > 0 || item.repeatLater > 0;
    case 'unseen':
      return item.status === 'new' && item.cardReviews === 0 && item.writtenAttempts === 0 && item.blitzAttempts === 0;
    default:
      return true;
  }
};

interface StudyContextValue {
  progress: ProgressMap;
  stats: ProgressStats;
  weakTerms: Array<{ term: Term; score: number }>;
  examPlan: { weak: Term[]; tricky: Term[]; blitz: Term[] };
  getFilteredTerms: (query: string, filter: FilterKey, weakOnly?: boolean) => Term[];
  getStatusCount: (status: StudyStatus | 'errors' | 'unseen') => number;
  resetAll: () => void;
  markCard: (termId: string, status: Exclude<StudyStatus, 'new'>) => void;
  markWritten: (termId: string, comparison: AnswerComparison, repeatLater: boolean, forceWeak?: boolean) => void;
  markBlitz: (termId: string, correct: boolean) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(() => ensureProgress(loadProgress()));

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateTerm = (termId: string, updater: (current: TermProgress) => TermProgress) => {
    setProgress((current) => ({
      ...current,
      [termId]: updater(current[termId] ?? createEmptyProgress()),
    }));
  };

  const markCard = (termId: string, status: Exclude<StudyStatus, 'new'>) => {
    updateTerm(termId, (current) => {
      const successBoost = status === 'know' ? 1 : 0;
      const mistakeBoost = status === 'dontknow' ? 1 : status === 'confuse' ? 0.5 : 0;
      const streak = status === 'know' ? current.currentStreak + 1 : 0;

      return {
        ...current,
        status,
        cardReviews: current.cardReviews + 1,
        successes: current.successes + successBoost,
        mistakes: current.mistakes + mistakeBoost,
        currentStreak: streak,
        bestStreak: Math.max(current.bestStreak, streak),
        repeatLater: status === 'know' ? Math.max(current.repeatLater - 1, 0) : current.repeatLater + 1,
        lastSeenAt: Date.now(),
        lastMistakeAt: status === 'know' ? current.lastMistakeAt : Date.now(),
      };
    });
  };

  const markWritten = (
    termId: string,
    comparison: AnswerComparison,
    repeatLater: boolean,
    forceWeak = false,
  ) => {
    updateTerm(termId, (current) => {
      const correctLike = comparison.verdict === 'correct';
      const almost = comparison.verdict === 'almost';
      const streak = correctLike ? current.currentStreak + 1 : 0;
      const nextStatus: StudyStatus = correctLike && !forceWeak ? 'know' : almost ? 'confuse' : 'dontknow';

      return {
        ...current,
        status: nextStatus,
        writtenAttempts: current.writtenAttempts + 1,
        writtenCorrect: current.writtenCorrect + (correctLike ? 1 : 0),
        successes: current.successes + (correctLike ? 2 : almost ? 1 : 0),
        mistakes: current.mistakes + (correctLike && !forceWeak ? 0 : almost ? 0.5 : 1),
        repeatLater: current.repeatLater + (repeatLater || !correctLike || forceWeak ? 1 : 0),
        currentStreak: streak,
        bestStreak: Math.max(current.bestStreak, streak),
        lastSeenAt: Date.now(),
        lastMistakeAt: correctLike && !forceWeak ? current.lastMistakeAt : Date.now(),
      };
    });
  };

  const markBlitz = (termId: string, correct: boolean) => {
    updateTerm(termId, (current) => {
      const streak = correct ? current.currentStreak + 1 : 0;
      return {
        ...current,
        status: correct ? current.status : current.status === 'know' ? 'confuse' : 'dontknow',
        blitzAttempts: current.blitzAttempts + 1,
        blitzCorrect: current.blitzCorrect + (correct ? 1 : 0),
        successes: current.successes + (correct ? 1 : 0),
        mistakes: current.mistakes + (correct ? 0 : 1),
        repeatLater: current.repeatLater + (correct ? 0 : 1),
        currentStreak: streak,
        bestStreak: Math.max(current.bestStreak, streak),
        lastSeenAt: Date.now(),
        lastMistakeAt: correct ? current.lastMistakeAt : Date.now(),
      };
    });
  };

  const resetAll = () => {
    resetProgressStorage();
    setProgress(ensureProgress({}));
  };

  const stats = useMemo(() => calculateStats(progress), [progress]);
  const weakTerms = useMemo(
    () =>
      [...terms]
        .map((term) => ({ term, score: calculateWeakScore(term, progress) }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score),
    [progress],
  );
  const examPlan = useMemo(() => getExamPlan(progress), [progress]);

  const getFilteredTerms = (query: string, filter: FilterKey, weakOnly = false) => {
    const normalizedQuery = query.toLowerCase().trim();
    const source = weakOnly ? weakTerms.map((item) => item.term) : terms;
    return source.filter((term) => {
      const text = `${term.abbr} ${term.answers.join(' ')} ${term.translation}`.toLowerCase();
      return (normalizedQuery.length === 0 || text.includes(normalizedQuery)) && matchesFilter(term, filter, progress);
    });
  };

  const getStatusCount = (status: StudyStatus | 'errors' | 'unseen') => {
    if (status === 'errors') {
      return terms.filter((term) => progress[term.id].mistakes > 0 || progress[term.id].repeatLater > 0).length;
    }

    if (status === 'unseen') {
      return terms.filter((term) => matchesFilter(term, 'unseen', progress)).length;
    }

    return terms.filter((term) => progress[term.id].status === status).length;
  };

  const value = useMemo<StudyContextValue>(
    () => ({
      progress,
      stats,
      weakTerms,
      examPlan,
      getFilteredTerms,
      getStatusCount,
      resetAll,
      markCard,
      markWritten,
      markBlitz,
    }),
    [progress, stats, weakTerms, examPlan],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within StudyProvider');
  }
  return context;
};
