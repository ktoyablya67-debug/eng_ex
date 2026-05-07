import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../app/StudyContext';
import { BlitzMode } from '../components/BlitzMode';
import { CardTrainer } from '../components/CardTrainer';
import { WrittenTest } from '../components/WrittenTest';

export function ExamModePage() {
  const { progress, markBlitz, markCard, markWritten, examPlan, weakTerms } = useStudy();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = ['Слабые термины', 'Письменный добор', 'Жёсткий блиц', 'Финальный список'];

  return (
    <div className="page page--exam">
      <section className="page-header page-header--compact">
        <span className="eyebrow">Exam sprint</span>
        <h1>Экзамен через 10 минут</h1>
        <p>Шаг {step + 1} / 4. Одна задача на экран, минимум лишнего.</p>
      </section>

      <div className="step-strip">
        {steps.map((label, index) => (
          <div key={label} className={`step-chip ${index === step ? 'is-active' : index < step ? 'is-done' : ''}`}>
            {index + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <CardTrainer
          terms={examPlan.weak}
          progress={progress}
          title="Шаг 1. Быстрый прогон слабых"
          subtitle="Сначала добиваем то, что чаще всего ломается."
          sessionLength={Math.max(examPlan.weak.length, 6)}
          compact
          onRate={markCard}
          onExit={() => navigate('/')}
          onComplete={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <WrittenTest
          terms={examPlan.tricky}
          progress={progress}
          title="Шаг 2. Письменный добор"
          subtitle="Теперь самые проблемные термины нужно написать руками."
          sessionLength={Math.max(examPlan.tricky.length, 6)}
          compact
          onJudged={markWritten}
          onExit={() => navigate('/')}
          onOpenWeakSpots={() => navigate('/weak-spots')}
          onComplete={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <BlitzMode
          terms={examPlan.blitz}
          progress={progress}
          title="Шаг 3. Жёсткий блиц"
          subtitle="Финальный тест на скорость и точность формулировки."
          sessionLength={Math.max(Math.min(examPlan.blitz.length, 12), 8)}
          durationSec={5}
          compact
          onAnswered={markBlitz}
          onExit={() => navigate('/')}
          onComplete={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <section className="trainer-card final-check-card">
          <span className="eyebrow">Final review</span>
          <h2>Шаг 4. Что ещё повторить</h2>
          <p>Слабые термины не прячем. Это твой список последних побед перед экзаменом.</p>
          <div className="weak-list compact-grid">
            {weakTerms.slice(0, 8).map(({ term, score }) => (
              <article className="weak-item weak-item--stacked" key={term.id}>
                <div>
                  <div className="weak-item__abbr">{term.abbr}</div>
                  <div className="weak-item__answer">{term.answers.join(' / ')}</div>
                </div>
                <div className="weak-item__stats">
                  <strong>priority {score}</strong>
                </div>
              </article>
            ))}
          </div>
          <div className="action-row">
            <button className="button" onClick={() => navigate('/weak-spots')} type="button">
              В слабые места
            </button>
            <button className="button button--secondary" onClick={() => navigate('/written-test')} type="button">
              Сразу в письменный тест
            </button>
            <button className="button button--ghost" onClick={() => navigate('/')} type="button">
              На главную
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
