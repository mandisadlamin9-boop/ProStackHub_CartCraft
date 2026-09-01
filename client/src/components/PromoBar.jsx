// components/PromoBar.jsx
export default function PromoBar({
  text = "FREE SHIPPING ON ORDERS OVER R5000 · 30-DAY RETURNS · SECURE CHECKOUT",
}) {
  return (
    <div className="promo-bar">
      <div className="promo-bar-track">
        <span>{text}</span>
        <span>{text}</span>
      </div>
    </div>
  );
}
