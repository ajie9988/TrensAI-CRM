FROM php:8.3-cli-alpine

# Install system deps
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    redis

# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

RUN chmod -R 775 storage bootstrap/cache

CMD ["php", "artisan", "queue:work", "redis", "--sleep=3", "--tries=3", "--max-time=3600"]
