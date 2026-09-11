
import {
  Award,
  Zap,
  Building2,
  FlaskConical,
  Wrench,
  Stethoscope,
} from "lucide-react";

export const fallbackServices = [
  {
    id: "srv-1",
    title: "Biomedical Equipment Calibration & Testing",
    desc: "NABL & ISO traceable calibration services ensuring your diagnostic equipment delivers 99.9% accurate clinical results and meets strict regulatory compliance.",
    badge: "SLA Guaranteed",
    turnaround: "24-48 Hours",

    icon: Award,

    highlights: [
      "NABL traceable standards",
      "Detailed calibration certificates",
      "On-site precision verification",
    ],
  },

  {
    id: "srv-2",
    title: "Turnkey Diagnostic Laboratory Setup",
    desc: "End-to-end planning, layout engineering, equipment procurement, workflow optimization, and staff training for modern clinical labs and pathology centers.",
    badge: "Turnkey Solution",
    turnaround: "Custom Timeline",

    icon: Building2,

    highlights: [
      "Space & workflow design",
      "Full instrument installation",
      "Regulatory approval guidance",
    ],
  },

  {
    id: "srv-3",
    title: "24/7 Preventive & Emergency Repair AMC",
    desc: "Comprehensive annual maintenance contracts (AMC/CMC) backed by certified biomedical engineers and rapid 2-hour response for critical ICU and lab gear.",
    badge: "24/7 Rapid Response",
    turnaround: "2-4 Hour Emergency SLA",

    icon: Zap,

    highlights: [
      "Genuine OEM spare parts",
      "Scheduled PM routine visits",
      "Zero diagnostic downtime",
    ],
  },

  {
    id: "srv-4",
    title: "Cold-Chain Reagent Supply & Management",
    desc: "Reliable distribution of clinical chemistry reagents, controls, calibrators, and rapid test kits maintained strictly under temperature-controlled logistics.",
    badge: "Cold Chain Supply",
    turnaround: "Same-Day Dispatch",

    icon: FlaskConical,

    highlights: [
      "Monitored thermal packaging",
      "Lot-to-lot consistency",
      "Automated stock replenishment",
    ],
  },

  {
    id: "srv-5",
    title: "Hospital Tech & ICU System Leasing",
    desc: "Flexible equipment leasing and pay-per-test financial plans allowing hospitals to access state-of-the-art analyzers without heavy initial capital expenditure.",
    badge: "Flexible Financing",
    turnaround: "Instant Evaluation",

    icon: Stethoscope,

    highlights: [
      "Pay-per-test models",
      "Free technical upgrades",
      "Full maintenance included",
    ],
  },

  {
    id: "srv-6",
    title: "Biomedical Staff Training & Skill Certification",
    desc: "Hands-on operational training programs for lab technicians and biomedical engineers covering quality control, troubleshooting, and advanced system operation.",
    badge: "Certified Program",
    turnaround: "Flexible Modules",

    icon: Wrench,

    highlights: [
      "Hands-on lab workshops",
      "QC protocol mastery",
      "Certification awarded",
    ],
  },
];

