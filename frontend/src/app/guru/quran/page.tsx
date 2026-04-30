import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import SetoranQuran from '../../pages/guru/SetoranQuran';

export default function GuruQuranPage() {
  return (
    <GuruAccessGate requiredAccess="Wali Kelas">
      <SetoranQuran />
    </GuruAccessGate>
  );
}
