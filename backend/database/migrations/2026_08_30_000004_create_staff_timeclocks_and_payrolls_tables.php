<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_timeclocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->timestamp('clock_in_at');
            $table->timestamp('clock_out_at')->nullable();
            $table->decimal('total_hours', 8, 2)->default(0.00);
            $table->string('status')->default('active'); // 'active', 'completed'
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('hourly_rate', 10, 2);
            $table->decimal('total_hours_worked', 8, 2);
            $table->decimal('gross_pay', 10, 2);
            $table->decimal('deductions', 10, 2)->default(0.00);
            $table->decimal('bonuses', 10, 2)->default(0.00);
            $table->decimal('net_pay', 10, 2);
            $table->string('status')->default('draft'); // 'draft', 'approved', 'paid'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_records');
        Schema::dropIfExists('staff_timeclocks');
    }
};
