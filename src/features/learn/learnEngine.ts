import {
  AnswerComparison,
  LearnFocus,
  LearnItem,
  LearnPace,
  LearnProgressMap,
  LearnQuestionMode,
  LearnQueueEntry,
  LearnSessionState,
  LearnSettings,
  LearnStage,
  LearnStatus,
  Term,
} from '../../types';

export const INITIAL_BATCH_SIZE = 10;
export const NEW_TERMS_PER_ROUND = 5;
export const WEAK_TERMS_CARRY_OVER = 5;
const MIXED_REVIEW_SIZE = 12;

const CONFIDENCE_MIN = 0;
const CONFIDENCE_MAX = 100;

const clamp = (value: number) => Math.max(CONFIDENCE_MIN, Math.min(CONFIDENCE_MAX, value));

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const dedupe = <T,>(items: T[]) => Array.from(new Set(items));

const learnStages: LearnStage[] = [
  'intro-cards',
  'recall-cards',
  'hard-blitz',
  'written',
  'mixed-review',
  'final-check',
  'session-complete',
];

export const createEmptyLearnTermProgress = (termId: string) => ({
  termId,
  status: 'new' as LearnStatus,
  seenCount: 0,
  cardCorrectCount: 0,
  cardWrongCount: 0,
  blitzCorrectCount: 0,
  blitzWrongCount: 0,
  writtenCorrectCount: 0,
  writtenWrongCount: 0,
  consecutiveCorrect: 0,
  confidence: 0,
  lastSeenAt: null,
  lastWrongAt: null,
  needsRetype: false,
});

export const createInitialLearnProgress = (
  terms: Term[],
  existing: LearnProgressMap = {},
): LearnProgressMap =>
  terms.reduce<LearnProgressMap>((accumulator, term) => {
    accumulator[term.id] = {
      ...createEmptyLearnTermProgress(term.id),
      ...existing[term.id],
    };
    return accumulator;
  }, {});

const getFocusSource = (terms: Term[], progress: LearnProgressMap, focus: LearnFocus) => {
  switch (focus) {
    case 'weak':
      return terms.filter((term) => progress[term.id]?.status === 'weak' || progress[term.id]?.needsRetype);
    case 'new':
      return terms.filter((term) => progress[term.id]?.status === 'new');
    case 'not-mastered':
      return terms.filter((term) => progress[term.id]?.status !== 'mastered');
    default:
      return terms;
  }
};

const getRoundNewTermCount = (pace: LearnPace) => {
  if (pace === 'thorough') return 5;
  if (pace === 'normal') return 6;
  return 7;
};

const getDueOffset = (pace: LearnPace, cramMode: boolean) => {
  if (cramMode) return 2;
  if (pace === 'thorough') return 4;
  if (pace === 'normal') return 3;
  return 2;
};

const recalculateStatus = (item: LearnProgressMap[string]) => {
  if (
    item.confidence >= 85 &&
    item.blitzCorrectCount >= 1 &&
    item.writtenCorrectCount >= 2 &&
    !item.needsRetype
  ) {
    return 'mastered' as LearnStatus;
  }

  if (item.needsRetype || item.writtenWrongCount > 0 || item.blitzWrongCount > 0 || item.confidence < 25) {
    return item.seenCount === 0 ? 'new' : ('weak' as LearnStatus);
  }

  if (item.writtenCorrectCount > 0 || item.confidence >= 55) {
    return 'almost' as LearnStatus;
  }

  return item.seenCount === 0 ? 'new' : ('learning' as LearnStatus);
};

const updateProgress = (
  progress: LearnProgressMap,
  termId: string,
  mutate: (item: LearnProgressMap[string]) => LearnProgressMap[string],
) => {
  const nextItem = mutate({ ...progress[termId] });
  nextItem.confidence = clamp(nextItem.confidence);
  nextItem.status = recalculateStatus(nextItem);
  return {
    ...progress,
    [termId]: nextItem,
  };
};

