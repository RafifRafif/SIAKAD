import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import RekapNilaiHarianQuiz from '../../pages/guru/RekapNilaiHarianQuiz';

export default function GuruNilaiHarianQuizPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <RekapNilaiHarianQuiz />
    </GuruAccessGate>
  );
}
