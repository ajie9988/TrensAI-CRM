<?php

namespace Modules\Auth\Repositories;

use App\Models\User;

interface AuthRepositoryInterface
{
    public function findByEmail(string $email): ?User;
    public function create(array $data): User;
}