const getWeakestCarryOver = (ids: string[], progress: LearnProgressMap) =>
  [...ids]
    .sort((left, right) => {
      const leftItem = progress[left];
      const rightItem = progress[right];
      const leftScore = (leftItem.needsRetype ? 20 : 0) + (100 - leftItem.confidence) + leftItem.writtenWrongCount * 12 + leftItem.blitzWrongCount * 8;
      const rightScore = (rightItem.needsRetype ? 20 : 0) + (100 - rightItem.confidence) + rightItem.writtenWrongCount * 12 + rightItem.blitzWrongCount * 8;
      return rightScore - leftScore;
    })
    .slice(0, WEAK_TERMS_CARRY_OVER);

const makeImmediateQueue = (termIds: string[], mode: LearnQuestionMode): LearnQueueEntry[] =>
  shuffle(termIds).map((termId) => ({ termId, mode, dueStep: 0 }));

const makeMixedReviewQueue = (session: LearnSessionState, progress: LearnProgressMap): LearnQueueEntry[] => {
  const weak = session.introducedIds.filter((id) => progress[id]?.status === 'weak' || progress[id]?.needsRetype);
  const almost = session.introducedIds.filter((id) => {
    const status = progress[id]?.status;
    return status === 'almost' || status === 'learning';
  });
  const newIds = session.remainingNewIds.filter((id) => progress[id]?.status === 'new');
  const source = dedupe([
    ...weak.slice(0, 6),
    ...almost.slice(0, 4),
    ...newIds.slice(0, 2),
    ...session.currentBatchIds,
  ]).slice(0, MIXED_REVIEW_SIZE);
  const modes: LearnQuestionMode[] = session.settings.cramMode
    ? ['written', 'hard-blitz', 'written', 'recall-card']
    : ['recall-card', 'hard-blitz', 'written'];

  return source.map((termId, index) => ({
    termId,
    mode: modes[index % modes.length],
    dueStep: 0,
  }));
};

const makeFinalCheckQueue = (session: LearnSessionState, progress: LearnProgressMap): LearnQueueEntry[] => {
  const weakest = [...session.introducedIds]
    .filter((id) => progress[id])
    .sort((left, right) => progress[left].confidence - progress[right].confidence)
    .slice(0, 15);

  return weakest.map((termId, index) => ({
    termId,
    mode: index < 10 ? 'hard-blitz' : 'written',
    dueStep: 0,
  }));
};

const makeQueueForStage = (
  stage: LearnStage,
  session: LearnSessionState,
  progress: LearnProgressMap,
): LearnQueueEntry[] => {
  switch (stage) {
    case 'intro-cards':
      return makeImmediateQueue(session.currentBatchIds, 'intro-card');
    case 'recall-cards':
      return makeImmediateQueue(session.currentBatchIds, 'recall-card');
    case 'hard-blitz':
      return makeImmediateQueue(session.currentBatchIds, 'hard-blitz');
    case 'written':
      return makeImmediateQueue(
        [...session.currentBatchIds].sort((left, right) => {
          const leftItem = progress[left];
          const rightItem = progress[right];
          return Number(rightItem?.needsRetype) - Number(leftItem?.needsRetype);
        }),
        'written',
      );
    case 'mixed-review':
      return makeMixedReviewQueue(session, progress);
    case 'final-check':
      return makeFinalCheckQueue(session, progress);
    default:
      return [];
  }
};

function debugLearnTransition(message: string, session: LearnSessionState, next?: LearnSessionState) {
  const isDev = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV;
  if (isDev) {
    console.warn('[learn-engine]', message, {
      stage: session.stage,
      answered: session.stageAnswered,
      queueLength: session.queue.length,
      currentItem: session.currentItem?.termId ?? null,
      nextStage: next?.stage,
      nextQueueLength: next?.queue.length,
    });
  }
}

