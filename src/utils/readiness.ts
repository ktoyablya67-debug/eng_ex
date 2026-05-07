import { ProgressMap, Term } from '../types';

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

export function calculateReadiness(progress: ProgressMap, terms: Term[]) {
  const total = terms.length;
  const entries = terms.map((term) => progress[term.id]);
  const seen = entries.filter(
    (item) => item.cardReviews > 0 || item.writtenAttempts > 0 || item.blitzAttempts > 0,
  ).length;
  const weak = entries.filter((item) => item.status === 'confuse' || item.status === 'dontknow' || item.mistakes > 0).length;
  const mastered = entries.filter(
    (item) => item.status === 'know' && item.writtenCorrect >= 2 && item.blitzCorrect >= 1,
  ).length;
  const almost = entries.filter(
    (item) =>
      item.status !== 'new' &&
      item.status !== 'dontknow' &&
      item.status !== 'confuse' &&
      !(item.status === 'know' && item.writtenCorrect >= 2 && item.blitzCorrect >= 1),
  ).length + entries.filter((item) => item.status === 'confuse' && item.writtenCorrect > 0).length;
  const writtenAttempts = entries.reduce((sum, item) => sum + item.writtenAttempts, 0);
  const writtenCorrect = entries.reduce((sum, item) => sum + item.writtenCorrect, 0);
  const blitzAttempts = entries.reduce((sum, item) => sum + item.blitzAttempts, 0);
  const blitzCorrect = entries.reduce((sum, item) => sum + item.blitzCorrect, 0);

  const masteredRatio = total === 0 ? 0 : mastered / total;
  const almostRatio = total === 0 ? 0 : almost / total;
  const seenRatio = total === 0 ? 0 : seen / total;
  const weakRatio = total === 0 ? 0 : weak / total;
  const writtenAccuracyRatio = writtenAttempts === 0 ? 0 : writtenCorrect / writtenAttempts;
  const blitzAccuracyRatio = blitzAttempts === 0 ? 0 : blitzCorrect / blitzAttempts;

  const readiness = Math.round(
    clamp(
      masteredRatio * 45 +
        almostRatio * 20 +
        writtenAccuracyRatio * 20 +
        blitzAccuracyRatio * 10 +
        seenRatio * 5 -
        weakRatio * 10,
    ),
  );

  let readinessStatus = 'Начало';
  let readinessAdvice = 'Начни с режима «Заучивание».';

  if (readiness >= 80) {
    readinessStatus = 'Готова';
    readinessAdvice = 'Запускай экзамен-режим и добей последние слабые места.';
  } else if (readiness >= 60) {
    readinessStatus = 'Почти готова';
    readinessAdvice = 'Переходи к письменным ответам и финальной проверке.';
  } else if (readiness >= 35) {
    readinessStatus = 'Нормально';
    readinessAdvice = weak > 0 ? 'Повтори слабые термины.' : 'Добавь письменный тест.';
  } else if (readiness >= 12) {
    readinessStatus = 'Разгон';
    readinessAdvice = 'Продолжай заучивание маленькими партиями.';
  }

  return {
    seen,
    weak,
    mastered,
    almost,
    writtenAccuracy: Math.round(writtenAccuracyRatio * 100),
    blitzAccuracy: Math.round(blitzAccuracyRatio * 100),
    coverage: Math.round(seenRatio * 100),
    readiness,
    readinessStatus,
    readinessAdvice,
  };
}
