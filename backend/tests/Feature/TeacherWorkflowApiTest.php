<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherWorkflowApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_attendance_record_can_be_created_and_filtered_by_class(): void
    {
        [$academicYear, $class, $teacher, $student, $subject] = $this->makeTeachingContext();

        $storeResponse = $this->postJson('/api/v1/attendance-records', [
            'academic_year_id' => $academicYear->id,
            'class_id' => $class->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'attendance_date' => '2026-04-21',
            'status' => 'Hadir',
            'notes' => null,
        ]);

        $storeResponse
            ->assertCreated()
            ->assertJsonPath('data.student.id', $student->id)
            ->assertJsonPath('data.class.id', $class->id)
            ->assertJsonPath('data.status', 'Hadir');

        $indexResponse = $this->getJson("/api/v1/attendance-records?class_id={$class->id}");

        $indexResponse
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.student.nis', '2024001');
    }

    public function test_grade_entry_can_be_created_and_filtered_by_assessment_type(): void
    {
        [$academicYear, $class, $teacher, $student, $subject] = $this->makeTeachingContext();

        $storeResponse = $this->postJson('/api/v1/grade-entries', [
            'academic_year_id' => $academicYear->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'assessment_type' => 'UTS',
            'score' => 91,
            'entry_date' => '2026-04-21',
        ]);

        $storeResponse
            ->assertCreated()
            ->assertJsonPath('data.score', 91)
            ->assertJsonPath('data.subject.name', 'Matematika')
            ->assertJsonPath('data.student.class.name', 'X-A');

        $indexResponse = $this->getJson('/api/v1/grade-entries?assessment_type=UTS');

        $indexResponse
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.teacher.name', 'Ustadz Ahmad Fauzi');
    }

    public function test_quran_deposit_can_be_created_and_filtered_by_student(): void
    {
        [, , $teacher, $student] = $this->makeTeachingContext();

        $storeResponse = $this->postJson('/api/v1/quran-deposits', [
            'teacher_id' => $teacher->id,
            'student_id' => $student->id,
            'deposit_date' => '2026-04-21',
            'surah' => 'An-Naba',
            'verse_start' => 1,
            'verse_end' => 10,
            'assessment' => 'Lancar',
            'notes' => 'Sudah lancar.',
        ]);

        $storeResponse
            ->assertCreated()
            ->assertJsonPath('data.student.nis', '2024001')
            ->assertJsonPath('data.assessment', 'Lancar');

        $indexResponse = $this->getJson("/api/v1/quran-deposits?student_id={$student->id}");

        $indexResponse
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.surah', 'An-Naba');
    }

    /**
     * @return array{AcademicYear, SchoolClass, Teacher, Student, Subject}
     */
    private function makeTeachingContext(): array
    {
        $academicYear = AcademicYear::create([
            'name' => '2025/2026',
            'semester' => 'Genap',
            'is_active' => true,
        ]);

        $teacherUser = User::create([
            'name' => 'Ustadz Ahmad Fauzi',
            'username' => 'NIP001',
            'role' => 'guru-mapel',
            'password' => 'NIP001',
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'academic_year_id' => $academicYear->id,
            'nip' => 'NIP001',
            'name' => 'Ustadz Ahmad Fauzi',
            'roles' => ['Guru Mapel'],
            'status' => 'Aktif',
        ]);

        $class = SchoolClass::create([
            'academic_year_id' => $academicYear->id,
            'name' => 'X-A',
            'level' => 'X',
            'capacity' => 36,
        ]);

        $studentUser = User::create([
            'name' => 'Ahmad Fauzi',
            'username' => '2024001',
            'role' => 'siswa',
            'password' => '2024001',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'academic_year_id' => $academicYear->id,
            'class_id' => $class->id,
            'nis' => '2024001',
            'name' => 'Ahmad Fauzi',
            'gender' => 'Laki-laki',
        ]);

        $subject = Subject::create([
            'academic_year_id' => $academicYear->id,
            'teacher_id' => $teacher->id,
            'code' => 'MTK-01',
            'name' => 'Matematika',
        ]);

        return [$academicYear, $class, $teacher, $student, $subject];
    }
}
