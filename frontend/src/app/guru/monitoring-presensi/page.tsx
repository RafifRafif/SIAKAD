import GuruAccessGate from '../../pages/guru/GuruAccessGate';
import MonitoringPresensiKelas from '../../pages/guru/MonitoringPresensiKelas';

export default function GuruMonitoringPresensiPage() {
  return (
    <GuruAccessGate requiredAccess="Wali Kelas">
      <MonitoringPresensiKelas />
    </GuruAccessGate>
  );
}
