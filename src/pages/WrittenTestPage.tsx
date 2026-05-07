import { useNavigate } from 'react-router-dom';
import { useStudy } from '../app/StudyContext';
import { WrittenTest } from '../components/WrittenTest';
import { terms } from '../data/terms';

export function WrittenTestPage() {
  const { progress, markWritten } = useStudy();
  const navigate = useNavigate();

  return (
    <div className="page">
      <section className="page-header">
        <span className="eyebrow">Written test</span>
        <h1>Письменный тест</h1>
        <p>Самый полезный режим перед экзаменом. Пиши полную английскую расшифровку без подсказок и смотри разбор ошибки сразу под полем.</p>
      </section>
      <WrittenTest
        terms={terms}
        progress={progress}
        title="Письменный тест"
        subtitle="Одна колонка, крупный ввод и быстрая проверка без лишнего интерфейса."
        onJudged={markWritten}
        onExit={() => window.history.back()}
        onOpenWeakSpots={() => navigate('/weak-spots')}
      />
    </div>
  );
}
