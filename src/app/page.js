"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  fetchHomeData,
  fetchContactData,
  fetchServicesData,
  fetchDistrictData,
} from "@/lib/data-fetcher";
import { parseContactInfo } from "@/lib/contact-parser";

import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Mail,
  Wrench,
  Activity,
  Award,
  Clock,
  HeartPulse,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";

import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import ProductCard from "@/components/ProductCard";
import ContactForm from "@/components/ContactForm";
import HeroCarousel from "@/components/HeroCarousel";

import { fetchAllDynamicProducts } from "@/lib/fetchProducts";


// ============================================================
// STATIC STATS
// ============================================================

const stats = [
  {
    number: "5,000+",
    title: "Healthcare Partners",
    desc: "Hospitals & labs served nationwide",
    icon: Building2,
  },
  {
    number: "3,500+",
    title: "Products & Kits",
    desc: "Precision diagnostic instruments",
    icon: Microscope,
  },
  {
    number: "10+ Yrs",
    title: "Engineering Excellence",
    desc: "Proven biomedical leadership",
    icon: ShieldCheck,
  },
  {
    number: "99.9%",
    title: "Accuracy SLA",
    desc: "NABL & ISO certified standards",
    icon: Award,
  },
];


// ============================================================
// STATIC PILLARS
// ============================================================

const pillars = [
  {
    title: "Certified Calibration Standards",
    desc: "Every diagnostic analyzer undergoes NABL-traceable calibration to ensure precise patient diagnostics and regulatory safety.",
    icon: Award,
    badge: "ISO 13485 Certified",
  },
  {
    title: "24/7 Emergency AMC Response",
    desc: "Our nationwide team of biomedical engineers delivers rapid on-site maintenance to keep critical ICU and OT gear active.",
    icon: Zap,
    badge: "2-Hour SLA",
  },
  {
    title: "Turnkey Lab Setup & Engineering",
    desc: "From architectural workflow layout to instrument installation and staff certification, we engineer complete pathology labs.",
    icon: Building2,
    badge: "Turnkey Engineering",
  },
  {
    title: "Cold-Chain Reagent Supply",
    desc: "Strictly temperature-monitored distribution of biochemistry reagents, controls, and rapid assay kits with extended shelf life.",
    icon: FlaskConical,
    badge: "Monitored Cold Chain",
  },
];


// ============================================================
// STATIC TESTIMONIALS
// ============================================================

const testimonials = [
  {
    quote:
      "Human Biomedicals transformed our central laboratory setup. Their automated analyzers increased our daily sample throughput by 40% with zero downtime.",
    author: "Dr. Arvind Sharma",
    role: "Chief Pathologist",
    institution: "Apollo Diagnostics Center",
    rating: 5,
  },
  {
    quote:
      "The 24/7 AMC response team is outstanding. When our ICU patient monitor system faced a sensor issue, their engineer arrived within 90 minutes.",
    author: "Dr. Meenakshi Sundaram",
    role: "Medical Director",
    institution: "Metro Multispecialty Hospital",
    rating: 5,
  },
  {
    quote:
      "Their cold-chain reagent delivery has never failed us. Quality control results are consistently accurate, month after month.",
    author: "Rajesh Varma",
    role: "Laboratory Operations Manager",
    institution: "LifeCare PathLabs",
    rating: 5,
  },
];


