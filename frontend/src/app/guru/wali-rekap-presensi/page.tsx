import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import RekapPresensiWaliKelas from '../../pages/guru/RekapPresensiWaliKelas';

export default function GuruWaliRekapPresensiPage() {
  return (
    <GuruAccessGate requiredAccess="Wali Kelas">
      <RekapPresensiWaliKelas />
    </GuruAccessGate>
  );
}
