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
        Schema::table('tenant_ai_configs', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropUnique('tenant_ai_configs_tenant_id_unique');
            
            $table->string('name')->after('tenant_id')->default('Default Config');
            $table->string('api_key')->nullable()->after('ai_model');
            $table->string('base_url')->nullable()->after('api_key');
            $table->boolean('is_active')->default(false)->after('max_output_tokens');

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_ai_configs', function (Blueprint $table) {
            $table->unique('tenant_id');
            $table->dropColumn(['name', 'api_key', 'base_url', 'is_active']);
        });
    }
};