function repairEmptyQueue(
  session: LearnSessionState,
  progress: LearnProgressMap,
  terms: Term[],
): LearnSessionState {
  if (session.stage === 'session-complete' || session.currentItem || session.queue.length > 0) {
    return session;
  }

  const repaired = forceAdvanceStage(session, progress, terms, 'empty queue repair');
  debugLearnTransition('empty queue repaired', session, repaired);
  return repaired;
}

const withCurrentItem = (
  session: LearnSessionState,
  progress: LearnProgressMap,
  terms: Term[],
): LearnSessionState => {
  if (session.stage === 'session-complete') {
    return {
      ...session,
      currentItem: null,
    };
  }

  const repaired = repairEmptyQueue(session, progress, terms);
  const nextItem = getNextLearnItem(progress, terms, repaired);
  if (!nextItem) {
    return {
      ...repaired,
      stage: 'session-complete',
      currentItem: null,
    };
  }

  return {
    ...repaired,
    currentItem: nextItem,
    lastTermId: nextItem.termId,
  };
};

const createBaseSession = (
  currentBatchIds: string[],
  remainingNewIds: string[],
  settings: LearnSettings,
): LearnSessionState => ({
  stage: 'intro-cards',
  batchNumber: 1,
  currentBatchIds,
  remainingNewIds,
  introducedIds: [...currentBatchIds],
  totalSteps: 0,
  stageAnswered: 0,
  stageCorrect: 0,
  queue: makeImmediateQueue(currentBatchIds, 'intro-card'),
  recentModes: [],
  lastTermId: null,
  currentItem: null,
  settings,
  finalCheckRequested: false,
});

export const createLearnSession = (
  terms: Term[],
  progress: LearnProgressMap,
  settings: LearnSettings,
): LearnSessionState => {
  const focused = getFocusSource(terms, progress, settings.focus);
  const source = focused.length > 0 ? focused : terms;
  const batchSize = Math.min(settings.initialBatchSize, source.length);
  const currentBatchIds = source.slice(0, batchSize).map((term) => term.id);
  const remainingNewIds = source.slice(batchSize).map((term) => term.id);
  return withCurrentItem(createBaseSession(currentBatchIds, remainingNewIds, settings), progress, terms);
};

export const validateLearnSession = (
  session: LearnSessionState | null,
  terms: Term[],
  progress: LearnProgressMap,
): LearnSessionState | null => {
  if (!session || !learnStages.includes(session.stage)) {
    return null;
  }

  const termIds = new Set(terms.map((term) => term.id));
  const currentBatchIds = session.currentBatchIds.filter((id) => termIds.has(id));
  const introducedIds = session.introducedIds.filter((id) => termIds.has(id));
  const remainingNewIds = session.remainingNewIds.filter((id) => termIds.has(id));
  const queue = session.queue.filter((entry) => termIds.has(entry.termId));

  if (session.stage !== 'session-complete' && currentBatchIds.length === 0 && introducedIds.length === 0) {
    return null;
  }

  const sanitized: LearnSessionState = {
    ...session,
    currentBatchIds,
    introducedIds: introducedIds.length > 0 ? introducedIds : currentBatchIds,
    remainingNewIds,
    queue,
    stageAnswered: Math.max(0, session.stageAnswered),
    stageCorrect: Math.max(0, Math.min(session.stageCorrect, Math.max(0, session.stageAnswered))),
    currentItem: session.currentItem && termIds.has(session.currentItem.termId) ? session.currentItem : null,
  };

  const repaired = repairEmptyQueue(
    {
      ...sanitized,
      currentItem: sanitized.queue.some(
        (entry) => entry.termId === sanitized.currentItem?.termId && entry.mode === sanitized.currentItem?.mode,
      )
        ? sanitized.currentItem
        : null,
    },
    progress,
    terms,
  );

  return withCurrentItem(repaired, progress, terms);
};

export const deriveLearnProgressCounter = (session: LearnSessionState) => {
  const denominator = Math.max(session.stageAnswered + session.queue.length + (session.currentItem ? 0 : 0), 1);
  const numerator = session.stage === 'session-complete'
    ? denominator
    : Math.min(session.stageAnswered + 1, denominator);
  return { numerator, denominator };
};

