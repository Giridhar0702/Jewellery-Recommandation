import React, { useState } from "react";
import { Heart, Star, ShoppingBag, X } from "lucide-react";

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Construct image URL - backend returns full URL in image_path
  let imageUrl = product.image_path || product.image_url;

  if (!imageUrl || imgError) {
    imageUrl = "https://placehold.co/600x600/f5f5f5/c9a24d?text=LuxeGem";
  }

  // Generate random price if missing (for demo)
  const price = product.price
    ? `$${product.price.toLocaleString()}`
    : "Price on Request";
  const name = product.id || product.image || "Elegant Jewelry";
  const displayName = name
    .replace(/\.(jpg|jpeg|png)$/i, "")
    .replace(/[_-]/g, " ");

  return (
    <div
      className="group relative bg-white rounded-sm overflow-hidden border border-transparent hover:border-accent/20 transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        <img
          src={imageUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover object-center transition-transform duration-1000 ease-in-out ${isHovered ? "scale-110" : "scale-100"}`}
          loading="lazy"
        />

        {/* Overlay Actions */}
        <div
          className={`absolute inset-0 bg-black/20 flex items-center justify-center gap-4 transition-all duration-300 ${isHovered ? "opacity-100 backdrop-blur-[2px]" : "opacity-0"}`}
        >
          <button className="bg-white p-3 rounded-none hover:bg-accent hover:text-white transition-colors duration-300 shadow-lg text-primary">
            <Heart size={18} />
          </button>
          <button className="bg-white p-3 rounded-none hover:bg-accent hover:text-white transition-colors duration-300 shadow-lg text-primary">
            <ShoppingBag size={18} />
          </button>
        </div>

        {/* Badges */}
        {product.score && (
          <div className="absolute top-4 left-4 bg-white/95 text-primary text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-sm border border-gray-100">
            {Math.round(product.score * 100)}% Match
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 text-center">
        <div className="mb-2">
          <h3
            className="text-primary font-serif text-lg truncate capitalize tracking-wide"
            title={displayName}
          >
            {displayName}
          </h3>
          <p className="text-xs text-secondary uppercase tracking-widest mt-1">
            {product.category || "Jewelry"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          {/* Simple visual separator or rating */}
          <div className="flex text-accent">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} fill="currentColor" stroke="none" />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <span className="text-lg font-medium text-primary font-serif">
            {price}
          </span>
        </div>

        {/* Explanation / Match Reason */}
        {product.explanation && isHovered && (
          <div className="absolute inset-x-0 bottom-0 bg-white/95 p-4 border-t border-accent/20 text-xs text-secondary italic animate-slide-up shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            "{product.explanation}"
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProductGrid({ products, title }) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-medium text-primary mb-4">
            {title || "Curated For You"}
          </h2>
          <div className="h-0.5 w-12 bg-accent mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.map((item, index) => (
            <ProductCard key={index} product={item.item || item} />
          ))}
        </div>
      </div>
    </section>
  );
}
