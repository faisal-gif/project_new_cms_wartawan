<?php

namespace App\Services;

class SsoService
{
    private string $secretKey;
    private string $cipher = 'aes-256-cbc';

    public function __construct()
    {
        // Pastikan SSO_SECRET_KEY sama di file .env kedua aplikasi
        $this->secretKey = env('SSO_SECRET_KEY'); 
    }

    public function generateToken(string $email): string
    {
        $payload = json_encode([
            'email' => $email,
            'timestamp' => now()->timestamp,
        ]);

        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($this->cipher));
        $encrypted = openssl_encrypt($payload, $this->cipher, $this->secretKey, 0, $iv);
        
        return base64_encode($iv . '::' . $encrypted);
    }

    public function decryptAndValidateToken(string $token): ?string
    {
        $decoded = base64_decode($token);
        
        if (!str_contains($decoded, '::')) {
            return null;
        }

        [$iv, $encryptedData] = explode('::', $decoded, 2);
        $decrypted = openssl_decrypt($encryptedData, $this->cipher, $this->secretKey, 0, $iv);
        
        if (!$decrypted) return null;

        $payload = json_decode($decrypted, true);

        // Validasi payload dan kedaluwarsa (misal: 30 detik untuk mencegah replay attack)
        if (!isset($payload['email']) || !isset($payload['timestamp'])) {
            return null;
        }

        if (now()->timestamp - $payload['timestamp'] > 30) {
            return null; // Token expired
        }

        return $payload['email'];
    }
}