export const getLearnWeight = (
  item: LearnProgressMap[string],
  session: LearnSessionState,
  mode: LearnQuestionMode,
) => {
  let weight = 10;
  if (item.status === 'weak') weight += 22;
  if (item.status === 'almost') weight += 10;
  if (item.status === 'mastered') weight -= 10;
  if (item.needsRetype) weight += mode === 'written' ? 36 : 10;
  if (item.lastWrongAt && Date.now() - item.lastWrongAt < 1000 * 60 * 60 * 24) weight += 10;
  if (item.writtenWrongCount > 0) weight += 14;
  if (item.consecutiveCorrect === 0) weight += 10;
  if (item.confidence < 50) weight += 16;
  if (item.confidence > 85) weight -= 8;
  if (item.consecutiveCorrect >= 3) weight -= 6;
  if (session.currentBatchIds.includes(item.termId)) weight += 6;
  return Math.max(1, weight);
};

const pickWeightedTermId = (
  ids: string[],
  progress: LearnProgressMap,
  session: LearnSessionState,
  mode: LearnQuestionMode,
) => {
  const candidates = ids.filter((id) => id !== session.lastTermId);
  const source = candidates.length > 0 ? candidates : ids;
  const weightedPool = source.flatMap((id) => Array.from({ length: getLearnWeight(progress[id], session, mode) }, () => id));
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
};

export const getNextLearnItem = (
  progress: LearnProgressMap,
  terms: Term[],
  session: LearnSessionState,
): LearnItem | null => {
  if (session.stage === 'session-complete') {
    return null;
  }

  const dueItem = session.queue.find(
    (entry) => entry.dueStep <= session.totalSteps && entry.termId !== session.lastTermId,
  ) ?? session.queue.find((entry) => entry.dueStep <= session.totalSteps);

  if (dueItem) {
    return {
      termId: dueItem.termId,
      mode: dueItem.mode,
      stage: session.stage,
    };
  }

  return null;
};

const queueForRepeat = (
  queue: LearnQueueEntry[],
  termId: string,
  mode: LearnQuestionMode,
  _currentStep: number,
  _settings: LearnSettings,
) => [
  ...queue,
  {
    termId,
    mode,
    dueStep: 0,
  },
];

const shouldAdvanceRecall = (session: LearnSessionState, progress: LearnProgressMap) => {
  const confident = session.currentBatchIds.filter((id) => progress[id].confidence >= 35).length;
  return session.queue.length === 0 && (confident / session.currentBatchIds.length >= 0.7 || session.stageAnswered > 0);
};

const shouldAdvanceBlitz = (session: LearnSessionState) =>
  session.queue.length === 0 && session.stageAnswered > 0;

const shouldAdvanceWritten = (session: LearnSessionState, progress: LearnProgressMap) =>
  session.queue.length === 0 &&
  session.stageAnswered > 0 &&
  session.currentBatchIds.every((id) => progress[id].writtenCorrectCount >= 1 || !session.introducedIds.includes(id));

const shouldAddNewTerms = (session: LearnSessionState, progress: LearnProgressMap) => {
  const confident = session.currentBatchIds.filter((id) => progress[id].confidence >= 70).length;
  return session.queue.length === 0 && confident / session.currentBatchIds.length >= 0.7;
};

const createNextBatch = (
  session: LearnSessionState,
  progress: LearnProgressMap,
): Pick<LearnSessionState, 'currentBatchIds' | 'remainingNewIds' | 'introducedIds' | 'batchNumber' | 'queue'> => {
  const carryOver = getWeakestCarryOver(session.currentBatchIds, progress);
  const newCount = Math.min(getRoundNewTermCount(session.settings.pace), session.remainingNewIds.length);
  const newIds = session.remainingNewIds.slice(0, newCount);
  const nextCurrentBatchIds = dedupe([...carryOver, ...newIds]);
  return {
    currentBatchIds: nextCurrentBatchIds,
    remainingNewIds: session.remainingNewIds.slice(newCount),
    introducedIds: dedupe([...session.introducedIds, ...newIds]),
    batchNumber: session.batchNumber + 1,
    queue: makeImmediateQueue(nextCurrentBatchIds, 'intro-card'),
  };
};

