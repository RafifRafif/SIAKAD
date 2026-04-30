import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import RekapAbsensiGuruMapel from '../../pages/guru/RekapAbsensiGuruMapel';

export default function GuruRekapAbsensiPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <RekapAbsensiGuruMapel />
    </GuruAccessGate>
  );
}
