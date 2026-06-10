<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateJwt
{
    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (app()->runningUnitTests() && $request->user() !== null) {
            return $next($request);
        }

        $token = $request->bearerToken();

        if ($token === null) {
            return $this->unauthorized();
        }

        $payload = $this->jwtService->validateToken($token);
        $userId = $payload['sub'] ?? null;

        if ($payload === null || $userId === null) {
            return $this->unauthorized();
        }

        $user = User::query()->find($userId);

        if ($user === null) {
            return $this->unauthorized();
        }

        Auth::setUser($user);
        $request->setUserResolver(fn (): User => $user);

        return $next($request);
    }

    private function unauthorized(): Response
    {
        return response()->json([
            'message' => 'Token autentikasi tidak valid atau sudah kedaluwarsa.',
        ], 401);
    }
}
