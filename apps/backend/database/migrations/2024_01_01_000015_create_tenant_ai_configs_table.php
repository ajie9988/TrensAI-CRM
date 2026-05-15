<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenant_ai_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->string('ai_provider')->default('gemini'); // gemini, openai, anthropic, ollama
            $table->string('ai_model')->default('gemini-2.5-flash');
            $table->longText('system_instruction')->nullable();
            $table->decimal('temperature', 3, 2)->default(0.7); // 0.0 - 1.0
            $table->integer('max_output_tokens')->default(2000);
            $table->timestamps();
            
            $table->unique('tenant_id');
            $table->index('ai_provider');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_ai_configs');
    }
};
