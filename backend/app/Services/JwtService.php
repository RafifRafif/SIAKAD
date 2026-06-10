<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

class JwtService
{
    /**
     * @return array{token: string, expires_in: int}
     */
    public function issueToken(User $user): array
    {
        $ttl = (int) config('jwt.ttl', 480);
        $now = time();
        $expiresAt = $now + ($ttl * 60);
        $payload = [
            'iss' => config('jwt.issuer'),
            'sub' => (string) $user->id,
            'iat' => $now,
            'exp' => $expiresAt,
            'jti' => (string) Str::uuid(),
        ];

        return [
            'token' => $this->encode($payload),
            'expires_in' => $expiresAt - $now,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        $expectedSignature = $this->sign($header.'.'.$payload);

        if (! hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $decodedPayload = json_decode($this->base64UrlDecode($payload), true);

        if (! is_array($decodedPayload)) {
            return null;
        }

        if (($decodedPayload['exp'] ?? 0) < time()) {
            return null;
        }

        return $decodedPayload;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function encode(array $payload): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];
        $encodedHeader = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));

        return $encodedHeader.'.'.$encodedPayload.'.'.$this->sign($encodedHeader.'.'.$encodedPayload);
    }

    private function sign(string $value): string
    {
        return $this->base64UrlEncode(hash_hmac('sha256', $value, $this->secret(), true));
    }

    private function secret(): string
    {
        $secret = (string) config('jwt.secret');

        if (str_starts_with($secret, 'base64:')) {
            $decoded = base64_decode(substr($secret, 7), true);

            if ($decoded !== false) {
                return $decoded;
            }
        }

        if ($secret === '') {
            throw new RuntimeException('JWT secret is not configured.');
        }

        return $secret;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/').str_repeat('=', (4 - strlen($value) % 4) % 4)) ?: '';
    }
}
