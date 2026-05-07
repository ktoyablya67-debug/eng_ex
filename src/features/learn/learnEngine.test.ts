import { describe, expect, it } from 'vitest';
import { terms } from '../../data/terms';
import { compareAnswer } from '../../utils/answerCheck';
import {
  INITIAL_BATCH_SIZE,
  applyLearnBlitzAssessment,
  applyLearnCardAssessment,
  applyLearnWrittenAssessment,
  createInitialLearnProgress,
  createLearnSession,
  deriveLearnProgressCounter,
  finalizeLearnStep,
  getLearnWeight,
  validateLearnSession,
} from './learnEngine';
import { LearnProgressMap, LearnSessionState, Term } from '../../types';

const sampleTerms = terms.slice(0, 20);
const smallTerms = terms.slice(0, 3);

const settings = {
  initialBatchSize: 3,
  pace: 'cram' as const,
  focus: 'all' as const,
  cramMode: true,
};

const makeHardBlitzSession = (
  testTerms: Term[],
  progress: LearnProgressMap,
  queueLength = testTerms.length,
): LearnSessionState => {
  const batchIds = testTerms.map((term) => term.id);
  const queue = batchIds.slice(0, queueLength).map((termId) => ({
    termId,
    mode: 'hard-blitz' as const,
    dueStep: 0,
  }));

  return {
    ...createLearnSession(testTerms, progress, settings),
    stage: 'hard-blitz',
    currentBatchIds: batchIds,
    introducedIds: batchIds,
    remainingNewIds: [],
    queue,
    currentItem: queue[0] ? { termId: queue[0].termId, mode: 'hard-blitz', stage: 'hard-blitz' } : null,
    stageAnswered: 0,
    stageCorrect: 0,
    lastTermId: null,
  };
};

