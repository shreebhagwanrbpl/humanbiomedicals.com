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
    if (!data) return [];

    const list = [];

    if (Array.isArray(data.media) && data.media.length > 0) {
      data.media.forEach((item, idx) => {
        const url =
          typeof item === "string"
            ? item
            : item?.url;

        const type =
          item?.type ||
          (url?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
            ? "video"
            : "image");

        if (
          url &&
          typeof url === "string" &&
          url.trim() !== ""
        ) {
          list.push({
            id: `media-${idx}`,
            type,
            url: url.trim(),
          });
        }
      });
    }

    if (
      list.length === 0 &&
      Array.isArray(data.images) &&
      data.images.length > 0
    ) {
      data.images.forEach((url, idx) => {
        if (
          url &&
          typeof url === "string" &&
          url.trim() !== ""
        ) {
          list.push({
            id: `img-${idx}`,
            type: "image",
            url: url.trim(),
          });
        }
      });
    }

    if (
      list.length === 0 &&
      (data.imageUrl || data.image)
    ) {
      const singleImg =
        data.imageUrl || data.image;

      if (
        singleImg &&
        typeof singleImg === "string" &&
        singleImg.trim() !== ""
      ) {
        list.push({
          id: "single-img",
          type: "image",
          url: singleImg.trim(),
        });
      }
    }

    if (
      Array.isArray(data.videos) &&
      data.videos.length > 0
    ) {
      data.videos.forEach((vUrl, idx) => {
        if (
          vUrl &&
          typeof vUrl === "string" &&
          vUrl.trim() !== "" &&
          !list.some(
            (item) => item.url === vUrl.trim()
          )
        ) {
          list.push({
            id: `vid-${idx}`,
            type: "video",
            url: vUrl.trim(),
          });
        }
      });
    }

    if (
      data.videoUrl &&
      typeof data.videoUrl === "string" &&
      data.videoUrl.trim() !== "" &&
      !list.some(
        (item) =>
          item.url === data.videoUrl.trim()
      )
    ) {
      list.push({
        id: "single-vid",
        type: "video",
        url: data.videoUrl.trim(),
      });
    }

    return list;
  };

  const dynamicSlides = parseMediaList(homeData);

  const slides =
    dynamicSlides.length > 0
      ? dynamicSlides
      : FALLBACK_SLIDES;

  const heroTitle =
    typeof homeData?.title === "string"
      ? homeData.title.trim()
      : "";

  const heroDescription =
    typeof homeData?.description === "string"
      ? homeData.description.trim()
      : "";

  const btn1Text =
    typeof homeData?.button1Text === "string"
      ? homeData.button1Text.trim()
      : "";

  const btn2Text =
    typeof homeData?.button2Text === "string"
      ? homeData.button2Text.trim()
      : "";

  const btn1Href = makeLink("/items");
  const btn2Href = makeLink("/contact");

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

          {/* TITLE */}

          {heroTitle && (
            <motion.div
              key={`title-${currentSlide}`}
              initial={{
                opacity: 0,
                x: -25,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.55,
              }}
              className="
                absolute
                left-5
                top-7
                z-[55]
                w-[42%]
                max-w-[560px]
                text-left
                sm:left-10
                sm:top-10
                sm:w-[40%]
                lg:left-14
                lg:top-12
                lg:w-[38%]
              "
            >
              <h1
                className="
                  !m-0
                  text-2xl
                  font-black
                  leading-[1.08]
                  !text-[#12383a]
                  sm:text-3xl
                  md:text-4xl
                  lg:text-[44px]
                  xl:text-[48px]
                "
              >
                {heroTitle}
              </h1>
            </motion.div>
          )}

          {/* DESCRIPTION */}

          {heroDescription && (
            <motion.div
              key={`description-${currentSlide}`}
              initial={{
                opacity: 0,
                x: 25,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.55,
                delay: 0.08,
              }}
              className="
                absolute
                right-5
                top-8
                z-[55]
                w-[30%]
                max-w-[440px]
                text-left
                sm:right-10
                sm:top-12
                sm:w-[29%]
                lg:right-14
                lg:top-14
                lg:w-[28%]
              "
            >
              <p
                className="
                  !m-0
                  text-sm
                  font-medium
                  leading-6
                  !text-[#61777a]
                  sm:text-base
                  lg:text-[17px]
                  lg:leading-7
                "
              >
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
                    alt={
                      heroTitle ||
                      `Hero Slide ${currentSlide + 1
                      }`
                    }
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
                z-[9999]
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
                zIndex: 9999,
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
                z-[9999]
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
                zIndex: 9999,
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

          {/* CONTACT BUTTON */}

          {/* CONTACT BUTTON - TEAL BACKGROUND + WHITE ICON + WHITE TEXT */}

          {btn2Text && (
            <Link
              href={btn2Href}
              className="
      group
      absolute
      bottom-10
      left-5
      z-[9999]
      inline-flex
      items-center
      justify-center
      gap-2
      rounded-xl
      border-2
      border-[#007f86]
      bg-[#007f86]
      px-5
      py-3.5
      text-sm
      font-bold
      text-white
      shadow-lg
      transition-all
      duration-300
      hover:-translate-y-0.5
      hover:bg-[#00656a]
      hover:text-white
      sm:left-10
      sm:px-6
      lg:left-14
    "
              style={{
                color: "#ffffff",
                position: "absolute",
                zIndex: 9999,
                bottom: "20px",
                left: "24px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
                background: "#007f86",
                border: "2px solid #007f86",
                borderRadius: "13px",
                padding: "14px 22px",
                fontWeight: "700",
              }}
            >
              {/* PHONE ICON - ALWAYS WHITE */}
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "21px",
                  lineHeight: "1",
                  fontWeight: "700",
                  visibility: "visible",
                  opacity: 1,
                }}
              >
                ☎
              </span>

              {/* CONTACT TEXT - ALWAYS WHITE */}
              <span
                style={{
                  display: "inline-block",
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "14px",
                  lineHeight: "1.2",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  visibility: "visible",
                  opacity: 1,
                }}
              >
                {btn2Text}
              </span>
            </Link>
          )}
          {/* EXPLORE PRODUCTS - WHITE TEXT + WHITE ICON */}

          {btn1Text && (
            <Link
              href={btn1Href}
              className="
                group
                absolute
                bottom-10
                right-5
                z-[9999]
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#007f86]
                px-5
                py-3.5
                text-sm
                font-bold
                text-white
                shadow-lg
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-[#00656a]
                sm:right-10
                sm:px-6
                lg:right-14
              "
              style={{
                color: "#ffffff",
                position: "absolute",
                zIndex: 9999,
                bottom: "20px",
                right: "24px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                background: "#007f86",
                border: "none",
                borderRadius: "13px",
                padding: "14px 22px",
                fontWeight: "700",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "14px",
                  lineHeight: "1.2",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                }}
              >
                {btn1Text}
              </span>

              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  color: "#ffffff",
                  WebkitTextFillColor: "#ffffff",
                  fontSize: "25px",
                  lineHeight: "0.8",
                  fontWeight: "700",
                  marginTop: "-2px",
                }}
              >
                →
              </span>
            </Link>
          )}

          {/* PLAY / PAUSE - WHITE ICON */}

          {slides.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setIsPlaying((prev) => !prev);
              }}
              title={
                isPlaying
                  ? "Pause Slideshow"
                  : "Play Slideshow"
              }
              aria-label={
                isPlaying
                  ? "Pause Slideshow"
                  : "Play Slideshow"
              }
              className="
                absolute
                right-5
                top-5
                z-[9999]
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-[#007f86]
                text-white
                shadow-[0_10px_35px_rgba(0,0,0,0.18)]
                transition-all
                duration-300
                hover:bg-[#00656a]
              "
              style={{
                width: "54px",
                height: "54px",
                minWidth: "54px",
                minHeight: "54px",
                borderRadius: "50%",
                background: "#007f86",
                border: "2px solid #007f86",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                zIndex: 9999,
                cursor: "pointer",
                padding: 0,
                color: "#ffffff",
              }}
            >
              {isPlaying ? (
                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    fontSize: "25px",
                    fontWeight: "900",
                    lineHeight: "1",
                    letterSpacing: "-4px",
                    width: "25px",
                    height: "25px",
                    textAlign: "center",
                    fontFamily:
                      "Arial, Helvetica, sans-serif",
                  }}
                >
                  Ⅱ
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    fontSize: "25px",
                    fontWeight: "900",
                    lineHeight: "1",
                    width: "25px",
                    height: "25px",
                    textAlign: "center",
                    fontFamily:
                      "Arial, Helvetica, sans-serif",
                  }}
                >
                  ▶
                </span>
              )}
            </button>
          )}

          {/* PAGINATION */}

          {slides.length > 1 && (
            <div
              className="
                absolute
                bottom-3
                left-1/2
                z-[9999]
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