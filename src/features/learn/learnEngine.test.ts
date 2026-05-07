import { describe, expect, it } from 'vitest';
import { terms } from '../../data/terms';
import { compareAnswer } from '../../utils/answerCheck';
import {
  INITIAL_BATCH_SIZE,
  applyLearnWrittenAssessment,
  createInitialLearnProgress,
  createLearnSession,
  finalizeLearnStep,
  getLearnWeight,
} from './learnEngine';

const sampleTerms = terms.slice(0, 20);

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
});
