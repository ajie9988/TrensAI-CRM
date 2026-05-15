<?php

use Illuminate\Console\Scheduling\Schedule;

return function (Schedule $schedule) {
    // $schedule->command('inspire')->hourly();
    $schedule->command('queue:prune-failed')->daily();
};
