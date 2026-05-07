import { useState } from 'react';
import { TermCard } from '../components/TermCard';
import { useStudy } from '../app/StudyContext';
import { FilterKey } from '../types';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'know', label: 'Знаю' },
  { key: 'confuse', label: 'Путаю' },
  { key: 'dontknow', label: 'Не знаю' },
  { key: 'errors', label: 'С ошибками' },
  { key: 'unseen', label: 'Ещё не проходила' },
];

export function TermsPage() {
  const { progress, getFilteredTerms } = useStudy();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredTerms = getFilteredTerms(query, filter);

  return (
    <div className="page">
      <section className="page-header">
        <span className="eyebrow">Term bank</span>
        <h1>Все термины</h1>
        <p>Поиск по аббревиатуре, английской расшифровке и русскому переводу. На телефоне всё идёт карточками, без широкой таблицы.</p>
      </section>

      <section className="trainer-card terms-tools">
        <label className="search-field">
          <span>Поиск</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="RAM, protocol, память, network"
            type="search"
          />
        </label>
        <div className="chip-scroll" role="tablist" aria-label="Filters">
          {filters.map((item) => (
            <button
              key={item.key}
              className={`filter-chip ${filter === item.key ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="term-list">
        {filteredTerms.map((term) => (
          <TermCard key={term.id} progress={progress[term.id]} term={term} />
        ))}
      </section>
    </div>
  );
}
