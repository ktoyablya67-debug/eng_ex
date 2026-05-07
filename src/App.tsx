import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StudyProvider } from './app/StudyContext';
import { Layout } from './components/Layout';
import { BlitzPage } from './pages/BlitzPage';
import { CardsPage } from './pages/CardsPage';
import { ExamModePage } from './pages/ExamModePage';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { MorePage } from './pages/MorePage';
import { StatsPage } from './pages/StatsPage';
import { TermsPage } from './pages/TermsPage';
import { WeakSpotsPage } from './pages/WeakSpotsPage';
import { WrittenTestPage } from './pages/WrittenTestPage';

function App() {
  return (
    <StudyProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />} path="/">
            <Route element={<HomePage />} index />
            <Route element={<LearnPage />} path="learn" />
            <Route element={<CardsPage />} path="cards" />
            <Route element={<WrittenTestPage />} path="written-test" />
            <Route element={<BlitzPage />} path="blitz" />
            <Route element={<MorePage />} path="more" />
            <Route element={<ExamModePage />} path="exam-mode" />
            <Route element={<WeakSpotsPage />} path="weak-spots" />
            <Route element={<TermsPage />} path="terms" />
            <Route element={<StatsPage />} path="stats" />
            <Route element={<Navigate replace to="/" />} path="*" />
          </Route>
        </Routes>
      </BrowserRouter>
    </StudyProvider>
  );
}

export default App;
