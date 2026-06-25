import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import PresensiGuru from '../../pages/guru/PresensiGuru';

export default function GuruWaliPresensiPage() {
  return (
    <GuruAccessGate requiredAccess="Wali Kelas">
      <PresensiGuru mode="waliKelas" />
    </GuruAccessGate>
  );
}
