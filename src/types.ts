export type StudyStatus = 'new' | 'know' | 'confuse' | 'dontknow';

export type FilterKey =
  | 'all'
  | 'know'
  | 'confuse'
  | 'dontknow'
  | 'errors'
  | 'unseen';

export type ModeKey = 'dashboard' | 'cards' | 'written' | 'blitz' | 'weak' | 'exam';

export type AnswerVerdict = 'correct' | 'incorrect' | 'almost';
export type LearnStage =
  | 'intro-cards'
  | 'recall-cards'
  | 'hard-blitz'
  | 'written'
  | 'mixed-review'
  | 'final-check'
  | 'session-complete';

export type LearnStatus = 'new' | 'learning' | 'weak' | 'almost' | 'mastered';
export type LearnQuestionMode = 'intro-card' | 'recall-card' | 'hard-blitz' | 'written';
export type LearnPace = 'cram' | 'normal' | 'thorough';
export type LearnFocus = 'all' | 'weak' | 'new' | 'not-mastered';

export interface Term {
  id: string;
  abbr: string;
  answers: string[];
  translation: string;
  memoryHint: string;
  category?: string;
  note?: string;
}

export interface TermProgress {
  status: StudyStatus;
  successes: number;
  mistakes: number;
  cardReviews: number;
  writtenAttempts: number;
  writtenCorrect: number;
  blitzAttempts: number;
  blitzCorrect: number;
  repeatLater: number;
  currentStreak: number;
  bestStreak: number;
  lastSeenAt: number | null;
  lastMistakeAt: number | null;
}

export type ProgressMap = Record<string, TermProgress>;

export interface ProgressStats {
  total: number;
  studied: number;
  know: number;
  weak: number;
  mastered: number;
  almost: number;
  writtenAccuracy: number;
  blitzAccuracy: number;
  coverage: number;
  streak: number;
  readiness: number;
  readinessStatus: string;
  readinessAdvice: string;
}

export interface WordDifference {
  expected: string;
  actual: string;
}

export interface AnswerComparison {
  verdict: AnswerVerdict;
  matchedAnswer: string;
  normalizedInput: string;
  differences: WordDifference[];
}

export interface LearnTermProgress {
  termId: string;
  status: LearnStatus;
  seenCount: number;
  cardCorrectCount: number;
  cardWrongCount: number;
  blitzCorrectCount: number;
  blitzWrongCount: number;
  writtenCorrectCount: number;
  writtenWrongCount: number;
  consecutiveCorrect: number;
  confidence: number;
  lastSeenAt: number | null;
  lastWrongAt: number | null;
  needsRetype: boolean;
}

export type LearnProgressMap = Record<string, LearnTermProgress>;

export interface LearnSettings {
  initialBatchSize: number;
  pace: LearnPace;
  focus: LearnFocus;
  cramMode: boolean;
}

export interface LearnQueueEntry {
  termId: string;
  mode: LearnQuestionMode;
  dueStep: number;
}

export interface LearnItem {
  termId: string;
  mode: LearnQuestionMode;
  stage: LearnStage;
}

export interface LearnSessionState {
  stage: LearnStage;
  batchNumber: number;
  currentBatchIds: string[];
  remainingNewIds: string[];
  introducedIds: string[];
  totalSteps: number;
  stageAnswered: number;
  stageCorrect: number;
  queue: LearnQueueEntry[];
  recentModes: LearnQuestionMode[];
  lastTermId: string | null;
  currentItem: LearnItem | null;
  settings: LearnSettings;
  finalCheckRequested: boolean;
}
