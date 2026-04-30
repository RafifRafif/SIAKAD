import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import RekapNilaiGuruKelas from '../../pages/guru/RekapNilaiGuruKelas';

export default function GuruRekapNilaiPage() {
  return (
    <GuruAccessGate requiredAccess="Wali Kelas">
      <RekapNilaiGuruKelas />
    </GuruAccessGate>
  );
}
