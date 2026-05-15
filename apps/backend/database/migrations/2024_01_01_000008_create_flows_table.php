<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('nodes');
            $table->json('edges');
            $table->enum('trigger_type', ['message', 'keyword', 'webhook', 'schedule', 'tag', 'contact_field'])->default('message');
            $table->string('trigger_value')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->integer('execution_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index('device_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flows');
    }
};