const maybeAdvanceStage = (
  session: LearnSessionState,
  progress: LearnProgressMap,
): LearnSessionState => {
  if (session.finalCheckRequested && session.stage !== 'final-check' && session.stage !== 'session-complete') {
    const next: LearnSessionState = {
      ...session,
      stage: 'final-check',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('final-check', session, progress),
      currentItem: null,
    };
    debugLearnTransition('final check requested', session, next);
    return next;
  }

  if (session.stage === 'intro-cards' && session.queue.length === 0) {
    const next: LearnSessionState = {
      ...session,
      stage: 'recall-cards',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('recall-cards', session, progress),
      currentItem: null,
    };
    debugLearnTransition('intro complete', session, next);
    return next;
  }

  if (session.stage === 'recall-cards' && (shouldAdvanceRecall(session, progress) || session.queue.length === 0)) {
    const next: LearnSessionState = {
      ...session,
      stage: 'hard-blitz',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('hard-blitz', session, progress),
      currentItem: null,
    };
    debugLearnTransition('recall complete', session, next);
    return next;
  }

  if (session.stage === 'hard-blitz' && shouldAdvanceBlitz(session)) {
    const next: LearnSessionState = {
      ...session,
      stage: 'written',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('written', session, progress),
      currentItem: null,
    };
    debugLearnTransition('hard blitz complete', session, next);
    return next;
  }

  if (session.stage === 'written' && shouldAdvanceWritten(session, progress)) {
    const next: LearnSessionState = {
      ...session,
      stage: 'mixed-review',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('mixed-review', session, progress),
      currentItem: null,
    };
    debugLearnTransition('written complete', session, next);
    return next;
  }

  if (session.stage === 'mixed-review' && shouldAddNewTerms(session, progress)) {
    if (session.remainingNewIds.length > 0) {
      const nextBatch = createNextBatch(session, progress);
      const next: LearnSessionState = {
        ...session,
        ...nextBatch,
        stage: 'intro-cards',
        stageAnswered: 0,
        stageCorrect: 0,
        currentItem: null,
      };
      debugLearnTransition('mixed review complete, next batch', session, next);
      return next;
    }

    const next: LearnSessionState = {
      ...session,
      stage: 'final-check',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('final-check', session, progress),
      currentItem: null,
    };
    debugLearnTransition('mixed review complete, final check', session, next);
    return next;
  }

  if (session.stage === 'mixed-review' && session.queue.length === 0 && session.remainingNewIds.length > 0) {
    const nextBatch = createNextBatch(session, progress);
    const next: LearnSessionState = {
      ...session,
      ...nextBatch,
      stage: 'intro-cards' as LearnStage,
      stageAnswered: 0,
      stageCorrect: 0,
      currentItem: null,
    };
    debugLearnTransition('mixed review exhausted, next batch', session, next);
    return next;
  }

  if (session.stage === 'mixed-review' && session.queue.length === 0) {
    const next: LearnSessionState = {
      ...session,
      stage: 'final-check',
      stageAnswered: 0,
      stageCorrect: 0,
      queue: makeQueueForStage('final-check', session, progress),
      currentItem: null,
    };
    debugLearnTransition('mixed review exhausted', session, next);
    return next;
  }

  if (session.stage === 'final-check' && session.queue.length === 0) {
    const next: LearnSessionState = {
      ...session,
      stage: 'session-complete',
      currentItem: null,
    };
    debugLearnTransition('session complete', session, next);
    return next;
  }

  return session;
};

