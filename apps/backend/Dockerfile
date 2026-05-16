FROM php:8.5-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    libpng-dev \
    libjpeg-turbo-dev \
    libfreetype-dev \
    libwebp-dev \
    git \
    curl \
    zip \
    unzip \
    postgresql-dev \
    bash \
    nginx

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp && \
    docker-php-ext-install -j$(nproc) \
    gd \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    bcmath \
    ctype \
    json \
    mbstring \
    openssl \
    tokenizer \
    xml

# Install Redis extension
RUN apk add --no-cache autoconf && \
    pecl install redis && \
    docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application code
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader

# Create necessary directories
RUN mkdir -p storage/logs storage/app/uploads && \
    chown -R www-data:www-data storage bootstrap

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD php artisan ping || exit 1

# Start PHP-FPM
CMD ["php-fpm"]
