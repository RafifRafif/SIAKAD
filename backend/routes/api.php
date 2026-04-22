<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\AttendanceRecordController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GradeEntryController;
use App\Http\Controllers\Api\GradeWeightController;
use App\Http\Controllers\Api\QuranDepositController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/ping', fn () => response()->json([
        'message' => 'SIAKAD API aktif.',
    ]));

    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/password', [AuthController::class, 'updatePassword']);

    Route::apiResource('academic-years', AcademicYearController::class);
    Route::apiResource('teachers', TeacherController::class);
    Route::apiResource('students', StudentController::class);
    Route::apiResource('classes', SchoolClassController::class);
    Route::apiResource('subjects', SubjectController::class);
    Route::apiResource('grade-weights', GradeWeightController::class);
    Route::apiResource('attendance-records', AttendanceRecordController::class);
    Route::apiResource('grade-entries', GradeEntryController::class);
    Route::apiResource('quran-deposits', QuranDepositController::class);
});
