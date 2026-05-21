<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function create(Request $request): JsonResponse
    {
        if ($request->user()) {
            return $this->authenticatedResponse($request->user());
        }

        return response()->json([
            'message' => 'Silakan login dengan username dan password yang sama.',
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'username' => 'Username atau password salah.',
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = $request->user();

        if ($request->expectsJson()) {
            return $this->authenticatedResponse($user);
        }

        return redirect()->intended($user->dashboardPath());
    }

    public function dashboard(Request $request): JsonResponse|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($request->expectsJson()) {
            return $this->authenticatedResponse($user);
        }

        return redirect($user->dashboardPath());
    }

    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Logout berhasil.',
            ]);
        }

        return redirect('/login');
    }

    private function authenticatedResponse(User $user): JsonResponse
    {
        return response()->json([
            'message' => 'Login berhasil.',
            'redirect_to' => $user->dashboardPath(),
            'user' => [
                'id' => $user->id,
                'name' => $this->displayName($user),
                'username' => $user->username,
                'role' => $user->frontendRole(),
                'roles' => $user->roles ?? [],
                'guruAccess' => $user->guruAccess(),
            ],
        ]);
    }

    private function displayName(User $user): string
    {
        return Student::query()->where('nis', $user->username)->value('nama')
            ?? Teacher::query()->where('nip', $user->username)->value('nama')
            ?? $user->name;
    }
}
