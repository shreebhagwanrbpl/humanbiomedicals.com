"use client";

import { useEffect, useState } from "react";
import { fetchServicesData, fetchContactData } from "@/lib/data-fetcher";
import { parseContactInfo } from "@/lib/contact-parser";
import Link from "next/link";
import { usePathname } from "next/navigation";

import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";

import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  FileCheck,
  Cpu,
  ArrowRight,
} from "lucide-react";


// =========================================================
// STATIC WORKFLOW DATA
// =========================================================

const workflowSteps = [
  {
    step: "01",
    title: "Diagnostic Audit & Consultation",
    desc: "We analyze your hospital sample load, space constraints, and technical requirements to select the exact analyzer configuration.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Precision Solution Engineering",
    desc: "Custom lab layout designs, power backup specifications, and reagent supply schedule formulation.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Installation & NABL Calibration",
    desc: "Certified engineers perform physical installation, IQ/OQ/PQ protocols, and NABL-traceable reference calibration.",
    icon: Award,
  },
  {
    step: "04",
    title: "24/7 SLA Field Maintenance",
    desc: "Round-the-clock technical emergency support, scheduled preventive maintenance visits, and automated reagent restocking.",
    icon: Zap,
  },
];


// =========================================================
// SERVICES PAGE
// =========================================================

