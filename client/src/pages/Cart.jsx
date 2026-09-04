import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import cartHero from "../assets/apple-flatlay-hero-full.jpg";
import PromoBar from "../components/PromoBar";
import BackButton from "../components/BackButton";
import { useToast } from "../components/ToastProvider";

export default function Cart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    setLoading(true);
    apiFetch("/api/cart")
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const updateQuantity = async (item, newQty) => {
    if (newQty < 1) return;
    if (newQty > item.stock) return;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
    );

    try {
      await apiFetch(`/api/cart/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: newQty }),
      });
    } catch (err) {
      toast.error(err.message);
      loadCart();
    }
  };

  const removeItem = async (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await apiFetch(`/api/cart/${item.id}`, { method: "DELETE" });
    } catch (err) {
      toast.error(err.message);
      loadCart();
    }
  };

  const subtotal = items.reduce(
    (sum, i) => sum + Number(i.price) * i.quantity,
    0,
  );

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const { checkout_url } = await apiFetch("/api/checkout", {
        method: "POST",
      });
      window.location.href = checkout_url;
    } catch (err) {
      toast.error(err.message);
      setCheckingOut(false);
    }
  };

  return (
    <div className="cart-page">
      <PromoBar />

      <section className="cart-hero">
        <img src={cartHero} alt="" className="cart-hero-img" />
        <div className="cart-hero-overlay" />
        <header className="cart-topbar">
          <Link to="/" className="cart-wordmark">
            <span className="auth-wordmark-mark">C</span>
            CartCraft
          </Link>
          <BackButton
            to="/"
            label="Continue shopping"
            className="cart-continue-link"
          />
        </header>
        <div className="cart-hero-content">
          <span className="cart-hero-eyebrow">Your cart</span>
          <h1>Ready when you are</h1>
        </div>
      </section>

      <div className="cart-body">
        {canceled && (
          <div className="cart-banner">
            Payment didn't go through — you weren't charged. Feel free to try
            again.
          </div>
        )}

        {loading && <p className="cart-status">Loading your cart…</p>}
        {error && <p className="cart-status cart-error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <Link to="/" className="admin-primary-btn">
              Browse products
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-category">{item.category}</div>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">
                      R{Number(item.price).toFixed(2)}
                    </div>
                    {item.quantity >= item.stock && (
                      <div className="cart-item-maxstock">
                        Max stock reached
                      </div>
                    )}
                  </div>

                  <div className="cart-item-qty">
                    <button
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-linetotal">
                    R{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>

                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order summary</h2>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              <p className="cart-summary-note">
                Shipping and taxes calculated at checkout.
              </p>

              <button
                className="cart-checkout-btn"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? "Redirecting…" : "Proceed to checkout"}
              </button>

              <div className="cart-test-note">
                Test mode: use <code>4242 4242 4242 4242</code>, any future
                expiry, any CVC.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
