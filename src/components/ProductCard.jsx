"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Microscope } from "lucide-react";
import { makeSlug } from "@/data/productsData";

export default function ProductCard({
  product,
  makeLink = (p) => p,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    id,
    title,
    category,
    subCategory,
    description,
    desc,
    specs = {},
    badge,
    status,
    availability,
    image,
    slug,
    brand,
    model,
    throughput,
    capacity,
    instrument,
    automation,
    usage,
    price,
  } = product;

  const productSlug = slug || makeSlug(title);
  const pdpLink = makeLink(`/items/${productSlug}`);
  const displayDesc = desc || description || "";

  const hasValidImage =
    image &&
    typeof image === "string" &&
    image.trim() !== "" &&
    image !== "/logo.png" &&
    !imgError;

  // Extract exactly 2-3 genuine dynamic specs that exist on the product from Admin
  const dynamicSpecs = [];
  if (brand && String(brand).trim() && String(brand).trim() !== "N/A") {
    dynamicSpecs.push(["Brand", String(brand).trim()]);
  }
  if (model && String(model).trim() && String(model).trim() !== "N/A") {
    dynamicSpecs.push(["Model", String(model).trim()]);
  }
  if (throughput && String(throughput).trim() && String(throughput).trim() !== "N/A") {
    dynamicSpecs.push(["Throughput", String(throughput).trim()]);
  } else if (capacity && String(capacity).trim() && String(capacity).trim() !== "N/A") {
    dynamicSpecs.push(["Capacity", String(capacity).trim()]);
  } else if (instrument && String(instrument).trim() && String(instrument).trim() !== "N/A") {
    dynamicSpecs.push(["Instrument", String(instrument).trim()]);
  } else if (automation && String(automation).trim() && String(automation).trim() !== "N/A") {
    dynamicSpecs.push(["Automation", String(automation).trim()]);
  } else if (usage && String(usage).trim() && String(usage).trim() !== "N/A") {
    dynamicSpecs.push(["Usage", String(usage).trim()]);
  }

  // If we have less than 2, pull from custom specs object if provided
  if (dynamicSpecs.length < 2 && specs && typeof specs === "object") {
    Object.entries(specs).forEach(([k, v]) => {
      if (
        dynamicSpecs.length < 3 &&
        v &&
        String(v).trim() &&
        String(v).trim() !== "N/A" &&
        !dynamicSpecs.some(([ek]) => ek.toLowerCase() === k.toLowerCase())
      ) {
        dynamicSpecs.push([k, String(v).trim()]);
      }
    });
  }

  const displayStatus = status || availability || "In Stock";

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#bfe8ea]/80 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#007f86]/50 hover:shadow-2xl hover:shadow-[#007f86]/15">
      <div>
        {/* Image Container Link */}
        <Link
          href={pdpLink}
          className="relative block h-60 w-full overflow-hidden bg-gradient-to-b from-[#f5fcfd] to-white p-4 border-b border-[#bfe8ea]/40"
        >
          {hasValidImage ? (
            <>
              {/* Shimmer loading skeleton */}
              {!imgLoaded && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#eaf9fa]/70 via-[#f5fcfd] to-[#d9f3f5]/70 animate-pulse">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-[#bfe8ea]/60 text-[#007f86]">
                    <Microscope size={26} className="animate-bounce text-[#007f86]" />
                  </div>
                  <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#00656a]/70">
                    Loading Image...
                  </span>
                </div>
              )}

              <Image
                src={image}
                alt={title || "Biomedical Equipment"}
                fill
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`object-contain p-2 transition-all duration-500 group-hover:scale-105 ${
                  imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </>
          ) : (
            /* Premium Medical Instrument Placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f5fcfd] via-[#eaf9fa] to-[#d9f3f5] p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-md border border-[#bfe8ea] text-[#007f86] transition-transform duration-300 group-hover:scale-110">
                <Microscope size={32} />
              </div>
              <span className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#12383a]">
                {category || "Diagnostic Equipment"}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-[#00656a]/80">
                Certified Specification
              </span>
            </div>
          )}

          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            {badge ? (
              <span className="rounded-full border border-[#007f86]/30 bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-[#007f86] shadow-sm">
                {badge}
              </span>
            ) : (
              <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#12383a] shadow-sm truncate max-w-[150px]">
                {subCategory || category}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-[#007f86] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm shrink-0">
              <ShieldCheck size={12} />
              {displayStatus}
            </span>
          </div>
        </Link>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#007f86] truncate">
              {subCategory && subCategory !== category ? `${category} • ${subCategory}` : category}
            </span>
            {/* {price && String(price).trim() && (
              <span className="text-sm font-extrabold text-[#12383a] shrink-0">
                ₹ {price}
              </span>
            )} */}
          </div>

          <Link href={pdpLink} className="block mt-1.5">
            <h3 className="text-xl font-bold text-[#12383a] leading-tight group-hover:text-[#007f86] transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>

          {displayDesc && (
            <p className="mt-2.5 text-sm text-[#12383a] line-clamp-2 leading-relaxed">
              {displayDesc}
            </p>
          )}

          {/* Key Dynamic Specs (2-3 specs only) */}
          {dynamicSpecs.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[#bfe8ea]/60 bg-[#f5fcfd]/80 p-3 space-y-1.5 text-xs text-[#12383a]">
              {dynamicSpecs.slice(0, 3).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center gap-2">
                  <span className="font-bold text-[#12383a]">{key}:</span>
                  <span className="text-[#007f86] font-semibold truncate max-w-[170px]">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-6 pt-0 mt-2 flex items-center gap-3">
        <Link
          href={pdpLink}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#007f86] py-3 text-center text-sm font-bold !text-white shadow-md transition-all hover:bg-[#00656a] hover:shadow-lg group/btn"
        >
          <span className="!text-white text-white font-bold text-sm tracking-wide">
            Inquire Price & Specs
          </span>
          <ArrowRight size={16} className="!text-white text-white shrink-0 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
