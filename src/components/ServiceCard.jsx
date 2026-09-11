import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cloneElement } from "react";

export default function ServiceCard({
  icon,
  title,
  description,
  badge,
  turnaround,
  highlights = [],
  loading = false,
  makeLink = (p) => p,
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border !border-[#bfe8ea] !bg-white p-8 shadow-md">
        <div className="mb-6 h-14 w-14 rounded-2xl !bg-[#d9f3f5]" />
        <div className="mb-4 h-7 w-3/4 rounded !bg-[#cceff1]" />
        <div className="space-y-3">
          <div className="h-4 rounded !bg-[#d9f3f5]" />
          <div className="h-4 w-11/12 rounded !bg-[#d9f3f5]" />
          <div className="h-4 w-8/12 rounded !bg-[#d9f3f5]" />
        </div>
      </div>
    );
  }

  const fixedIcon = icon && typeof icon === "object" && icon.type ? cloneElement(icon, {
    size: icon.props?.size || 28,
    strokeWidth: icon.props?.strokeWidth || 2.5,
    className: "!stroke-[#007f86] !text-[#007f86] transition-all duration-300 group-hover:!stroke-white group-hover:!text-white"
  }) : icon;

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border !border-[#bfe8ea] !bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:!border-[#007f86] hover:shadow-2xl hover:shadow-[#007f86]/15">

      <div>

        {/* ICON + BADGE */}

        <div className="mb-6 flex items-center justify-between gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl !bg-[#d9f3f5] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:!bg-[#007f86]">
            {fixedIcon}
          </div>

          {badge && (
            <span className="rounded-full border !border-[#007f86]/20 !bg-[#eaf9fa] px-3 py-1 text-xs font-bold !text-[#00656a]">
              {badge}
            </span>
          )}

        </div>

        {/* TITLE */}

        <h3 className="mb-3 text-2xl font-bold !text-[#12383a] transition-colors duration-300 group-hover:!text-[#007f86]">
          {title}
        </h3>

        {/* DESCRIPTION */}

        <p className="text-sm leading-relaxed !text-[#12383a] sm:text-base">
          {description}
        </p>

        {/* HIGHLIGHTS */}

        {highlights && highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t !border-[#bfe8ea]/60 pt-5 text-sm !text-[#12383a]">

            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">

                <CheckCircle2 size={16} strokeWidth={2.5} className="!shrink-0 !stroke-[#007f86] !text-[#007f86]" />

                <span className="!text-[#12383a]">
                  {item}
                </span>

              </li>
            ))}

          </ul>
        )}

      </div>

      {/* FOOTER */}

      <div className="mt-8 flex items-center justify-between border-t !border-[#bfe8ea]/60 pt-4">

        {turnaround ? (
          <span className="text-xs font-semibold !text-[#00656a]">
            SLA: <strong className="!text-[#007f86]">{turnaround}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold !text-[#12383a]">
            Certified Quality
          </span>
        )}

        <Link href={makeLink("/contact")} className="group/service inline-flex items-center gap-1.5 text-sm font-bold !text-[#007f86] transition-all duration-300 hover:!text-[#00656a]">
          <span className="!text-[#007f86]">
            Book Service
          </span>

          <ArrowRight size={16} strokeWidth={2.5} className="!stroke-[#007f86] !text-[#007f86] transition-transform duration-300 group-hover/service:translate-x-1" />
        </Link>

      </div>

    </div>
  );
}