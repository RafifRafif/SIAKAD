import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import InputNilai from '../../pages/guru/InputNilai';

export default function GuruNilaiPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <InputNilai />
    </GuruAccessGate>
  );
}
