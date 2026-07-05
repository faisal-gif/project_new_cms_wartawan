<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class NewsFormRequest extends FormRequest
{
    /**
     * Tentukan apakah user memiliki izin untuk melakukan request ini.
     */
    public function authorize(): bool
    {
        // Ubah ke true jika sudah ada sistem auth, 
        // atau sesuaikan dengan logic permission kamu
        return true;
    }

    /**
     * Aturan validasi yang berlaku untuk request ini.
     */
    public function rules(): array
    {
        return [
            'title'         => 'required|string|max:255',
            'tag'                   => 'required|array|min:1|max:3',
            'tag.*'                 => 'string|max:255',
            'content'       => 'required|string',

            // Validasi Gambar
            'image_thumbnail'       => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // Max 2MB
            'image_watermark'       => 'required|boolean',
            'image_caption'         => 'required|string|max:255',
        ];
    }

    /**
     * Pesan kustom untuk error validasi (Opsional).
     */
    public function messages(): array
    {
        return [
            'title.required'     => 'Judul berita tidak boleh kosong.',
            'image_thumbnail.required'   => 'Gambar Thumbnail wajib diunggah.',
            'image_thumbnail.image'      => 'File harus berupa gambar.',
            'tag.required'       => 'Minimal masukkan satu tag.',
            'tag.max'                    => 'Maksimal hanya boleh mengirimkan 3 tag.',
            'tag.*.max'                  => 'Panjang setiap tag tidak boleh lebih dari 255 karakter.',
            'content.required'   => 'Konten berita Wajib diisi',
            'image_caption.required' => 'Caption gambar harus diisi.',
        ];
    }
}
