-- Migration script: Add brand column to products table
ALTER TABLE products ADD COLUMN brand VARCHAR(255) DEFAULT NULL AFTER sku;
