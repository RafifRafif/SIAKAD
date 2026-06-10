<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('username', $credentials['username'])->first();

        if ($user === null || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => 'Username atau password salah.',
            ]);
        }

        return $this->authenticatedResponse($user);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->authenticatedResponse($user, false);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    private function authenticatedResponse(User $user, bool $includeToken = true): JsonResponse
    {
        $token = $includeToken ? $this->jwtService->issueToken($user) : null;
        $payload = [
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
        ];

        if ($token !== null) {
            $payload['access_token'] = $token['token'];
            $payload['token_type'] = 'Bearer';
            $payload['expires_in'] = $token['expires_in'];
        }

        return response()->json($payload);
    }

    private function displayName(User $user): string
    {
        return Student::query()->where('nis', $user->username)->value('nama')
            ?? Teacher::query()->where('nip', $user->username)->value('nama')
            ?? $user->name;
    }
}
