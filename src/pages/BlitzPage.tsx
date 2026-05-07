import { useNavigate } from 'react-router-dom';
import { useStudy } from '../app/StudyContext';
import { BlitzMode } from '../components/BlitzMode';
import { terms } from '../data/terms';

export function BlitzPage() {
  const { progress, markBlitz } = useStudy();
  const navigate = useNavigate();

  return (
    <div className="page">
      <section className="page-header">
        <span className="eyebrow">Hard blitz</span>
        <h1>Жёсткий блиц</h1>
        <p>По умолчанию включён режим без лёгких подсказок. Варианты ответа похожи друг на друга и проверяют именно точное знание.</p>
      </section>
      <BlitzMode
        terms={terms}
        progress={progress}
        title="Жёсткий блиц"
        subtitle="Четыре варианта вертикально, таймер сверху и экран ошибок в конце."
        onAnswered={markBlitz}
        onExit={() => navigate('/')}
      />
    </div>
  );
}
