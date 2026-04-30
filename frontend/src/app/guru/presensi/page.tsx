import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import PresensiGuru from '../../pages/guru/PresensiGuru';

export default function GuruPresensiPage() {
  return (
    <GuruAccessGate requiredAccess="Guru Mapel">
      <PresensiGuru />
    </GuruAccessGate>
  );
}
