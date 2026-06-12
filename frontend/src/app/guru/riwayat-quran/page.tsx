import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import RiwayatSetoranQuran from '../../pages/guru/RiwayatSetoranQuran';

export default function GuruRiwayatQuranPage() {
  return (
    <GuruAccessGate requiredAccess={['Wali Kelas', 'Guru Mapel']}>
      <RiwayatSetoranQuran />
    </GuruAccessGate>
  );
}
