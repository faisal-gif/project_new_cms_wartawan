<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NewsDaerah extends Model
{

    protected $connection = 'mysql_daerah';
    protected $table = 'news';


    public function kanal()
    {
        return $this->belongsTo(KanalDaerah::class, 'cat_id');
    }
}