export default function Home({ city }) {

  // ============================================================
  // SERVICES
  // SQLITE ADMIN ONLY
  // NO STATIC FALLBACK
  // ============================================================

  const [services, setServices] = useState([]);


  // ============================================================
  // PRODUCTS
  // ONLY DYNAMIC PRODUCTS - NO STATIC FALLBACK
  // ============================================================

  const [products, setProducts] = useState([]);


  const [homeData, setHomeData] =
    useState(null);


  const [contactInfo, setContactInfo] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  // ============================================================
  // ROUTE / DISTRICT
  // ============================================================

  const pathname = usePathname();

  const pathParts =
    pathname
      .split("/")
      .filter(Boolean);


  const staticRoutes = [
    "about",
    "services",
    "items",
    "contact",
  ];


  const district =
    pathParts.length > 0 &&
      !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";


  const locationTitle =
    city ||
    (district
      ? district.replace(/-/g, " ")
      : "");


  const makeLink = (path) => {

    if (!district) {
      return path;
    }


    if (path === "/") {
      return `/${district}`;
    }


    return `/${district}${path}`;
  };


  // ============================================================
  // DYNAMIC DATA (SQLITE ADMIN API)
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [homeRes, contactRes, servicesRes, prodsRes, distRes] = await Promise.all([
          fetchHomeData().catch(() => null),
          fetchContactData().catch(() => []),
          fetchServicesData().catch(() => []),
          fetchAllDynamicProducts().catch(() => []),
          district ? fetchDistrictData(district).catch(() => null) : Promise.resolve(null),
        ]);

        if (isMounted) {
          if (homeRes) {
            setHomeData(homeRes);
          } else {
            setHomeData(null);
          }

          if (Array.isArray(contactRes)) {
            setContactInfo(contactRes);
          } else {
            setContactInfo([]);
          }

          if (Array.isArray(servicesRes)) {
            const dbServices = servicesRes
              .map((service, index) => ({
                id: service?.id || `service-${index}`,
                title: typeof service?.title === "string" ? service.title.trim() : "",
                desc: typeof service?.desc === "string" ? service.desc.trim() : "",
              }))
              .filter((service) => service.title && service.desc);
            setServices(dbServices);
          } else {
            setServices([]);
          }

          if (Array.isArray(prodsRes)) {
            setProducts(prodsRes);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Error loading home data:", err);
        if (isMounted) {
          setServices([]);
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [district]);


  // ============================================================
  // HOME PAGE PRODUCTS
  // ONLY 3 PRODUCTS
  // ============================================================

  const featuredProducts =
    products.slice(0, 3);


  // ============================================================
  // SERVICE ICONS
  // STATIC
  // ============================================================

  const serviceIcons = [
    <Microscope
      size={28}
      key={1}
    />,

    <Building2
      size={28}
      key={2}
    />,

    <Wrench
      size={28}
      key={3}
    />,

    <FlaskConical
      size={28}
      key={4}
    />,

    <Stethoscope
      size={28}
      key={5}
    />,

    <Award
      size={28}
      key={6}
    />,
  ];


  // ============================================================
  // HELPLINE PHONE & SUPPORT EMAIL (DYNAMIC)
  // ============================================================

  const { phones: dynamicPhones, emails: dynamicEmails } = parseContactInfo(contactInfo);
  const helplinePhone = dynamicPhones[0] || "";
  const supportEmail = dynamicEmails[0] || "";


  return (

    <div className="bg-[#f5fcfd]/40 text-[#12383a]">


      {/* ========================================================
          HERO BANNER & CAROUSEL
      ======================================================== */}

      <HeroCarousel
        homeData={homeData}
        locationTitle={locationTitle}
        makeLink={makeLink}
      />


      {/* ========================================================
          STATS TICKER
      ======================================================== */}

      <section className="bg-gradient-to-r from-[#12383a] via-[#12383a] to-[#12383a] py-10 text-white shadow-inner">

        <div className="container-custom">

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">

            {stats.map(
              (item, idx) => {

                const Icon =
                  item.icon;


                return (

                  <div
                    key={idx}
                    className="flex items-center gap-4"
                  >

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#007f86]/40 bg-[#007f86]/25 text-[#bfe8ea]">

                      <Icon
                        size={26}
                      />

                    </div>


                    <div>

                      <h3 className="text-2xl font-black tracking-tight !text-white sm:text-3xl">
                        {item.number}
                      </h3>


                      <p className="text-xs font-bold !text-[#bfe8ea] sm:text-sm">
                        {item.title}
                      </p>


                      <p className="hidden text-[11px] !text-[#bfe8ea]/80 sm:block">
                        {item.desc}
                      </p>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

      </section>


      {/* ========================================================
          WHY CHOOSE US
      ======================================================== */}

      <section className="section-padding bg-gradient-to-b from-white via-[#f5fcfd] to-[#eaf9fa]">

        <div className="container-custom">

          <SectionTitle
            badge="Why Modern Labs Choose Us"
            title="Flowing From Test to Insight"
            description="Fluid, modern interface cues inspired by clean-room environments and precision systems."
            center
          />


          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

            {pillars.map(
              (pillar, index) => {

                const Icon =
                  pillar.icon;


                return (

                  <div
                    key={index}
                    className="group relative flex flex-col justify-between rounded-3xl border border-[#bfe8ea] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#007f86] hover:shadow-2xl hover:shadow-[#007f86]/15"
                  >

                    <div>

                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl !bg-[#d9f3f5] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:!bg-[#007f86]">

                        <Icon
                          size={28}
                          strokeWidth={2.5}
                          className="!text-[#007f86] transition-colors duration-300 group-hover:!text-white"
                        />

                      </div>


                      <span className="mb-3 inline-block rounded-full border border-[#bfe8ea] !bg-[#f5fcfd] px-3 py-1 text-xs font-bold !text-[#00656a]">
                        {pillar.badge}
                      </span>


                      <h3 className="mb-3 text-xl font-bold !text-[#12383a] transition-colors duration-300 group-hover:!text-[#007f86]">
                        {pillar.title}
                      </h3>


                      <p className="text-sm leading-relaxed !text-[#12383a]">
                        {pillar.desc}
                      </p>

                    </div>


                    <div className="mt-8 flex items-center gap-2 border-t border-[#bfe8ea]/40 pt-4 text-xs font-bold !text-[#007f86]">

                      <span className="!text-[#007f86]">
                        Learn standard
                      </span>


                      <ArrowRight
                        size={15}
                        strokeWidth={2.5}
                        className="!text-[#007f86] transition-transform duration-300 group-hover:translate-x-1"
                      />

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

      </section>


      {/* ========================================================
          FEATURED PRODUCTS
      ======================================================== */}

      <section className="section-padding border-y border-[#bfe8ea]/50 bg-white">

        <div className="container-custom">

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

            <SectionTitle
              badge="Diagnostic Inventory"
              title="Equipment Worth Exploring"
              description="Explore our curated catalog of automated clinical analyzers, PCR units, ICU patient monitors, and laboratory centrifuges."
            />


            <Link
              href={makeLink(
                "/items"
              )}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border !border-[#007f86] !bg-[#f5fcfd] px-6 py-3.5 text-sm font-bold !text-[#007f86] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:!bg-[#007f86] hover:!text-white hover:shadow-lg"
            >

              <span className="!text-[#007f86] group-hover:!text-white">
                View All Products
              </span>


              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="!text-[#007f86] group-hover:!text-white"
              />

            </Link>

          </div>


          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {featuredProducts.map(
              (prod) => (

                <ProductCard
                  key={prod.id}
                  product={prod}
                  makeLink={makeLink}
                />

              )
            )}

          </div>

        </div>

      </section>


      {/* ========================================================
          SERVICES MATRIX
          ======================================================== */}

      <section className="section-padding bg-gradient-to-b from-[#eaf9fa] via-white to-[#f5fcfd]">

        <div className="container-custom">


          <SectionTitle
            badge="Healthcare Solutions"
            title="Support Built Around Your Workflow"
            description="From NABL-certified calibration to 2-hour emergency repair response, our certified engineers support your clinical operations round the clock."
            center
          />


          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">


            {/* ==================================================
                LOADING STATE
            ================================================== */}

            {loading &&
              Array.from({
                length: 3,
              }).map(
                (_, index) => (

                  <div
                    key={`service-loading-${index}`}
                    className="rounded-3xl border border-[#bfe8ea] bg-white p-8 shadow-sm animate-pulse"
                  >

                    <div className="h-14 w-14 rounded-2xl bg-[#eaf9fa]" />


                    <div className="mt-6 h-6 w-3/4 rounded bg-[#eaf9fa]" />


                    <div className="mt-4 space-y-3">

                      <div className="h-4 w-full rounded bg-[#eaf9fa]" />

                      <div className="h-4 w-5/6 rounded bg-[#eaf9fa]" />

                      <div className="h-4 w-2/3 rounded bg-[#eaf9fa]" />

                    </div>

                  </div>

                )
              )}


            {/* ==================================================
                DYNAMIC SERVICES
                SQLITE ADMIN ONLY
            ================================================== */}

            {!loading &&
              services.length > 0 &&
              services.map(
                (srv, idx) => (

                  <ServiceCard
                    key={
                      srv.id ||
                      idx
                    }

                    icon={
                      serviceIcons[
                      idx %
                      serviceIcons.length
                      ]
                    }

                    title={
                      srv.title
                    }

                    description={
                      srv.desc
                    }

                    makeLink={
                      makeLink
                    }
                  />

                )
              )}


            {/* ==================================================
                NO SERVICES FOUND
            ================================================== */}

            {!loading &&
              services.length === 0 && (

                <div className="col-span-full flex justify-center py-2">

                  <div className="w-full max-w-2xl rounded-3xl border border-[#bfe8ea] bg-white p-10 text-center shadow-sm sm:p-12">


                    {/* ICON */}

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eaf9fa] text-[#007f86]">

                      <Stethoscope
                        size={36}
                        strokeWidth={2.5}
                      />

                    </div>


                    {/* TITLE */}

                    <h3 className="mt-6 text-2xl font-black !text-[#12383a] sm:text-3xl">
                      No Services Found
                    </h3>


                    {/* DESCRIPTION */}

                    <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed !text-[#426568] sm:text-base">
                      No services are currently
                      available in our service
                      catalog. Please check back
                      later or contact our team
                      for more information.
                    </p>


                    {/* CONTACT BUTTON */}

                    <Link
                      href={makeLink(
                        "/contact"
                      )}
                      className="mt-7 inline-flex items-center justify-center rounded-2xl !bg-[#007f86] px-7 py-3.5 text-sm font-bold !text-white shadow-lg transition-all duration-300 hover:!bg-[#00656a] hover:-translate-y-0.5"
                    >
                      Contact Our Team
                    </Link>

                  </div>

                </div>

              )}

          </div>

        </div>

      </section>


      {/* ========================================================
          ISO & QUALITY CERTIFICATION
      ======================================================== */}

      <section className="relative overflow-hidden bg-[#12383a] !text-white section-padding">

        <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#007f86]/30 blur-3xl" />

        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#1bb9c1]/10 blur-3xl" />


        <div className="container-custom relative z-10">

          <div className="grid items-center gap-12 lg:grid-cols-12">


            {/* LEFT */}

            <div className="lg:col-span-7">

              <span className="inline-flex items-center gap-2 rounded-full border border-[#1bb9c1]/50 !bg-[#007f86]/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider !text-[#eaf9fa] shadow-sm">

                <Award
                  size={16}
                  strokeWidth={2.5}
                  className="!text-[#eaf9fa]"
                />

                <span className="!text-[#eaf9fa]">
                  Quality Assurance & Compliance
                </span>

              </span>


              <h2 className="mt-6 text-3xl font-black leading-tight !text-white sm:text-4xl lg:text-5xl">
                Uncompromised Clinical Accuracy & Regulatory Standards
              </h2>


              <p className="mt-5 max-w-3xl text-base leading-relaxed !text-[#d9f3f5] sm:text-lg">
                Human Biomedicals strictly adheres to international quality protocols.
                Every equipment installation comes with complete IQ/OQ/PQ
                validation documentation and certified calibration reports.
              </p>


              <div className="mt-8 grid gap-4 sm:grid-cols-2">


                {/* ISO CARD */}

                <div className="rounded-2xl border border-[#bfe8ea]/25 !bg-white/10 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1bb9c1]/50 hover:!bg-white/15">

                  <h4 className="flex items-center gap-2 text-lg font-bold !text-white">

                    <ShieldCheck
                      size={21}
                      strokeWidth={2.5}
                      className="!text-[#1bb9c1]"
                    />

                    <span className="!text-white">
                      ISO 13485 & CE Compliance
                    </span>

                  </h4>


                  <p className="mt-2 text-xs leading-relaxed !text-[#d9f3f5]">
                    Certified medical device quality management system for
                    diagnostic analyzers.
                  </p>

                </div>


                {/* SLA CARD */}

                <div className="rounded-2xl border border-[#bfe8ea]/25 !bg-white/10 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1bb9c1]/50 hover:!bg-white/15">

                  <h4 className="flex items-center gap-2 text-lg font-bold !text-white">

                    <Clock
                      size={21}
                      strokeWidth={2.5}
                      className="!text-[#1bb9c1]"
                    />

                    <span className="!text-white">
                      2-Hour SLA Maintenance
                    </span>

                  </h4>


                  <p className="mt-2 text-xs leading-relaxed !text-[#d9f3f5]">
                    Dedicated engineer dispatch team ready for emergency
                    hospital repairs.
                  </p>

                </div>

              </div>

            </div>


            {/* RIGHT */}

            <div className="lg:col-span-5">

              <div className="rounded-3xl border border-[#bfe8ea]/30 !bg-white/10 p-8 text-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-[#1bb9c1]/50 hover:!bg-white/15">


                {/* CERTIFIED CIRCLE */}

                <div className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-[#bfe8ea]/50 bg-gradient-to-br from-[#1bb9c1] via-[#007f86] to-[#00575b] p-2 !text-white shadow-2xl shadow-[#007f86]/50 sm:h-28 sm:w-28">

                  <span className="text-3xl font-black leading-none tracking-tight !text-white sm:text-4xl">
                    100%
                  </span>


                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider !text-white sm:text-[11px]">
                    Certified
                  </span>

                </div>


                <h3 className="mt-6 text-2xl font-bold !text-white">
                  Compliance Guarantee
                </h3>


                <p className="mt-3 text-sm leading-relaxed !text-[#d9f3f5]">
                  All instruments tested with traceable reference standards
                  before dispatch to your medical facility.
                </p>


                <Link
                  href={makeLink(
                    "/contact"
                  )}
                  className="group mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#bfe8ea]/30 !bg-[#007f86] px-8 py-3.5 text-sm font-bold !text-white shadow-xl shadow-[#007f86]/40 transition-all duration-300 hover:-translate-y-0.5 hover:!bg-[#1bb9c1] hover:shadow-2xl"
                >

                  <span className="font-bold !text-white">
                    Request Inspection Certificate
                  </span>


                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    className="!text-white transition-transform duration-300 group-hover:translate-x-1"
                  />

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ========================================================
          TESTIMONIALS
      ======================================================== */}

      <section className="section-padding bg-gradient-to-b from-white via-[#f5fcfd] to-[#eaf9fa]">

        <div className="container-custom">

          <SectionTitle
            badge="What Our Partners Say"
            title="Chosen by Diagnostic Teams"
            description="Read how healthcare professionals rely on Human Biomedicals for accurate diagnostics and uninterrupted equipment uptime."
            center
          />


          <div className="mt-16 grid gap-8 lg:grid-cols-3">

            {testimonials.map(
              (t, idx) => (

                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-3xl border border-[#bfe8ea] bg-white p-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
                >

                  <div>

                    <div className="mb-4 flex gap-1 !text-[#007f86]">

                      {Array.from({
                        length: t.rating,
                      }).map(
                        (_, i) => (
                          <span
                            key={i}
                          >
                            ★
                          </span>
                        )
                      )}

                    </div>


                    <p className="text-sm italic leading-relaxed !text-[#12383a] sm:text-base">
                      "{t.quote}"
                    </p>

                  </div>


                  <div className="mt-8 flex items-center gap-3 border-t border-[#bfe8ea]/60 pt-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full !bg-[#d9f3f5] text-lg font-bold !text-[#007f86]">
                      {t.author.charAt(4) || "D"}
                    </div>


                    <div>

                      <h4 className="text-base font-bold !text-[#12383a]">
                        {t.author}
                      </h4>


                      <p className="text-xs !text-[#12383a]">

                        {t.role}

                        {" — "}

                        <span className="font-medium !text-[#007f86]">
                          {t.institution}
                        </span>

                      </p>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* ========================================================
          QUICK INQUIRY
      ======================================================== */}

      <section className="section-padding border-t border-[#bfe8ea] bg-gradient-to-br from-[#eaf9fa] via-white to-[#d9f3f5]">

        <div className="container-custom">

          <div className="grid items-center gap-12 lg:grid-cols-12">


            {/* LEFT */}

            <div className="lg:col-span-5">

              <SectionTitle
                badge="Direct Consultation"
                title="Planning a Purchase or Need Technical Guidance?"
                description="Our biomedical engineering consultants will analyze your laboratory requirements, recommend optimal instruments, and provide a customized quote."
              />


              <div className="mt-8 space-y-4">


                {/* PHONE */}

                {helplinePhone && (

                  <a
                    href={`tel:${String(
                      helplinePhone
                    ).replace(
                      /\s+/g,
                      ""
                    )}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#bfe8ea] bg-white p-4 shadow-sm transition-colors hover:border-[#007f86]/40"
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl !bg-[#d9f3f5] !text-[#007f86]">

                      <PhoneCall
                        size={22}
                      />

                    </div>


                    <div>

                      <p className="text-xs font-bold !text-[#12383a]">
                        Direct Helpline
                      </p>


                      <p className="text-base font-bold !text-[#12383a]">
                        {helplinePhone}
                      </p>

                    </div>

                  </a>

                )}


                {/* EMAIL */}

                {supportEmail && (

                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#bfe8ea] bg-white p-4 shadow-sm transition-colors hover:border-[#007f86]/40"
                  >

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl !bg-[#d9f3f5] !text-[#007f86]">

                      <Mail
                        size={22}
                      />

                    </div>


                    <div>

                      <p className="text-xs font-bold !text-[#12383a]">
                        Official Email
                      </p>


                      <p className="break-all text-base font-bold !text-[#12383a]">
                        {supportEmail}
                      </p>

                    </div>

                  </a>

                )}

              </div>

            </div>


            {/* RIGHT */}

            <div className="lg:col-span-7">

              <ContactForm
                title="Request a Tailored Equipment Plan"
                subtitle="Fill out the form below and our equipment specialist will reach out within 2 hours."
              />

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}