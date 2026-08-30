import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch, getCurrentUser } from "../lib/api";
import StoreNav from "../components/StoreNav";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    apiFetch(`/api/products/${id}`)
      .then((data) => setProduct(data.product))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (user) {
      apiFetch("/api/cart")
        .then((data) =>
          setCartCount(data.items.reduce((sum, i) => sum + i.quantity, 0)),
        )
        .catch(() => {});
    }
  }, [id]);

  const handleAddToCart = async () => {
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
      setAdded(true);
      setTimeout(() => setAdded(false), 1200);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="store-page">
      <StoreNav user={user} cartCount={cartCount} alwaysSolid />

      {loading && (
        <p className="store-status" style={{ padding: 60 }}>
          Loading…
        </p>
      )}
      {error && (
        <p className="store-status store-error" style={{ padding: 60 }}>
          {error}
        </p>
      )}

      {!loading && !error && product && (
        <div className="product-detail">
          <div className="product-detail-media">
            <img src={product.image_url} alt={product.name} />
          </div>
          <div className="product-detail-info">
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="product-detail-cat"
            >
              {product.category}
            </Link>
            <h1>{product.name}</h1>
            <div className="product-detail-price">
              R{Number(product.price).toFixed(2)}
            </div>
            {product.description && (
              <p className="product-detail-desc">{product.description}</p>
            )}
            {product.stock < 10 && (
              <div className="product-detail-lowstock">
                Only {product.stock} left
              </div>
            )}
            <button className="product-detail-add" onClick={handleAddToCart}>
              {added ? "Added ✓" : "Add to cart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
