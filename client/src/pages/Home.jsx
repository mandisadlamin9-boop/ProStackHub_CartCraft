import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getCurrentUser } from "../lib/api";
import { CATEGORIES, CATEGORY_COLORS } from "../lib/constants";

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    apiFetch("/api/products")
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (user) {
      apiFetch("/api/cart")
        .then((data) =>
          setCartCount(data.items.reduce((sum, i) => sum + i.quantity, 0)),
        )
        .catch(() => {});
    }
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      setCartCount((c) => c + 1);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1200);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="store-page">
      <header className="store-nav">
        <div className="store-nav-top">
          <Link to="/" className="store-wordmark">
            <span className="auth-wordmark-mark">C</span>
            CartCraft
          </Link>

          <input
            className="store-search"
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="store-nav-actions">
            {user ? (
              <>
                <span className="store-user-name">Hi, {user.name}</span>
                <Link
                  to={user.role === "admin" ? "/admin" : "/dashboard"}
                  className="store-login-link"
                >
                  {user.role === "admin" ? "Admin" : "My account"}
                </Link>
              </>
            ) : (
              <Link to="/login" className="store-login-link">
                Sign in
              </Link>
            )}
            <span className="store-cart-icon">
              Cart
              {cartCount > 0 && (
                <span className="store-cart-badge">{cartCount}</span>
              )}
            </span>
          </div>
        </div>

        <div className="store-nav-categories">
          <button
            className={activeCategory === null ? "active" : ""}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "active" : ""}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <section className="store-grid-section">
        {loading && <p className="store-status">Loading products…</p>}
        {error && <p className="store-status store-error">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="store-status">No products match your search.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="store-grid">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="store-card"
                style={{
                  "--cat-color": CATEGORY_COLORS[p.category] || "#6b6b76",
                }}
              >
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="store-card-img"
                />
                <div className="store-card-category">{p.category}</div>
                <div className="store-card-name">{p.name}</div>
                <div className="store-card-price">
                  R{Number(p.price).toFixed(2)}
                </div>
                {p.stock < 10 && (
                  <div className="store-card-lowstock">Only {p.stock} left</div>
                )}
                <button
                  className="store-add-btn"
                  onClick={() => handleAddToCart(p)}
                >
                  {addedId === p.id ? "Added ✓" : "Add to cart"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
