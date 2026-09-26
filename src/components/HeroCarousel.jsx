"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const FALLBACK_SLIDES = [
  {
    id: "static-hero-1",
    type: "image",
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1900&q=80",
  },
  {
    id: "static-hero-2",
    type: "image",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1900&q=80",
  },
  {
    id: "static-hero-3",
    type: "image",
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1900&q=80",
  },
];

export default function HeroCarousel({
  homeData = null,
  locationTitle = "",
  makeLink = (path) => path,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const videoRefs = useRef({});

  const parseMediaList = (data) => {
    if (!data || typeof data !== "object") return [];

    const list = [];

    const tryAddUrl = (rawItem, fallbackType = "image") => {
      if (!rawItem) return;
      let url = "";
      let type = fallbackType;

      if (typeof rawItem === "string") {
        url = rawItem.trim();
      } else if (typeof rawItem === "object") {
        url = (rawItem.url || rawItem.src || rawItem.image || rawItem.imageUrl || rawItem.videoUrl || "").trim();
        if (rawItem.type) type = rawItem.type;
      }

      if (!url) return;

      if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
        type = "video";
      }

      if (!list.some((item) => item.url === url)) {
        list.push({
          id: `media-${list.length}-${url.slice(-10)}`,
          type,
          url,
        });
      }
    };

    // 1. Check array fields
    const arrayFields = [
      data.media,
      data.images,
      data.slides,
      data.carousel,
      data.carouselImages,
      data.bannerImages,
      data.banners,
      data.heroImages,
      data.sliderImages,
      data.gallery,
    ];

    for (const arr of arrayFields) {
      if (Array.isArray(arr) && arr.length > 0) {
        arr.forEach((item) => tryAddUrl(item));
      }
    }

    // 2. Check video arrays
    if (Array.isArray(data.videos) && data.videos.length > 0) {
      data.videos.forEach((v) => tryAddUrl(v, "video"));
    }

    // 3. Check single image/video fields
    const singleFields = [
      data.imageUrl,
      data.image,
      data.bannerUrl,
      data.banner,
      data.heroImageUrl,
      data.heroImage,
    ];
    for (const s of singleFields) {
      if (typeof s === "string" && s.trim()) {
        tryAddUrl(s.trim());
      }
    }

    if (typeof data.videoUrl === "string" && data.videoUrl.trim()) {
      tryAddUrl(data.videoUrl.trim(), "video");
    }
    if (typeof data.video === "string" && data.video.trim()) {
      tryAddUrl(data.video.trim(), "video");
    }

    return list;
  };

  const dynamicSlides = parseMediaList(homeData);

  const slides =
    dynamicSlides.length > 0
      ? dynamicSlides
      : FALLBACK_SLIDES;

  const heroTitle =
    (typeof homeData?.title === "string" && homeData.title.trim()) ||
    (typeof homeData?.heroTitle === "string" && homeData.heroTitle.trim()) ||
    (typeof homeData?.heading === "string" && homeData.heading.trim()) ||
    "";

  const heroDescription =
    (typeof homeData?.description === "string" && homeData.description.trim()) ||
    (typeof homeData?.heroDescription === "string" && homeData.heroDescription.trim()) ||
    (typeof homeData?.desc === "string" && homeData.desc.trim()) ||
    "";

  const btn1Text =
    (typeof homeData?.button1Text === "string" && homeData.button1Text.trim()) ||
    (typeof homeData?.button1 === "string" && homeData.button1.trim()) ||
    "";

  const btn2Text =
    (typeof homeData?.button2Text === "string" && homeData.button2Text.trim()) ||
    (typeof homeData?.button2 === "string" && homeData.button2.trim()) ||
    "";

  const rawBtn1Link =
    (typeof homeData?.button1Link === "string" && homeData.button1Link.trim()) ||
    (typeof homeData?.btn1Link === "string" && homeData.btn1Link.trim()) ||
    "/items";

  const rawBtn2Link =
    (typeof homeData?.button2Link === "string" && homeData.button2Link.trim()) ||
    (typeof homeData?.btn2Link === "string" && homeData.btn2Link.trim()) ||
    "/contact";

  const btn1Href = makeLink(rawBtn1Link);
  const btn2Href = makeLink(rawBtn2Link);

  const activeMedia =
    slides.length > 0
      ? slides[currentSlide] || slides[0]
      : null;

  useEffect(() => {
    if (!isPlaying || slides.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        return (prev + 1) % slides.length;
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  useEffect(() => {
    if (slides.length === 0) {
      setCurrentSlide(0);
      return;
    }

    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  useEffect(() => {
    const currentMedia = slides[currentSlide];

    if (currentMedia?.type !== "video") {
      return;
    }

    const video =
      videoRefs.current[currentSlide];

    if (video) {
      try {
        video.currentTime = 0;
        video.play().catch(() => { });
      } catch {
        // Ignore autoplay restrictions.
      }
    }
  }, [currentSlide, slides]);

  const handlePrev = () => {
    if (slides.length <= 1) return;

    setCurrentSlide((prev) => {
      return (
        (prev - 1 + slides.length) %
        slides.length
      );
    });
  };

  const handleNext = () => {
    if (slides.length <= 1) return;

    setCurrentSlide((prev) => {
      return (prev + 1) % slides.length;
    });
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);

    if (e.targetTouches?.[0]) {
      setTouchStart(
        e.targetTouches[0].clientX
      );
    }
  };

  const onTouchMove = (e) => {
    if (e.targetTouches?.[0]) {
      setTouchEnd(
        e.targetTouches[0].clientX
      );
    }
  };

  const onTouchEnd = () => {
    if (
      touchStart === null ||
      touchEnd === null
    ) {
      return;
    }

    const distance =
      touchStart - touchEnd;

    if (distance > minSwipeDistance) {
      handleNext();
    }

    if (distance < -minSwipeDistance) {
      handlePrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#f5fcfd]
        py-4
        sm:py-6
      "
    >
      <div
        className="
          w-full
          px-2
          sm:px-4
          lg:px-6
        "
      >
        <div
          className="
            relative
            mx-auto
            h-[600px]
            w-full
            overflow-hidden
            rounded-[32px]
            bg-gradient-to-br
            from-[#e3f8fa]
            via-white
            to-[#f5fcfd]
            sm:h-[640px]
            lg:h-[660px]
          "
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* DECORATIVE CIRCLES */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[55%]
              h-[430px]
              w-[430px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border
              border-[#007f86]/10
              sm:h-[540px]
              sm:w-[540px]
              lg:h-[680px]
              lg:w-[680px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-[55%]
              h-[530px]
              w-[530px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              border
              border-[#1bb9c1]/10
              sm:h-[650px]
              sm:w-[650px]
              lg:h-[800px]
              lg:w-[800px]
            "
          />

          {/* DYNAMIC TITLE */}
          {heroTitle && (
            <motion.div
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55 }}
              className="absolute left-6 top-6 z-20 w-[44%] max-w-[520px] text-left sm:left-10 sm:top-8 sm:w-[42%] lg:left-12 lg:top-10 lg:w-[40%]"
            >
              <h1 className="!m-0 text-xl font-black leading-tight !text-[#12383a] sm:text-2xl md:text-3xl lg:text-[32px] xl:text-[36px] line-clamp-3">
                {heroTitle}
              </h1>
            </motion.div>
          )}

          {/* DYNAMIC DESCRIPTION */}
          {heroDescription && (
            <motion.div
              key={`desc-${currentSlide}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="absolute right-6 top-6 z-20 w-[36%] max-w-[420px] text-right sm:right-10 sm:top-8 sm:w-[34%] lg:right-12 lg:top-10 lg:w-[32%]"
            >
              <p className="!m-0 text-xs font-medium leading-relaxed !text-[#61777a] sm:text-sm lg:text-[15px] line-clamp-4">
                {heroDescription}
              </p>
            </motion.div>
          )}

          {/* LEFT PREVIEW */}

          {slides.length > 1 && (
            <motion.div
              key={`left-${(currentSlide - 1 + slides.length) %
                slides.length
                }`}
              initial={{
                opacity: 0,
                x: -40,
                scale: 0.94,
              }}
              animate={{
                opacity: 0.95,
                x: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
              className="
                absolute
                left-[2%]
                top-[55%]
                z-10
                hidden
                h-[250px]
                w-[30%]
                -translate-y-1/2
                overflow-hidden
                rounded-[28px]
                border-4
                border-white
                bg-white
                shadow-[0_20px_60px_rgba(18,56,58,0.14)]
                md:block
                lg:h-[300px]
              "
            >
              {(() => {
                const index =
                  (currentSlide - 1 + slides.length) %
                  slides.length;

                const media = slides[index];

                if (!media) return null;

                if (media.type === "video") {
                  return (
                    <video
                      src={media.url}
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                      muted
                      playsInline
                      preload="auto"
                    />
                  );
                }

                return (
                  <img
                    src={media.url}
                    alt=""
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                );
              })()}
            </motion.div>
          )}

          {/* RIGHT PREVIEW */}

          {slides.length > 1 && (
            <motion.div
              key={`right-${(currentSlide + 1) %
                slides.length
                }`}
              initial={{
                opacity: 0,
                x: 40,
                scale: 0.94,
              }}
              animate={{
                opacity: 0.95,
                x: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
              className="
                absolute
                right-[2%]
                top-[55%]
                z-10
                hidden
                h-[250px]
                w-[30%]
                -translate-y-1/2
                overflow-hidden
                rounded-[28px]
                border-4
                border-white
                bg-white
                shadow-[0_20px_60px_rgba(18,56,58,0.14)]
                md:block
                lg:h-[300px]
              "
            >
              {(() => {
                const index =
                  (currentSlide + 1) %
                  slides.length;

                const media = slides[index];

                if (!media) return null;

                if (media.type === "video") {
                  return (
                    <video
                      src={media.url}
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                      muted
                      playsInline
                      preload="auto"
                    />
                  );
                }

                return (
                  <img
                    src={media.url}
                    alt=""
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                );
              })()}
            </motion.div>
          )}

          {/* MAIN MEDIA */}

          {activeMedia && (
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  activeMedia.id ||
                  currentSlide
                }
                initial={{
                  opacity: 0,
                  scale: 0.86,
                  rotateY: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateY: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.86,
                  rotateY: -10,
                }}
                transition={{
                  duration: 0.65,
                  ease: "easeInOut",
                }}
                className="
                  absolute
                  left-1/2
                  top-[55%]
                  z-20
                  h-[390px]
                  w-[390px]
                  -translate-x-1/2
                  -translate-y-1/2
                  overflow-hidden
                  rounded-full
                  border-[10px]
                  border-white
                  bg-white
                  shadow-[0_30px_100px_rgba(0,127,134,0.24)]
                  sm:h-[480px]
                  sm:w-[480px]
                  lg:h-[570px]
                  lg:w-[570px]
                "
              >
                {activeMedia.type === "video" ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[
                        currentSlide
                      ] = el;
                    }}
                    src={activeMedia.url}
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <img
                    src={activeMedia.url}
                    alt={`Hero Slide ${currentSlide + 1}`}
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />
                )}

                <div
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-[#007f86]/20
                    via-transparent
                    to-transparent
                  "
                />

                {slides.length > 1 && (
                  <div
                    className="
                      absolute
                      bottom-6
                      left-1/2
                      -translate-x-1/2
                      rounded-full
                      bg-[#12383a]/90
                      px-4
                      py-1.5
                      text-xs
                      font-bold
                      text-white
                      shadow-lg
                    "
                  >
                    {currentSlide + 1} /{" "}
                    {slides.length}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* LEFT ARROW - WHITE ICON */}

          {slides.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Slide"
              title="Previous Slide"
              className="
                absolute
                left-5
                top-[55%]
                z-20
                flex
                h-14
                w-14
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-[#007f86]
                text-white
                shadow-[0_10px_35px_rgba(0,0,0,0.18)]
                transition-all
                duration-300
                hover:-translate-y-[55%]
                hover:bg-[#00656a]
                sm:left-8
                sm:h-16
                sm:w-16
                lg:left-10
              "
              style={{
                width: "58px",
                height: "58px",
                minWidth: "58px",
                minHeight: "58px",
                borderRadius: "50%",
                background: "#007f86",
                border: "2px solid #007f86",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                zIndex: 20,
                cursor: "pointer",
                padding: 0,
                color: "#ffffff",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "38px",
                  fontWeight: "700",
                  lineHeight: "1",
                  width: "100%",
                  height: "100%",
                  textAlign: "center",
                  paddingTop: "5px",
                  fontFamily:
                    "Arial, Helvetica, sans-serif",
                }}
              >
                ←
              </span>
            </button>
          )}

          {/* RIGHT ARROW - WHITE ICON */}

          {slides.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Slide"
              title="Next Slide"
              className="
                absolute
                right-5
                top-[55%]
                z-20
                flex
                h-14
                w-14
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                bg-[#007f86]
                text-white
                shadow-[0_10px_35px_rgba(0,0,0,0.18)]
                transition-all
                duration-300
                hover:-translate-y-[55%]
                hover:bg-[#00656a]
                sm:right-8
                sm:h-16
                sm:w-16
                lg:right-10
              "
              style={{
                width: "58px",
                height: "58px",
                minWidth: "58px",
                minHeight: "58px",
                borderRadius: "50%",
                background: "#007f86",
                border: "2px solid #007f86",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                zIndex: 20,
                cursor: "pointer",
                padding: 0,
                color: "#ffffff",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "38px",
                  fontWeight: "700",
                  lineHeight: "1",
                  width: "100%",
                  height: "100%",
                  textAlign: "center",
                  paddingTop: "5px",
                  fontFamily:
                    "Arial, Helvetica, sans-serif",
                }}
              >
                →
              </span>
            </button>
          )}

          {/* DYNAMIC BUTTON 2 (CONNECT / CONTACT) */}
          {btn2Text && (
            <Link
              href={btn2Href}
              className="group absolute bottom-5 left-6 z-20 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#007f86] bg-[#007f86] px-5 py-3 text-sm font-bold !text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#00656a] hover:!text-white sm:bottom-6 sm:left-10 lg:left-12"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            >
              <span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>{btn2Text}</span>
            </Link>
          )}

          {/* DYNAMIC BUTTON 1 (EXPLORE / CATALOG) */}
          {btn1Text && (
            <Link
              href={btn1Href}
              className="group absolute bottom-5 right-6 z-20 inline-flex items-center justify-center gap-2 rounded-xl bg-[#007f86] px-5 py-3 text-sm font-bold !text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#00656a] hover:!text-white sm:bottom-6 sm:right-10 lg:right-12"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            >
              <span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>{btn1Text}</span>
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>→</span>
            </Link>
          )}

          {/* PAGINATION */}

          {slides.length > 1 && (
            <div
              className="
                absolute
                bottom-3
                left-1/2
                z-20
                flex
                -translate-x-1/2
                items-center
                gap-2
              "
            >
              {slides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentSlide(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1
                    }`}
                  style={{
                    height: "10px",
                    width:
                      currentSlide === idx
                        ? "36px"
                        : "10px",
                    minWidth:
                      currentSlide === idx
                        ? "36px"
                        : "10px",
                    borderRadius: "999px",
                    background:
                      currentSlide === idx
                        ? "#007f86"
                        : "rgba(0,127,134,0.3)",
                    padding: 0,
                    margin: 0,
                    border: "none",
                    cursor: "pointer",
                    transition:
                      "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}