<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KanalNasional extends Model
{
    protected $connection = 'mysql_nasional';
    protected $table = 'news_category';
    protected $primaryKey = 'catnews_id';


    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
}
