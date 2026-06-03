<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tags extends Model
{
    protected $fillable = [
        'name',
    ];

    // Langsung hubungkan ke News, tanpa lewat NewsTags secara manual
    public function news()
    {
        return $this->belongsToMany(News::class, 'news_tags', 'tag_id', 'news_id');
    }
}
