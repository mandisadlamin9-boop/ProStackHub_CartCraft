import { Link, useSearchParams } from "react-router-dom";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");

  return (
    <div className="cart-page">
      <div className="cart-content" style={{ textAlign: "center" }}>
        <h1>Order placed </h1>
        <p>
          Your order {orderId ? `#${orderId}` : ""} has been received. You'll
          see it under "My account" once payment is confirmed.
        </p>
        <Link to="/" className="cart-continue-link">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
