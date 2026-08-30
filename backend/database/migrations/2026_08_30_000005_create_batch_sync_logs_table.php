<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('batch_id')->unique();
            $table->string('device_serial')->nullable();
            $table->date('sync_date');
            $table->integer('orders_count')->default(0);
            $table->decimal('gross_sales', 12, 2)->default(0.00);
            $table->string('status')->default('success'); // 'success', 'duplicate', 'failed'
            $table->timestamp('received_at');
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('batch_sync_id')->nullable()->after('branch_id')->constrained('batch_sync_logs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['batch_sync_id']);
            $table->dropColumn('batch_sync_id');
        });
        Schema::dropIfExists('batch_sync_logs');
    }
};