describe('learnEngine', () => {
  it('starts with a batch of 10 terms', () => {
    const progress = createInitialLearnProgress(sampleTerms);
    const session = createLearnSession(sampleTerms, progress, {
      initialBatchSize: INITIAL_BATCH_SIZE,
      pace: 'cram',
      focus: 'all',
      cramMode: true,
    });

    expect(session.currentBatchIds).toHaveLength(10);
    expect(session.stage).toBe('intro-cards');
  });

  it('gives weak terms a higher weight than mastered terms', () => {
    const progress = createInitialLearnProgress(sampleTerms);
    progress[sampleTerms[0].id].status = 'weak';
    progress[sampleTerms[0].id].confidence = 10;
    progress[sampleTerms[1].id].status = 'mastered';
    progress[sampleTerms[1].id].confidence = 92;
    const session = createLearnSession(sampleTerms, progress, {
      initialBatchSize: 10,
      pace: 'normal',
      focus: 'all',
      cramMode: false,
    });

    expect(getLearnWeight(progress[sampleTerms[0].id], session, 'written')).toBeGreaterThan(
      getLearnWeight(progress[sampleTerms[1].id], session, 'written'),
    );
  });

  it('returns needsRetype terms back into written flow', () => {
    const progress = createInitialLearnProgress(sampleTerms);
    let session = createLearnSession(sampleTerms, progress, {
      initialBatchSize: 10,
      pace: 'cram',
      focus: 'all',
      cramMode: true,
    });
    session = {
      ...session,
      stage: 'written',
      currentItem: { termId: sampleTerms[0].id, mode: 'written', stage: 'written' },
      queue: [],
    };

    const comparison = compareAnswer('wrong answer', sampleTerms[0].answers);
    const updated = applyLearnWrittenAssessment(progress, session, sampleTerms[0].id, comparison);
    const finalized = finalizeLearnStep(updated.session, updated.progress, sampleTerms);

    expect(updated.progress[sampleTerms[0].id].needsRetype).toBe(true);
    expect(finalized.queue.some((entry) => entry.termId === sampleTerms[0].id && entry.mode === 'written')).toBe(true);
  });

  it('keeps PC dual meanings as separate learn entries', () => {
    const progress = createInitialLearnProgress(terms);
    expect(progress['PC-personal']).toBeDefined();
    expect(progress['PC-counter']).toBeDefined();
    expect(progress['PC-personal'].termId).not.toBe(progress['PC-counter'].termId);
  });

  it('hard-blitz correct answer advances to the next queued item', () => {
    const progress = createInitialLearnProgress(smallTerms);
    const session = makeHardBlitzSession(smallTerms, progress, 3);
    const answeredTermId = session.currentItem?.termId as string;

    const updated = applyLearnBlitzAssessment(progress, session, answeredTermId, true);
    const finalized = finalizeLearnStep(updated.session, updated.progress, smallTerms);

    expect(finalized.stage).toBe('hard-blitz');
    expect(finalized.stageAnswered).toBe(1);
    expect(finalized.queue).toHaveLength(2);
    expect(finalized.currentItem?.termId).not.toBe(answeredTermId);
  });

  it('hard-blitz last correct answer advances to written', () => {
    const progress = createInitialLearnProgress(smallTerms);
    const session = makeHardBlitzSession(smallTerms, progress, 1);
    const answeredTermId = session.currentItem?.termId as string;

    const updated = applyLearnBlitzAssessment(progress, session, answeredTermId, true);
    const finalized = finalizeLearnStep(updated.session, updated.progress, smallTerms);

    expect(finalized.stage).toBe('written');
    expect(finalized.queue.every((entry) => entry.mode === 'written')).toBe(true);
    expect(finalized.currentItem?.mode).toBe('written');
    expect(finalized.stageAnswered).toBe(0);
  });

  it('hard-blitz wrong answer marks weak without restarting the stage', () => {
    const progress = createInitialLearnProgress(smallTerms);
    const session = makeHardBlitzSession(smallTerms, progress, 3);
    const answeredTermId = session.currentItem?.termId as string;

    const updated = applyLearnBlitzAssessment(progress, session, answeredTermId, false);
    const finalized = finalizeLearnStep(updated.session, updated.progress, smallTerms);

    expect(updated.progress[answeredTermId].status).toBe('weak');
    expect(finalized.stage).toBe('hard-blitz');
    expect(finalized.stageAnswered).toBe(1);
    expect(finalized.currentItem?.termId).not.toBe(answeredTermId);
    expect(finalized.queue.some((entry) => entry.termId === answeredTermId && entry.mode === 'hard-blitz')).toBe(true);
  });

  it('progress counter never exceeds denominator', () => {
    const progress = createInitialLearnProgress(smallTerms);
    const session = {
      ...makeHardBlitzSession(smallTerms, progress, 1),
      stageAnswered: 5,
    };

    const counter = deriveLearnProgressCounter(session);

    expect(counter.numerator).toBeLessThanOrEqual(counter.denominator);
    expect(counter).toEqual({ numerator: 6, denominator: 6 });
  });

  it('empty hard-blitz queue transitions safely to written', () => {
    const progress = createInitialLearnProgress(smallTerms);
    const brokenSession = {
      ...makeHardBlitzSession(smallTerms, progress, 0),
      stageAnswered: smallTerms.length,
      currentItem: null,
      queue: [],
    };

    const repaired = validateLearnSession(brokenSession, smallTerms, progress);

    expect(repaired?.stage).toBe('written');
    expect(repaired?.currentItem?.mode).toBe('written');
  });

  it('repairs restored invalid sessions with an out-of-date current item', () => {
    const progress = createInitialLearnProgress(smallTerms);
    const brokenSession = {
      ...makeHardBlitzSession(smallTerms, progress, 0),
      currentItem: { termId: 'missing', mode: 'hard-blitz' as const, stage: 'hard-blitz' as const },
      queue: [],
      stageAnswered: smallTerms.length,
    };

    const repaired = validateLearnSession(brokenSession, smallTerms, progress);

    expect(repaired).not.toBeNull();
    expect(repaired?.currentItem?.termId).not.toBe('missing');
    expect(repaired?.stage).toBe('written');
  });

  it('full learn flow can reach session-complete without infinite loops', () => {
    let progress = createInitialLearnProgress(smallTerms);
    let session = createLearnSession(smallTerms, progress, settings);

    for (let step = 0; step < 100 && session.stage !== 'session-complete'; step += 1) {
      const item = session.currentItem;
      expect(item).not.toBeNull();
      const term = smallTerms.find((candidate) => candidate.id === item?.termId) as Term;

      if (item?.mode === 'intro-card' || item?.mode === 'recall-card') {
        const updated = applyLearnCardAssessment(progress, session, term.id, item.mode === 'intro-card' ? 'know' : 'remembered');
        progress = updated.progress;
        session = finalizeLearnStep(updated.session, progress, smallTerms);
      } else if (item?.mode === 'hard-blitz') {
        const updated = applyLearnBlitzAssessment(progress, session, term.id, true);
        progress = updated.progress;
        session = finalizeLearnStep(updated.session, progress, smallTerms);
      } else if (item?.mode === 'written') {
        const updated = applyLearnWrittenAssessment(progress, session, term.id, compareAnswer(term.answers[0], term.answers));
        progress = updated.progress;
        session = finalizeLearnStep(updated.session, progress, smallTerms);
      }
    }

    expect(session.stage).toBe('session-complete');
  });
});
