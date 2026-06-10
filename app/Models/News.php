<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class News extends Model
{

    protected $fillable = [
        'is_code',
        'writer_id',
        'title',
        'image_thumbnail',
        'image_caption',
        'content',
        'distribution_status',
    ];

    public function tags()
    {
        return $this->belongsToMany(Tags::class, 'news_tags', 'news_id', 'tag_id')->withPivot('sort_order')
            ->orderByPivot('sort_order', 'asc');
    }

    public function newsDaerah()
    {
        // hasOne(Model, foreign_key, local_key)
        return $this->hasOne(NewsDaerah::class, 'is_code', 'is_code');
    }

    public function newsNasional()
    {
        return $this->hasOne(NewsNasional::class, 'is_code', 'is_code');
    }

    public function notes()
    {
        return $this->hasMany(NewsNote::class, 'news_id', 'id')->latest();
    }
}
