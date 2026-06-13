import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import InputNilaiHarian from '../../pages/guru/InputNilaiHarian';

export default function GuruNilaiHarianPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <InputNilaiHarian />
    </GuruAccessGate>
  );
}
