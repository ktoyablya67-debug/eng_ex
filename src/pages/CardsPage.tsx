import { CardTrainer } from '../components/CardTrainer';
import { useStudy } from '../app/StudyContext';
import { terms } from '../data/terms';

export function CardsPage() {
  const { progress, markCard, stats } = useStudy();

  return (
    <div className="page">
      <section className="page-header">
        <span className="eyebrow">Cards</span>
        <h1>Карточки</h1>
        <p>{stats.studied} из {stats.total} уже видела. На телефоне можно просто тапать по карточке и отвечать большими кнопками снизу.</p>
      </section>
      <CardTrainer
        terms={terms}
        progress={progress}
        title="Карточки"
        subtitle="Тап по карточке переворачивает её. После ответа оцени, насколько уверенно знаешь термин."
        onRate={markCard}
        onExit={() => window.history.back()}
      />
    </div>
  );
}
