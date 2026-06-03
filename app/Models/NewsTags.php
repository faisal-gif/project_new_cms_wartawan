<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Relations\Pivot;

class NewsTags extends Pivot
{
    protected $fillable = [
        'news_id',
        'tag_id',
    ];

    public function news()
    {
        return $this->belongsTo(News::class, 'news_id');
    }
}