export default function ServicesPage() {

  // =========================================================
  // SERVICES
  // ONLY SQLITE ADMIN DATA
  // NO STATIC FALLBACK
  // =========================================================

  const [services, setServices] = useState([]);

  const [contactInfo, setContactInfo] = useState([]);

  const [loading, setLoading] = useState(true);


  // =========================================================
  // PATH / DISTRICT
  // =========================================================

  const pathname = usePathname();

  const pathParts = pathname
    .split("/")
    .filter(Boolean);


  const staticRoutes = [
    "about",
    "services",
    "products",
    "contact",
    "items",
  ];


  const district =
    pathParts.length > 0 &&
      !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";


  const makeLink = (path) => {

    if (!district) {
      return path;
    }

    if (path === "/") {
      return `/${district}`;
    }

    return `/${district}${path}`;
  };


  // =========================================================
  // STATIC SERVICE ICONS
  // =========================================================
  // Admin me icon save nahi ho raha,
  // isliye icons static rahenge.
  // =========================================================

  const icons = [
    <Microscope
      key={1}
      size={28}
      strokeWidth={2.5}
      className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
    />,

    <FlaskConical
      key={2}
      size={28}
      strokeWidth={2.5}
      className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
    />,

    <ShieldCheck
      key={3}
      size={28}
      strokeWidth={2.5}
      className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
    />,

    <Stethoscope
      key={4}
      size={28}
      strokeWidth={2.5}
      className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
    />,

    <Wrench
      key={5}
      size={28}
      strokeWidth={2.5}
      className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
    />,

    <Activity
      key={6}
      size={28}
      strokeWidth={2.5}
      className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
    />,
  ];


  // =========================================================
  // DYNAMIC DATA (SQLITE ADMIN API)
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    const fetchServicesAndContact = async () => {
      try {
        const [servicesRes, contactRes] = await Promise.all([
          fetchServicesData().catch(() => []),
          fetchContactData().catch(() => []),
        ]);

        if (isMounted) {
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

          if (Array.isArray(contactRes)) {
            setContactInfo(contactRes);
          } else {
            setContactInfo([]);
          }
        }
      } catch (error) {
        console.error("Error loading services/contact data:", error);
        if (isMounted) {
          setServices([]);
          setContactInfo([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchServicesAndContact();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // DYNAMIC EMERGENCY PHONE
  // =========================================================

  const { phones: dynamicPhones } = parseContactInfo(contactInfo);
  const emergencyPhone = dynamicPhones[0] || "";


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="!bg-[#f5fcfd]/40 !text-[#12383a]">


      {/* =====================================================
          PAGE BANNER
          STATIC
      ===================================================== */}

      <PageBanner
        badge="Technical Services"
        title="Biomedical Support From Setup to Service"
        subtitle="NABL-certified calibration, 2-hour emergency repair SLAs, cold-chain reagent distribution, and turnkey pathology setup."
      />


      {/* =====================================================
          SERVICES GRID
      ===================================================== */}

      <section className="section-padding !bg-gradient-to-b from-white via-[#f5fcfd] to-[#eaf9fa]">

        <div className="container-custom">


          <SectionTitle
            badge="Full Service Catalog"
            title="Designed Around Reliable Operations"
            description="Explore our specialized services designed to keep clinical laboratories and hospital departments operating at peak accuracy."
            center
          />


          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">


            {/* =================================================
                LOADING STATE
            ================================================= */}

            {loading &&
              Array.from({ length: 3 }).map(
                (_, index) => (

                  <div
                    key={`service-loading-${index}`}
                    className="rounded-3xl border !border-[#bfe8ea] !bg-white p-8 shadow-sm animate-pulse"
                  >

                    <div className="h-14 w-14 rounded-2xl !bg-[#eaf9fa]" />

                    <div className="mt-6 h-6 w-3/4 rounded !bg-[#eaf9fa]" />

                    <div className="mt-4 space-y-3">

                      <div className="h-4 w-full rounded !bg-[#eaf9fa]" />

                      <div className="h-4 w-5/6 rounded !bg-[#eaf9fa]" />

                      <div className="h-4 w-2/3 rounded !bg-[#eaf9fa]" />

                    </div>

                  </div>

                )
              )}


            {/* =================================================
                DYNAMIC SERVICES
                SQLITE ADMIN ONLY
            ================================================= */}

            {!loading &&
              services.length > 0 &&
              services.map(
                (service, index) => (

                  <ServiceCard
                    key={
                      service.id ||
                      index
                    }

                    icon={
                      icons[
                      index %
                      icons.length
                      ]
                    }

                    title={
                      service.title
                    }

                    description={
                      service.desc
                    }

                    makeLink={
                      makeLink
                    }
                  />

                )
              )}


            {/* =================================================
                NO SERVICES FOUND
            ================================================= */}

            {!loading &&
              services.length === 0 && (

                <div className="col-span-full flex justify-center py-2">

                  <div className="w-full max-w-2xl rounded-3xl border !border-[#bfe8ea] !bg-white p-10 sm:p-12 text-center shadow-sm">


                    {/* ICON */}

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl !bg-[#eaf9fa] !text-[#007f86]">

                      <Stethoscope
                        size={36}
                        strokeWidth={2.5}
                      />

                    </div>


                    {/* TITLE */}

                    <h3 className="mt-6 text-2xl sm:text-3xl font-black !text-[#12383a]">
                      No Services Found
                    </h3>


                    {/* DESCRIPTION */}

                    <p className="mx-auto mt-3 max-w-lg text-sm sm:text-base leading-relaxed !text-[#426568]">
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


      {/* =====================================================
          WORKFLOW PROCESS
          STATIC
      ===================================================== */}

      <section className="section-padding border-y !border-[#bfe8ea]/60 !bg-white">

        <div className="container-custom">


          <SectionTitle
            badge="Execution Framework"
            title="Our 4-Step Engineering Workflow"
            description="A systematic process ensuring seamless integration, rapid compliance, and long-term instrument reliability."
            center
          />


          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">


            {workflowSteps.map(
              (step, index) => {

                const Icon =
                  step.icon;


                return (

                  <div
                    key={index}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border !border-[#bfe8ea] !bg-[#f5fcfd] p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:!border-[#007f86] hover:shadow-xl hover:shadow-[#007f86]/15"
                  >

                    <div>


                      <div className="flex items-center justify-between">


                        <span className="text-4xl font-black !text-[#007f86]/40 transition-colors duration-300 group-hover:!text-[#007f86]">
                          {step.step}
                        </span>


                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl !bg-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:!bg-[#007f86]">

                          <Icon
                            size={24}
                            strokeWidth={2.5}
                            className="!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
                          />

                        </div>

                      </div>


                      <h3 className="mt-6 text-xl font-bold !text-[#12383a] transition-colors duration-300 group-hover:!text-[#007f86]">
                        {step.title}
                      </h3>


                      <p className="mt-3 text-sm leading-relaxed !text-[#12383a]">
                        {step.desc}
                      </p>

                    </div>


                    <div className="mt-6 border-t !border-[#bfe8ea]/60 pt-4">

                      <span className="text-xs font-bold !text-[#00656a]">
                        Phase {index + 1} Milestone
                      </span>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          EMERGENCY BREAKDOWN SLA
          STATIC CONTENT
          PHONE DYNAMIC
      ===================================================== */}

      <section className="section-padding !bg-gradient-to-b from-[#eaf9fa] via-white to-[#f5fcfd]">

        <div className="container-custom">


          <div className="relative overflow-hidden rounded-[36px] border !border-[#007f86]/30 !bg-[#12383a] p-8 !text-white shadow-2xl sm:p-12">


            {/* Background Glow */}

            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full !bg-[#007f86]/25 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full !bg-[#1bb9c1]/10 blur-3xl" />


            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">


              {/* =================================================
                  LEFT
              ================================================= */}

              <div className="lg:col-span-8">


                <span className="inline-flex items-center gap-2 rounded-full border !border-[#1bb9c1]/40 !bg-[#007f86] px-4 py-1.5 text-xs font-bold uppercase tracking-wider !text-white shadow-md">

                  <Zap
                    size={14}
                    strokeWidth={2.5}
                    className="!stroke-white !text-white"
                  />

                  <span className="!text-white">
                    Emergency Breakdown Helpline
                  </span>

                </span>


                <h3 className="mt-5 text-3xl font-black leading-tight !text-white sm:text-4xl">
                  Facing an Equipment Emergency in ICU or Lab?
                </h3>


                <p className="mt-4 max-w-3xl text-base leading-relaxed !text-[#d9f3f5]">
                  Our certified field engineers are equipped with OEM diagnostic kits and genuine spare parts for instant on-site restoration.
                </p>


                <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 text-sm font-semibold">


                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={19}
                      strokeWidth={2.5}
                      className="!stroke-[#1bb9c1] !text-[#1bb9c1]"
                    />

                    <span className="!text-white">
                      2-Hour On-Site SLA
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={19}
                      strokeWidth={2.5}
                      className="!stroke-[#1bb9c1] !text-[#1bb9c1]"
                    />

                    <span className="!text-white">
                      Loaner Analyzer Option
                    </span>

                  </div>


                  <div className="flex items-center gap-2">

                    <CheckCircle2
                      size={19}
                      strokeWidth={2.5}
                      className="!stroke-[#1bb9c1] !text-[#1bb9c1]"
                    />

                    <span className="!text-white">
                      NABL Re-calibration Included
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  RIGHT
              ================================================= */}

              <div className="flex flex-col items-center justify-center border-t !border-[#bfe8ea]/20 pt-7 text-center lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">


                <p className="text-xs font-bold uppercase tracking-wider !text-[#bfe8ea]">
                  Emergency Dispatch
                </p>


                {emergencyPhone ? (

                  <a
                    href={`tel:${emergencyPhone.replace(
                      /\s+/g,
                      ""
                    )}`}
                    className="mt-2 inline-block text-2xl font-black !text-white transition-colors duration-300 hover:!text-[#1bb9c1]"
                  >
                    {emergencyPhone}
                  </a>

                ) : (

                  <p className="mt-2 text-sm !text-[#d9f3f5]">
                    24/7 Field Dispatch Active
                  </p>

                )}


                <Link
                  href={makeLink(
                    "/contact"
                  )}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border !border-[#1bb9c1]/30 !bg-[#007f86] px-6 py-3.5 text-center text-sm font-bold !text-white shadow-lg shadow-[#007f86]/30 transition-all duration-300 hover:-translate-y-0.5 hover:!bg-[#1bb9c1] hover:shadow-xl"
                >

                  <span className="!text-white">
                    Book Priority Repair
                  </span>


                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    className="!stroke-white !text-white transition-transform duration-300 group-hover:translate-x-1"
                  />

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}