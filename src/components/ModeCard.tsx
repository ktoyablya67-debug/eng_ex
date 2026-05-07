import { Link } from 'react-router-dom';

interface ModeCardProps {
  to: string;
  index: string;
  title: string;
  description: string;
  accent?: 'warm' | 'urgent' | 'cool';
}

export function ModeCard({ to, index, title, description, accent = 'cool' }: ModeCardProps) {
  return (
    <Link className={`mode-card mode-card--${accent}`} to={to}>
      <span>{index}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </Link>
  );
}
