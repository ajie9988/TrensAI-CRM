<?php

namespace App\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if ($user) {
            $tenantId = $request->header('X-Tenant-ID') ?? $user->tenant_id;
            
            // Verify user belongs to tenant
            if ($user->tenant_id != $tenantId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->attributes->set('tenant_id', $tenantId);
        }

        return $next($request);
    }
}
