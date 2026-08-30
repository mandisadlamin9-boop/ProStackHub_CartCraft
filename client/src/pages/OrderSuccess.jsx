import { Link, useSearchParams } from "react-router-dom";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="cart-page">
      <header className="cart-topbar">
        <Link to="/" className="store-wordmark">
          <span className="auth-wordmark-mark">C</span>
          CartCraft
        </Link>
      </header>

      <div className="cart-body order-success-body">
        <div className="order-success-check">✓</div>
        <h1>Order placed</h1>
        <p className="cart-status">
          {orderId && <>Order #{orderId} has been received. </>}
          You'll see it under "My account" once payment is confirmed.
        </p>
        <div className="order-success-actions">
          <Link to="/dashboard#orders" className="admin-primary-btn">
            Go to my account
          </Link>
          <Link to="/" className="order-success-home-link">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
