CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10,2) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    image_url NVARCHAR(500),
    stock INT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);

CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'Placed',
    stripe_session_id NVARCHAR(255),
    stripe_payment_intent NVARCHAR(255),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_orders_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_orderitems_orders FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT FK_orderitems_products FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    comment NVARCHAR(1000),
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_reviews_users FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT FK_reviews_products FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT CK_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT UQ_reviews_user_product UNIQUE (user_id, product_id)
);