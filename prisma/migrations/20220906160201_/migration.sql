-- CreateIndex
CREATE FULLTEXT INDEX `categories_name_idx` ON `categories`(`name`);

-- CreateIndex
CREATE FULLTEXT INDEX `products_name_idx` ON `products`(`name`);

-- CreateIndex
CREATE FULLTEXT INDEX `tags_name_idx` ON `tags`(`name`);
