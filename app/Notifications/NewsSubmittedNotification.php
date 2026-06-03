<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewsSubmittedNotification extends Notification
{
    use Queueable;

    protected $newsId;
    protected $newsTitle;
    protected $writerName;

    public function __construct($newsId, $newsTitle, $writerName)
    {
        $this->newsId = $newsId;
        $this->newsTitle = $newsTitle;
        $this->writerName = $writerName;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    // Format data untuk disimpan di Database & WebSockets
    public function toArray($notifiable)
    {
        return [
            'title'       => 'Berita Baru Masuk!',
            'message'     => "{$this->writerName} mengirimkan berita: {$this->newsTitle}",
            // Ganti URL ini dengan route halaman review editor di Web A Anda
            'url'         => "/admin/news/{$this->newsId}", 
            'is_download' => false // <-- INI KUNCI PEMBEDANYA
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}