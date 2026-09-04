FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libzip-dev \
    libpq-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql pgsql gd zip bcmath opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Configure Apache DocumentRoot to Laravel public/
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Set default cloud environment variables
ENV DB_CONNECTION=pgsql
ENV PORTAL_MODE=supplier
ENV DB_HOST=aws-0-ap-southeast-2.pooler.supabase.com
ENV DB_PORT=5432
ENV DB_DATABASE=postgres
ENV DB_USERNAME=postgres.ejbygpiozuaomomshazl
ENV DB_SSLMODE=require

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files
COPY . /var/www/html

# Create required storage directories and set permissions
RUN mkdir -p /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/storage/framework/cache/data \
             /var/www/html/storage/logs \
             /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

# Configure PHP OPcache for maximum performance
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.interned_strings_buffer=8" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.revalidate_freq=0" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.fast_shutdown=1" >> /usr/local/etc/php/conf.d/opcache.ini

# Expose port (Render sets $PORT dynamically)
EXPOSE 80 8080 10000

# Start Apache IMMEDIATELY, run all artisan warmup in background (non-blocking)
CMD sed -i "s/80/${PORT:-80}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/*.conf \
    && mkdir -p /var/www/html/storage/framework/cache/data \
              /var/www/html/storage/framework/sessions \
              /var/www/html/storage/framework/views \
              /var/www/html/storage/logs \
              /var/www/html/bootstrap/cache \
              /tmp/views \
    && chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /tmp/views \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && ( \
        php artisan storage:link 2>/dev/null; \
        php artisan config:cache 2>/dev/null; \
        php artisan route:cache  2>/dev/null; \
        php artisan view:cache   2>/dev/null; \
        php artisan migrate --force 2>/dev/null; \
    ) & \
    exec apache2-foreground