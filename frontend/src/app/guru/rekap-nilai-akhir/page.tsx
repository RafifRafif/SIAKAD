import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import RekapNilaiAkhir from '../../pages/guru/RekapNilaiAkhir';

export default function GuruRekapNilaiAkhirPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <RekapNilaiAkhir />
    </GuruAccessGate>
  );
}