function forceAdvanceStage(
  session: LearnSessionState,
  progress: LearnProgressMap,
  terms: Term[],
  reason: string,
): LearnSessionState {
  const forcedSession = {
    ...session,
    queue: [],
    currentItem: null,
  };
  const advanced = maybeAdvanceStage(forcedSession, progress);

  if (advanced !== forcedSession && advanced.queue.length > 0) {
    return advanced;
  }

  if (session.stage !== 'session-complete') {
    const rebuiltQueue = makeQueueForStage(session.stage, session, progress).filter((entry) =>
      terms.some((term) => term.id === entry.termId),
    );
    if (rebuiltQueue.length > 0) {
      const next: LearnSessionState = {
        ...session,
        queue: rebuiltQueue,
        currentItem: null,
      };
      debugLearnTransition(reason, session, next);
      return next;
    }
  }

  return advanced;
}

const removeAnsweredEntry = (queue: LearnQueueEntry[], termId: string, mode: LearnQuestionMode) => {
  const index = queue.findIndex((entry) => entry.termId === termId && entry.mode === mode);
  return index >= 0 ? queue.filter((_, itemIndex) => itemIndex !== index) : queue;
};

const consumeStep = (session: LearnSessionState, termId: string, mode: LearnQuestionMode, correct: boolean) => ({
  ...session,
  totalSteps: session.totalSteps + 1,
  stageAnswered: session.stageAnswered + 1,
  stageCorrect: session.stageCorrect + (correct ? 1 : 0),
  queue: removeAnsweredEntry(session.queue, termId, mode),
  recentModes: [...session.recentModes.slice(-3), mode],
  lastTermId: termId,
  currentItem: null,
});

export const applyLearnCardAssessment = (
  progress: LearnProgressMap,
  session: LearnSessionState,
  termId: string,
  assessment: 'know' | 'confuse' | 'dontknow' | 'remembered' | 'partial' | 'forgot',
) => {
  const isStrong = assessment === 'know' || assessment === 'remembered';
  const isPartial = assessment === 'confuse' || assessment === 'partial';
  const delta = isStrong ? 15 : isPartial ? 5 : -15;

  const nextProgress = updateProgress(progress, termId, (item) => ({
    ...item,
    seenCount: item.seenCount + 1,
    cardCorrectCount: item.cardCorrectCount + (isStrong ? 1 : 0),
    cardWrongCount: item.cardWrongCount + (isStrong ? 0 : 1),
    consecutiveCorrect: isStrong ? item.consecutiveCorrect + 1 : 0,
    confidence: item.confidence + delta,
    lastSeenAt: Date.now(),
    lastWrongAt: isStrong ? item.lastWrongAt : Date.now(),
  }));

  const consumedSession = consumeStep(session, termId, session.currentItem?.mode ?? 'recall-card', isStrong);
  const nextQueue =
    isStrong
      ? consumedSession.queue
      : queueForRepeat(consumedSession.queue, termId, 'recall-card', consumedSession.totalSteps, session.settings);

  const updatedSession = maybeAdvanceStage(
    {
      ...consumedSession,
      queue: nextQueue,
    },
    nextProgress,
  );

  return {
    progress: nextProgress,
    session: withCurrentItem(updatedSession, nextProgress, [] as Term[]),
  };
};

export const applyLearnBlitzAssessment = (
  progress: LearnProgressMap,
  session: LearnSessionState,
  termId: string,
  correct: boolean,
) => {
  const nextProgress = updateProgress(progress, termId, (item) => ({
    ...item,
    seenCount: item.seenCount + 1,
    blitzCorrectCount: item.blitzCorrectCount + (correct ? 1 : 0),
    blitzWrongCount: item.blitzWrongCount + (correct ? 0 : 1),
    consecutiveCorrect: correct ? item.consecutiveCorrect + 1 : 0,
    confidence: item.confidence + (correct ? 10 : -15),
    lastSeenAt: Date.now(),
    lastWrongAt: correct ? item.lastWrongAt : Date.now(),
  }));

  const consumedSession = consumeStep(session, termId, 'hard-blitz', correct);
  const nextQueue = correct
    ? consumedSession.queue
    : queueForRepeat(consumedSession.queue, termId, 'hard-blitz', consumedSession.totalSteps, session.settings);

  const updatedSession = maybeAdvanceStage(
    {
      ...consumedSession,
      queue: nextQueue,
    },
    nextProgress,
  );

  return {
    progress: nextProgress,
    session: updatedSession,
  };
};

