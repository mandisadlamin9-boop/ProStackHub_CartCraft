import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch, getCurrentUser } from "../lib/api";
import { CATEGORIES } from "../lib/constants";
import StoreNav from "../components/StoreNav";

export default function Shop() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || null,
  );
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

  const handleFilterClick = (cat) => {
    setActiveCategory(cat);
    setSearchParams(cat ? { category: cat } : {});
  };

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

  const searched = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const categoriesToShow = activeCategory ? [activeCategory] : CATEGORIES;

  const renderCard = (p) => (
    <Link key={p.id} to={`/product/${p.id}`} className="shop-card">
      <div className="shop-card-name">{p.name}</div>
      <div className="shop-card-media">
        <img src={p.image_url} alt={p.name} />
      </div>
      <div className="shop-card-price">R{Number(p.price).toFixed(2)}</div>
      {p.stock < 10 && (
        <div className="shop-card-lowstock">Only {p.stock} left</div>
      )}
      <button
        className="shop-card-add"
        onClick={(e) => {
          e.preventDefault();
          handleAddToCart(p);
        }}
      >
        {addedId === p.id ? "Added ✓" : "Add to cart"}
      </button>
    </Link>
  );

  return (
    <div className="store-page">
      <StoreNav user={user} cartCount={cartCount} alwaysSolid />

      <div className="shop-toolbar">
        <input
          className="shop-search"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="shop-filters">
        <button
          className={`shop-filter-chip${!activeCategory ? " active" : ""}`}
          onClick={() => handleFilterClick(null)}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`shop-filter-chip${activeCategory === cat ? " active" : ""}`}
            onClick={() => handleFilterClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p className="store-status">Loading products…</p>}
      {error && <p className="store-status store-error">{error}</p>}

      {!loading &&
        !error &&
        categoriesToShow.map((cat) => {
          const catProducts = searched.filter((p) => p.category === cat);
          if (catProducts.length === 0) return null;
          return (
            <section key={cat} className="shop-category-section">
              <h2>{cat}</h2>
              <div className="shop-grid">{catProducts.map(renderCard)}</div>
            </section>
          );
        })}
    </div>
  );
}
