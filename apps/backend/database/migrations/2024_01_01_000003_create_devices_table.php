<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('phone_number')->unique();
            $table->string('device_name')->nullable();
            $table->enum('status', ['connected', 'disconnected', 'connecting', 'error'])->default('disconnected');
            $table->string('session_id')->nullable()->unique();
            $table->json('session_data')->nullable();
            $table->string('webhook_url')->nullable();
            $table->timestamp('last_connected_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('phone_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
