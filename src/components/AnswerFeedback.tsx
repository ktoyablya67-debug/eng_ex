import { AnswerComparison, Term } from '../types';
import { buildHint } from '../utils/answerCheck';

export function AnswerFeedback({
  term,
  answer,
  result,
}: {
  term: Term;
  answer: string;
  result: AnswerComparison;
}) {
  return (
    <div className={`answer-feedback answer-feedback--${result.verdict}`}>
      <strong>
        {result.verdict === 'correct' ? 'Точно' : result.verdict === 'almost' ? 'Почти' : 'Ошибка'}
      </strong>
      <p>Правильный ответ: {term.answers.join(' / ')}</p>
      <p>Твой ответ: {answer}</p>
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
      <div className="hint-box">
        <span>Подсказка</span>
        <p>{buildHint(term.answers[0])}</p>
      </div>
    </div>
  );
}
