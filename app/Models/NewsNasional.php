<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsNasional extends Model
{
    // App\Models\NewsNasional.php
    protected $connection = 'mysql_nasional'; // Sesuaikan nama koneksi di config/database.php
    protected $table = 'news';
    protected $primaryKey = 'news_id';


    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';

    public function kanal()
    {
        return $this->belongsTo(KanalNasional::class, 'catnews_id');
    }
}
