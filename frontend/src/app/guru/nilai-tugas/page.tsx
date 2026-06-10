import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import InputNilaiTugas from '../../pages/guru/InputNilaiTugas';

export default function GuruNilaiTugasPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <InputNilaiTugas />
    </GuruAccessGate>
  );
}