export const applyLearnWrittenAssessment = (
  progress: LearnProgressMap,
  session: LearnSessionState,
  termId: string,
  comparison: AnswerComparison,
) => {
  const correct = comparison.verdict === 'correct';
  const almost = comparison.verdict === 'almost';
  const delta = correct ? 25 : almost ? 10 : -25;
  const needsRetype = !correct;

  const nextProgress = updateProgress(progress, termId, (item) => ({
    ...item,
    seenCount: item.seenCount + 1,
    writtenCorrectCount: item.writtenCorrectCount + (correct ? 1 : 0),
    writtenWrongCount: item.writtenWrongCount + (correct ? 0 : 1),
    consecutiveCorrect: correct ? item.consecutiveCorrect + 1 : 0,
    confidence: item.confidence + delta,
    lastSeenAt: Date.now(),
    lastWrongAt: correct ? item.lastWrongAt : Date.now(),
    needsRetype,
  }));

  const consumedSession = consumeStep(session, termId, 'written', correct);
  const nextQueue =
    needsRetype || comparison.verdict === 'almost'
      ? queueForRepeat(consumedSession.queue, termId, 'written', consumedSession.totalSteps, session.settings)
      : consumedSession.queue;

  const updatedSession = maybeAdvanceStage(
    {
      ...consumedSession,
      queue: nextQueue,
    },
    nextProgress,
  );

  return {
    progress: nextProgress,
    session: updatedSession,
  };
};

export const finalizeLearnStep = (
  session: LearnSessionState,
  progress: LearnProgressMap,
  terms: Term[],
) => withCurrentItem(maybeAdvanceStage(session, progress), progress, terms);

export const requestFinalCheck = (session: LearnSessionState, progress: LearnProgressMap, terms: Term[]) =>
  withCurrentItem(
    maybeAdvanceStage(
      {
        ...session,
        finalCheckRequested: true,
      },
      progress,
    ),
    progress,
    terms,
  );

export const getLearnStageTitle = (stage: LearnStage) => {
  switch (stage) {
    case 'intro-cards':
      return 'Знакомство';
    case 'recall-cards':
      return 'Активное вспоминание';
    case 'hard-blitz':
      return 'Жёсткий блиц';
    case 'written':
      return 'Письменный ответ';
    case 'mixed-review':
      return 'Смешанное повторение';
    case 'final-check':
      return 'Финальная проверка';
    default:
      return 'Сессия завершена';
  }
};

export const getLearnSummary = (progress: LearnProgressMap, termIds: string[]) => {
  const subset = termIds.map((id) => progress[id]);
  const mastered = subset.filter((item) => item.status === 'mastered').length;
  const almost = subset.filter((item) => item.status === 'almost').length;
  const weak = subset.filter((item) => item.status === 'weak').length;
  const learning = subset.filter((item) => item.status === 'learning').length;
  const needsRetype = subset.filter((item) => item.needsRetype).length;
  const writtenAttempts = subset.reduce((sum, item) => sum + item.writtenCorrectCount + item.writtenWrongCount, 0);
  const writtenCorrect = subset.reduce((sum, item) => sum + item.writtenCorrectCount, 0);
  const blitzAttempts = subset.reduce((sum, item) => sum + item.blitzCorrectCount + item.blitzWrongCount, 0);
  const blitzCorrect = subset.reduce((sum, item) => sum + item.blitzCorrectCount, 0);

  return {
    mastered,
    almost,
    weak,
    learning,
    needsRetype,
    writtenAccuracy: writtenAttempts === 0 ? 0 : Math.round((writtenCorrect / writtenAttempts) * 100),
    blitzAccuracy: blitzAttempts === 0 ? 0 : Math.round((blitzCorrect / blitzAttempts) * 100),
  };
};
