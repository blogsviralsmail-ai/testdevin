export default function AdBanner({ slot = "", format = "auto", className = "" }: { slot?: string; format?: string; className?: string }) {
  return (
    <div className={`ad-container text-center my-4 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
