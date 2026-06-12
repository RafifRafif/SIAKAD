<?php

use App\Http\Controllers\Api\AcademicActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FrontendFeatureController;
use App\Http\Controllers\Api\MasterDataController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

$adminOnly = 'role:'.User::ROLE_ADMIN;
$adminOrGuru = 'role:'.implode(',', [
    User::ROLE_ADMIN,
    User::ROLE_GURU_MAPEL,
    User::ROLE_WALI_KELAS,
]);
$allAppRoles = 'role:'.implode(',', [
    User::ROLE_ADMIN,
    User::ROLE_GURU_MAPEL,
    User::ROLE_WALI_KELAS,
    User::ROLE_SISWA,
]);

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('jwt')->group(function () use ($adminOnly, $adminOrGuru, $allAppRoles) {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/profile', [FrontendFeatureController::class, 'profile'])->middleware($allAppRoles);
    Route::put('/profile', [FrontendFeatureController::class, 'updateProfile'])->middleware($allAppRoles);
    Route::post('/profile/photo', [FrontendFeatureController::class, 'updateProfilePhoto'])->middleware($allAppRoles);
    Route::get('/profile/photo-content', [FrontendFeatureController::class, 'showProfilePhoto'])->middleware($allAppRoles);
    Route::put('/profile/password', [FrontendFeatureController::class, 'updatePassword'])->middleware($allAppRoles);

    Route::get('/academic-years', [MasterDataController::class, 'academicYears'])->middleware($allAppRoles);
    Route::post('/academic-years', [MasterDataController::class, 'storeAcademicYear'])->middleware($adminOnly);
    Route::put('/academic-years/{academicYear}', [MasterDataController::class, 'updateAcademicYear'])->middleware($adminOnly);
    Route::patch('/academic-years/{academicYear}/active', [MasterDataController::class, 'setActiveAcademicYear'])->middleware($adminOnly);
    Route::delete('/academic-years/{academicYear}', [MasterDataController::class, 'deleteAcademicYear'])->middleware($adminOnly);

    Route::get('/students', [MasterDataController::class, 'students'])->middleware($adminOrGuru);
    Route::post('/students', [MasterDataController::class, 'storeStudent'])->middleware($adminOnly);
    Route::post('/students/import', [FrontendFeatureController::class, 'importStudents'])->middleware($adminOnly);
    Route::put('/students/{student}', [MasterDataController::class, 'updateStudent'])->middleware($adminOnly);
    Route::delete('/students/{student}', [MasterDataController::class, 'deleteStudent'])->middleware($adminOnly);

    Route::get('/teachers', [MasterDataController::class, 'teachers'])->middleware($adminOnly);
    Route::post('/teachers', [MasterDataController::class, 'storeTeacher'])->middleware($adminOnly);
    Route::post('/teachers/import', [FrontendFeatureController::class, 'importTeachers'])->middleware($adminOnly);
    Route::put('/teachers/{teacher}', [MasterDataController::class, 'updateTeacher'])->middleware($adminOnly);
    Route::delete('/teachers/{teacher}', [MasterDataController::class, 'deleteTeacher'])->middleware($adminOnly);

    Route::get('/school-classes', [MasterDataController::class, 'schoolClasses'])->middleware($adminOrGuru);
    Route::post('/school-classes', [MasterDataController::class, 'storeSchoolClass'])->middleware($adminOnly);
    Route::put('/school-classes/{schoolClass}', [MasterDataController::class, 'updateSchoolClass'])->middleware($adminOnly);
    Route::delete('/school-classes/{schoolClass}', [MasterDataController::class, 'deleteSchoolClass'])->middleware($adminOnly);

    Route::get('/subjects', [MasterDataController::class, 'subjects'])->middleware($adminOrGuru);
    Route::post('/subjects', [MasterDataController::class, 'storeSubject'])->middleware($adminOnly);
    Route::put('/subjects/{subject}', [MasterDataController::class, 'updateSubject'])->middleware($adminOnly);
    Route::delete('/subjects/{subject}', [MasterDataController::class, 'deleteSubject'])->middleware($adminOnly);

    Route::get('/learning-assignments', [MasterDataController::class, 'learningAssignments'])->middleware($allAppRoles);
    Route::post('/learning-assignments', [MasterDataController::class, 'storeLearningAssignment'])->middleware($adminOnly);
    Route::put('/learning-assignments/{learningAssignment}', [MasterDataController::class, 'updateLearningAssignment'])->middleware($adminOnly);
    Route::delete('/learning-assignments/{learningAssignment}', [MasterDataController::class, 'deleteLearningAssignment'])->middleware($adminOnly);

    Route::get('/assessment-setting', [MasterDataController::class, 'assessmentSetting'])->middleware($adminOrGuru);
    Route::put('/assessment-setting', [MasterDataController::class, 'updateAssessmentSetting'])->middleware($adminOnly);

    Route::get('/grades', [AcademicActivityController::class, 'grades'])->middleware($allAppRoles);
    Route::post('/grades', [AcademicActivityController::class, 'storeGrade'])->middleware($adminOrGuru);
    Route::put('/grades/{studentGrade}', [AcademicActivityController::class, 'updateGrade'])->middleware($adminOrGuru);
    Route::delete('/grades/{studentGrade}', [AcademicActivityController::class, 'deleteGrade'])->middleware($adminOrGuru);

    Route::get('/attendance-records', [AcademicActivityController::class, 'attendanceRecords'])->middleware($allAppRoles);
    Route::post('/attendance-records', [AcademicActivityController::class, 'storeAttendanceRecord'])->middleware($adminOrGuru);
    Route::put('/attendance-records/{attendanceRecord}', [AcademicActivityController::class, 'updateAttendanceRecord'])->middleware($adminOrGuru);
    Route::delete('/attendance-records/{attendanceRecord}', [AcademicActivityController::class, 'deleteAttendanceRecord'])->middleware($adminOrGuru);

    Route::get('/quran-submissions', [AcademicActivityController::class, 'quranSubmissions'])->middleware($allAppRoles);
    Route::post('/quran-submissions', [AcademicActivityController::class, 'storeQuranSubmission'])->middleware($adminOrGuru);
    Route::put('/quran-submissions/{quranSubmission}', [AcademicActivityController::class, 'updateQuranSubmission'])->middleware($adminOrGuru);
    Route::delete('/quran-submissions/{quranSubmission}', [AcademicActivityController::class, 'deleteQuranSubmission'])->middleware($adminOrGuru);
    Route::get('/quran/surahs', [AcademicActivityController::class, 'quranSurahs'])->middleware($allAppRoles);

    Route::get('/dashboard-summary', [AcademicActivityController::class, 'dashboardSummary'])->middleware($allAppRoles);
    Route::get('/report-options', [FrontendFeatureController::class, 'reportOptions'])->middleware($adminOnly);
    Route::get('/reports/admin/export', [FrontendFeatureController::class, 'adminReportExport'])->middleware($adminOnly);
    Route::get('/reports/student/rapor', [FrontendFeatureController::class, 'studentReportDownload'])->middleware($allAppRoles);
    Route::get('/student-insights', [FrontendFeatureController::class, 'studentInsights'])->middleware($allAppRoles);
    Route::get('/class-dashboard', [FrontendFeatureController::class, 'classDashboard'])->middleware($adminOrGuru);
    Route::get('/learning-tasks', [FrontendFeatureController::class, 'learningTasks'])->middleware($allAppRoles);
    Route::get('/schedule/today', [FrontendFeatureController::class, 'todaySchedule'])->middleware($allAppRoles);
});
