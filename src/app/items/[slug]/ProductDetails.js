"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

import { fetchAllDynamicProducts } from "@/lib/fetchProducts";

import {
    FaPlay,
    FaShareAlt,
    FaWhatsapp,
    FaFacebook,
    FaInstagram,
    FaLink,
} from "react-icons/fa";

import { fetchContactData } from "@/lib/data-fetcher";
import { parseContactInfo } from "@/lib/contact-parser";

const loadImageBase64 = async (src) => {
    try {
        if (!src || typeof src !== "string") {
            throw new Error("Invalid image source");
        }

        if (!src.startsWith("http")) {
            return new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    try {
                        resolve(canvas.toDataURL("image/png"));
                    } catch (e) {
                        reject(e);
                    }
                };
                img.onerror = (e) => reject(e);
                img.src = src;
            });
        }

        // Method 1: Fetch via local proxy (bypasses CORS securely)
        try {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("FileReader failed"));
                    reader.readAsDataURL(blob);
                });
            }
        } catch (proxyErr) {
            console.warn("Proxy method failed, falling back to direct fetch...", proxyErr);
        }

        // Method 2: Direct fetch fallback
        try {
            const response = await fetch(src, { cache: "no-cache" });
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error("FileReader failed"));
                    reader.readAsDataURL(blob);
                });
            }
        } catch (fetchErr) {
            console.warn("fetch method failed, falling back to canvas method...", fetchErr);
        }

        // Method 3: Fallback to HTML Image element
        return await new Promise((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL("image/png"));
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(new Error("Image element load failed"));
            img.src = src;
        });
    } catch (err) {
        console.error("loadImageBase64 failed for src:", src, err);
        throw err;
    }
};

const getProductSpecs = (product) => {
    const specsMap = new Map();

    const standardFields = [
        ["Brand", "brand"],
        ["Model", "model"],
        ["Instrument", "instrument"],
        ["Category", "category"],
        ["Capacity", "capacity"],
        ["Throughput", "throughput"],
        ["Usage", "usage"],
        ["Automation", "automation"],
        ["Availability", "availability"]
    ];

    standardFields.forEach(([label, key]) => {
        const val = product[key];
        if (val && String(val).trim() && String(val).trim() !== "N/A") {
            specsMap.set(label, String(val).trim());
        }
    });

    const blacklist = new Set([
        "title", "desc", "description", "image", "images", "slug",
        "uid", "video", "pdf", "isPublished", "category", "subCategory",
        "brand", "model", "instrument", "capacity", "throughput",
        "usage", "automation", "availability",
        "price", "categoryProductId", "category_product_id", "categoryproductid",
        "id", "createdAt", "created_at", "createdat"
    ]);

    if (product.parameters && typeof product.parameters === "string") {
        const parts = product.parameters.split("|");
        parts.forEach((part) => {
            const colonIndex = part.indexOf(":");
            if (colonIndex !== -1) {
                const label = part.substring(0, colonIndex).trim();
                const value = part.substring(colonIndex + 1).trim();
                const lowerLabel = label.toLowerCase();
                if (
                    label &&
                    value &&
                    value !== "N/A" &&
                    !blacklist.has(lowerLabel) &&
                    !lowerLabel.includes("price") &&
                    !lowerLabel.includes("id")
                ) {
                    const cleanLabel = label.replace(/\b\w/g, (c) => c.toUpperCase());
                    specsMap.set(cleanLabel, value);
                }
            }
        });
    }

    if (product.specs && typeof product.specs === "object") {
        if (Array.isArray(product.specs)) {
            product.specs.forEach((item) => {
                if (item && item.label && item.value && String(item.value).trim() !== "N/A") {
                    specsMap.set(item.label, String(item.value).trim());
                }
            });
        } else {
            Object.entries(product.specs).forEach(([k, v]) => {
                if (v && String(v).trim() && String(v).trim() !== "N/A") {
                    const label = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
                    specsMap.set(label, String(v).trim());
                }
            });
        }
    }

    return Array.from(specsMap.entries());
};

const getWebsiteDomain = () => {
    if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
            return host;
        }
    }
    return "humanbiomedicals.com";
};

export default function ProductDetails({ slug }) {
    const [product, setProduct] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedMedia, setSelectedMedia] = useState("image");
    const [showShare, setShowShare] = useState(false);
    const [contactInfo, setContactInfo] = useState([]);
    const [downloadingBrochure, setDownloadingBrochure] = useState(false);

    const shareRef = useRef();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const pathname = usePathname();

    const specificationsList = useMemo(() => {
        if (!product) return [];
        const list = [];
        const added = new Set();

        const addSpec = (label, val) => {
            if (val === null || val === undefined || typeof val === "object") return;
            const strVal = String(val).trim();
            if (!strVal || strVal === "N/A" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "undefined") return;
            const keyLower = label.toLowerCase().trim();
            if (!added.has(keyLower)) {
                added.add(keyLower);
                list.push({ label, value: strVal });
            }
        };

        // Standard dynamic admin fields
        if (product.brand) addSpec("Brand", product.brand);
        if (product.model) addSpec("Model", product.model);
        if (product.instrument) addSpec("Instrument", product.instrument);
        if (product.capacity) addSpec("Capacity", product.capacity);
        if (product.throughput) addSpec("Throughput", product.throughput);
        if (product.usage) addSpec("Usage / Application", product.usage);
        if (product.automation) addSpec("Automation", product.automation);
        if (product.size) addSpec("Size / Dimensions", product.size);
        if (product.availability || product.status) addSpec("Availability", product.availability || product.status);
        if (product.category) addSpec("Category", product.category);
        if (product.subCategory) addSpec("Sub Category", product.subCategory);
        if (product.categoryProductId) addSpec("Product ID", product.categoryProductId);
        // if (product.price && String(product.price).trim()) addSpec("Price", `₹ ${product.price}`);

        // Parse parameters string if given in admin
        if (product.parameters && typeof product.parameters === "string") {
            if (product.parameters.includes("|") || product.parameters.includes(":")) {
                const parts = product.parameters.split("|");
                parts.forEach((part) => {
                    const colonIndex = part.indexOf(":");
                    if (colonIndex !== -1) {
                        const lbl = part.substring(0, colonIndex).trim();
                        const val = part.substring(colonIndex + 1).trim();
                        if (lbl && val) {
                            addSpec(lbl.replace(/\b\w/g, (c) => c.toUpperCase()), val);
                        }
                    } else if (part.trim()) {
                        addSpec("Parameters", part.trim());
                    }
                });
            } else {
                addSpec("Parameters", product.parameters);
            }
        }

        // Parse custom specs object if provided
        if (product.specs && typeof product.specs === "object") {
            if (Array.isArray(product.specs)) {
                product.specs.forEach((item) => {
                    if (item && item.label && item.value) {
                        addSpec(item.label, item.value);
                    } else if (typeof item === "string" && item.includes(":")) {
                        const [k, v] = item.split(":");
                        addSpec(k.trim(), v.trim());
                    }
                });
            } else {
                Object.entries(product.specs).forEach(([k, v]) => {
                    if (v && typeof v !== "object") {
                        const cleanLabel = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
                        addSpec(cleanLabel, v);
                    }
                });
            }
        }

        return list;
    }, [product]);

    const pathParts = pathname
        .split("/")
        .filter(Boolean);

    const city =
        pathParts.length > 1
            ? pathParts[0]
            : "India";

    const cityName =
        city.charAt(0).toUpperCase() +
        city.slice(1);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const allProducts = await fetchAllDynamicProducts();

                const found = Array.isArray(allProducts)
                    ? allProducts.find(
                        (p) => p.slug === slug || p.id === slug
                    )
                    : null;

                setProduct(found || null);

                if (found) {
                    const mainImg =
                        (Array.isArray(found.images) && found.images[0]) ||
                        found.image ||
                        found.imgUrl ||
                        found.imageUrl ||
                        "/logo.png";
                    setSelectedImage(mainImg);
                    setSelectedMedia("image");
                }
            } catch (error) {
                console.error("Error loading product from Firestore:", error);
                setProduct(null);
                setSelectedImage("");
                setSelectedMedia("image");
            }
        };

        loadProduct();
    }, [slug]);

    useEffect(() => {
        let isMounted = true;
        const loadContact = async () => {
            try {
                const data = await fetchContactData();
                if (isMounted && Array.isArray(data)) {
                    setContactInfo(data);
                }
            } catch (err) {
                console.error("Error loading contact info in details:", err);
            }
        };
        loadContact();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleDownloadBrochure = async () => {
        if (!product) return;
        try {
            setDownloadingBrochure(true);
            const { jsPDF } = await import("jspdf");
            const pdfDoc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            // Load logo
            let logoBase64 = null;
            try {
                logoBase64 = await loadImageBase64("/logo.png");
            } catch (e) {
                console.error("Error loading brochure logo:", e);
            }

            // Load product image
            const imgUrl =
                product.image ||
                product.imageUrl ||
                product.imgUrl ||
                (product.images && product.images[0]);
            let productImgBase64 = null;
            if (imgUrl && imgUrl !== "/logo.png") {
                try {
                    productImgBase64 = await loadImageBase64(imgUrl);
                } catch (e) {
                    console.error("Error loading product image for brochure:", e);
                }
            }

            // Layout Dimensions
            const margin = 15;
            const pageWidth = 210;
            const pageHeight = 297;
            const contentWidth = pageWidth - 2 * margin;

            //  Theme Colors
            const colorPrimary = [0, 127, 134];       // #007f86 Brand Teal
            const colorDark = [56, 36, 13];          // #12383a Deep Brown Text
            const colorGray = [91, 70, 52];          // #12383a Subtitle Text
            const colorLightBorder = [191, 232, 234];// #bfe8ea Light Border
            const colorBgWarm = [245, 252, 253];     // #f5fcfd Warm Background

            // 1. HEADER
            let headerLeftOffset = margin;
            if (logoBase64) {
                try {
                    pdfDoc.addImage(logoBase64, "PNG", margin, 14, 14, 14);
                    headerLeftOffset += 18;
                } catch (imgErr) {
                    console.warn("Could not render logo in PDF:", imgErr);
                }
            }

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(16);
            pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.text("Human Biomedicals", headerLeftOffset, 20);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            pdfDoc.text("Biomedical & Diagnostic Equipment Supplier", headerLeftOffset, 25);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);

            const websiteText = getWebsiteDomain();
            const { phones, emails } = parseContactInfo(contactInfo);
            const phoneString = phones.length > 0 ? phones.slice(0, 2).join(", ") : "";
            const emailText = emails.length > 0 ? emails[0] : "";

            pdfDoc.text(`Website: ${websiteText}`, 135, 19);
            if (emailText) {
                pdfDoc.text(`Email: ${emailText}`, 135, 24);
            }
            if (phoneString) {
                pdfDoc.text(`Phone: ${phoneString}`, 135, 29);
            }

            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setLineWidth(0.6);
            pdfDoc.line(margin, 34, pageWidth - margin, 34);

            // 2. PRODUCT TITLE & CATEGORY BADGE
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.text((product.category || "BIOMEDICAL EQUIPMENT").toUpperCase(), margin, 42);

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(15);
            pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            const titleLines = pdfDoc.splitTextToSize(product.title, contentWidth);
            pdfDoc.text(titleLines, margin, 48);
            const titleHeight = titleLines.length * 6.5;

            // 3. PRODUCT IMAGE
            const imageY = 48 + titleHeight + 3;
            const imageHeight = 50;
            const imageWidth = 65;
            const imageX = margin + (contentWidth - imageWidth) / 2;

            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setFillColor(colorBgWarm[0], colorBgWarm[1], colorBgWarm[2]);
            pdfDoc.roundedRect(imageX - 6, imageY - 2, imageWidth + 12, imageHeight + 4, 3, 3, "FD");

            if (productImgBase64) {
                let format = "JPEG";
                if (productImgBase64.startsWith("data:image/png")) {
                    format = "PNG";
                }
                try {
                    pdfDoc.addImage(productImgBase64, format, imageX, imageY, imageWidth, imageHeight);
                } catch (imgAddErr) {
                    console.warn("PDF product image render failed:", imgAddErr);
                    pdfDoc.setFont("helvetica", "normal");
                    pdfDoc.setFontSize(9);
                    pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                    pdfDoc.text("Diagnostic Specification Sheet", imageX + 8, imageY + imageHeight / 2);
                }
            } else {
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setFontSize(9.5);
                pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                pdfDoc.text("Certified Medical Equipment", imageX + 7, imageY + imageHeight / 2);
            }

            // 4. PRODUCT OVERVIEW
            const descY = imageY + imageHeight + 9;
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(11);
            pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.text("Product Overview", margin, descY);

            pdfDoc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.setLineWidth(0.6);
            pdfDoc.line(margin, descY + 2, margin + 28, descY + 2);

            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.setFontSize(8.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);

            let descText = product.desc || product.description || "High precision diagnostic instrument engineered for clinical accuracy.";
            if (descText.length > 350) {
                descText = descText.substring(0, 350) + "...";
            }
            const descLines = pdfDoc.splitTextToSize(descText, contentWidth);
            pdfDoc.text(descLines, margin, descY + 8);
            const descHeight = descLines.length * 4.2;

            // 5. SPECIFICATIONS
            const specsY = descY + 11 + descHeight;
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(11);
            pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.text("Technical Specifications", margin, specsY);

            pdfDoc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            pdfDoc.setLineWidth(0.6);
            pdfDoc.line(margin, specsY + 2, margin + 38, specsY + 2);

            const specs = getProductSpecs(product);

            let specRowY = specsY + 8;
            pdfDoc.setFontSize(8);

            for (let i = 0; i < specs.length; i++) {
                const label = specs[i][0];
                const value = String(specs[i][1]);

                // Zebra row background
                if (i % 2 === 0) {
                    pdfDoc.setFillColor(colorBgWarm[0], colorBgWarm[1], colorBgWarm[2]);
                    pdfDoc.rect(margin, specRowY - 3.5, contentWidth, 5, "F");
                }

                // Print Label
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
                pdfDoc.text(`${label}:`, margin + 2, specRowY);

                // Print Value
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                const valueLines = pdfDoc.splitTextToSize(value, contentWidth - 45);
                pdfDoc.text(valueLines, margin + 42, specRowY);

                specRowY += Math.max(valueLines.length * 3.8, 5);

                if (specRowY > pageHeight - 22) {
                    pdfDoc.addPage();
                    specRowY = margin + 10;
                }
            }

            // 6. FOOTER
            pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
            pdfDoc.setLineWidth(0.4);
            pdfDoc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

            pdfDoc.setFont("helvetica", "italic");
            pdfDoc.setFontSize(7.5);
            pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            pdfDoc.text(
                "Human Biomedicals | NABL-Traceable Calibration • 24/7 SLA Engineering Support",
                pageWidth / 2,
                pageHeight - 9,
                { align: "center" }
            );

            pdfDoc.save(`${product.title.replace(/\s+/g, "_")}_Brochure.pdf`);
            toast.success("Brochure downloaded successfully!");
        } catch (e) {
            console.error("Error creating PDF brochure:", e);
            toast.error("Failed to generate brochure PDF.");
        } finally {
            setDownloadingBrochure(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^[6-9]\d{9}$/;
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.name.trim()) {
            return toast.error(
                "Name is required"
            );
        }

        if (!emailRegex.test(form.email)) {
            return toast.error(
                "Enter valid email"
            );
        }

        if (!phoneRegex.test(form.phone)) {
            return toast.error(
                "Enter valid mobile number"
            );
        }

        try {
            setSubmitting(true);

            const res = await fetch("/api/product-query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    productName: product?.title || "",
                    productSlug: product?.slug || slug || "",
                    brand: product?.brand || "",
                    model: product?.model || "",
                }),
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            toast.success(
                "Your enquiry has been submitted successfully."
            );

            setForm({
                name: "",
                email: "",
                phone: "",
            });
        } catch (error) {
            console.error("Error submitting product enquiry:", error);
            toast.error(
                "Failed to submit enquiry. Please try again or call directly."
            );
        } finally {
            setSubmitting(false);
        }
    };
    const productSchema = product
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            image: product.image ? [product.image] : [],
            description:
                product.desc ||
                product.description ||
                product.title,
            brand: {
                "@type": "Brand",
                name: product.brand || "Human Biomedicals",
            },
        }
        : null;

    const faqSchema = product
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: `What is ${product.title} used for?`,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: `${product.title} is used in hospitals, pathology labs and diagnostic centres.`,
                    },
                },
                {
                    "@type": "Question",
                    name: "Do you provide installation support?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "Yes, installation and technical support are available.",
                    },
                },
            ],
        }
        : null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link Copied");
        setShowShare(false);
    };

    const handleWhatsapp = () => {
        const { whatsappPhone } = parseContactInfo(contactInfo);
        const shareText = `🔬 ${product?.title}

${product?.desc || product?.description || ""}

🌐 ${window.location.href}`;

        const waUrl = whatsappPhone
            ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(shareText)}`
            : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

        window.open(waUrl, "_blank");
    };

    const handleFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                window.location.href
            )}`,
            "_blank"
        );
    };

    const handleInstagram = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Instagram direct sharing available nahi hai. Link copied.");
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: product.title,
                text: product.desc,
                url: window.location.href,
            });
        } else {
            setShowShare(!showShare);
        }
    };

    useEffect(() => {
        const close = (e) => {
            if (
                shareRef.current &&
                !shareRef.current.contains(e.target)
            ) {
                setShowShare(false);
            }
        };

        document.addEventListener("mousedown", close);

        return () =>
            document.removeEventListener("mousedown", close);
    }, []);

    if (!product) {
        return (
            <section className="py-10 md:py-20 !bg-gradient-to-b from-white to-[#f5fcfd]">
                <div className="container-custom">
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="h-[340px] animate-pulse rounded-[28px] !bg-gradient-to-br from-[#d9f3f5] via-white to-[#eaf9fa] sm:h-[420px] md:h-[500px]" />
                        <div className="space-y-6">
                            <div className="h-10 w-3/4 animate-pulse rounded-xl !bg-[#d9f3f5]" />
                            <div className="h-5 w-full animate-pulse rounded-lg !bg-[#eaf9fa]" />
                            <div className="h-5 w-11/12 animate-pulse rounded-lg !bg-[#eaf9fa]" />
                            <div className="h-5 w-8/12 animate-pulse rounded-lg !bg-[#eaf9fa]" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-8 md:py-14 !bg-[#f5fcfd]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <div className="container-custom">
                <div className="mb-5 text-sm !text-[#61777a]">
                    Home / Products / <span className="font-semibold !text-[#12383a]">{product.title}</span>
                </div>

                {/* =========================================================
                    TOP AREA
                    LEFT = IMAGE
                    RIGHT = TITLE + SHARE + STICKY FORM
                    FORM STAYS STICKY; IMAGE IS NOT STICKY
                ========================================================= */}
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">

                    {/* IMAGE - NOT STICKY */}
                    <div className="min-w-0">
                        <div className="relative h-[340px] overflow-hidden rounded-[28px] border !border-[#bfe8ea] !bg-gradient-to-b from-[#f5fcfd] to-white shadow-xl shadow-[#007f86]/10 sm:h-[420px] md:h-[500px] lg:h-[560px]">
                            <div className="absolute left-5 top-5 z-20 rounded-full !bg-gradient-to-r from-[#00656a] to-[#007f86] px-4 py-2 text-xs font-semibold !text-white shadow-lg">
                                Premium Quality
                            </div>

                            {selectedMedia === "video" && product.video ? (
                                <video controls autoPlay className="h-full w-full object-contain p-6">
                                    <source src={product.video} type="video/mp4" />
                                </video>
                            ) : (
                                <>
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center !bg-gradient-to-br from-[#d9f3f5] via-white to-[#eaf9fa]">
                                            <div className="h-20 w-20 animate-spin rounded-full border-4 !border-[#bfe8ea] !border-t-[#00656a]" />
                                        </div>
                                    )}

                                    {(selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) &&
                                        (selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) !== "/logo.png" ? (
                                        <Image
                                            src={selectedImage || product.image || product.imgUrl || product.imageUrl || product.images?.[0]}
                                            alt={product.title || "Product"}
                                            fill
                                            priority
                                            onLoad={() => setImageLoaded(true)}
                                            className="object-contain p-6 transition-all duration-500"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border !border-[#bfe8ea] !bg-white !text-[#007f86] shadow-md">
                                                <span className="text-3xl">🔬</span>
                                            </div>
                                            <span className="mt-4 text-sm font-bold uppercase tracking-wider !text-[#00656a]">
                                                {product.category || "Biomedical Analyzer"}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* MEDIA THUMBNAILS */}
                        <div className="mt-4 flex flex-wrap gap-3">
                            {(Array.isArray(product.images) && product.images.length > 0
                                ? product.images
                                : [product.image || product.imgUrl || product.imageUrl || selectedImage]
                            ).filter((img) => img && img !== "/logo.png").map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSelectedImage(img);
                                        setSelectedMedia("image");
                                    }}
                                    className={`group relative h-18 w-18 overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedMedia === "image" && selectedImage === img
                                        ? "border-[#007f86] shadow-lg shadow-[#007f86]/20"
                                        : "border-[#bfe8ea] hover:border-[#007f86]"
                                        }`}
                                >
                                    <Image src={img} alt={`Thumbnail ${index + 1}`} width={72} height={72} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                                </button>
                            ))}

                            {product.video && (
                                <button
                                    onClick={() => setSelectedMedia("video")}
                                    className={`flex h-18 w-18 flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedMedia === "video"
                                        ? "border-[#007f86] !bg-[#eaf9fa]"
                                        : "border-[#bfe8ea] !bg-white hover:border-[#007f86]"
                                        }`}
                                >
                                    <FaPlay size={18} className="!text-[#007f86]" />
                                    <span className="mt-1 text-[11px] font-semibold !text-[#12383a]">Video</span>
                                </button>
                            )}

                            {product.pdf && (
                                <a
                                    href={product.pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-18 w-18 flex-col items-center justify-center rounded-2xl border-2 !border-[#bfe8ea] !bg-white transition-all duration-300 hover:-translate-y-1 hover:!border-[#007f86] hover:!bg-[#eaf9fa] hover:shadow-lg"
                                >
                                    <span className="text-xl">📄</span>
                                    <span className="mt-1 text-[11px] font-semibold !text-[#12383a]">PDF</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - FORM IS THE ONLY STICKY ELEMENT */}
                    <div className="min-w-0">

                        {/* PRODUCT TITLE */}
                        <div className="relative rounded-[28px] border !border-[#bfe8ea] !bg-white p-6 shadow-lg md:p-7">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <span className="inline-flex rounded-full border !border-[#007f86]/30 !bg-[#f5fcfd] px-4 py-1.5 text-xs font-bold uppercase tracking-wider !text-[#007f86]">
                                        {product.subCategory && product.subCategory !== product.category
                                            ? `${product.category} • ${product.subCategory}`
                                            : product.category || "Biomedical Equipment"}
                                    </span>

                                    <h1 className="mt-4 text-2xl font-black leading-tight !text-[#12383a] sm:text-3xl md:text-4xl">
                                        {product.title}
                                    </h1>

                                    <div className="mt-5">
                                        <button
                                            onClick={handleDownloadBrochure}
                                            disabled={downloadingBrochure}
                                            className="group inline-flex items-center gap-2.5 rounded-2xl !bg-[#007f86] px-5 py-3 text-sm font-bold !text-white shadow-lg shadow-[#007f86]/25 transition-all duration-300 hover:-translate-y-1 hover:!bg-[#1bb9c1] disabled:cursor-not-allowed disabled:opacity-75"
                                        >
                                            {downloadingBrochure ? (
                                                <>
                                                    <svg className="h-5 w-5 animate-spin !text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span className="!text-white">Generating Brochure...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 !text-white transition-transform duration-300 group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    <span className="!text-white">Download Brochure</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* SHARE */}
                                <div ref={shareRef} className="relative shrink-0">
                                    <button
                                        onClick={handleNativeShare}
                                        className="group flex h-11 w-11 items-center justify-center rounded-full border !border-[#bfe8ea] !bg-white !text-[#00656a] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:!border-[#007f86] hover:!bg-[#eaf9fa] hover:!text-[#007f86]"
                                        aria-label="Share Product"
                                    >
                                        <FaShareAlt size={17} className="transition-transform duration-300 group-hover:rotate-12" />
                                    </button>

                                    {showShare && (
                                        <div className="absolute right-0 top-13 z-50 w-56 overflow-hidden rounded-2xl border !border-[#bfe8ea] !bg-white p-2 shadow-2xl">
                                            <button onClick={handleCopy} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left !text-[#61777a] transition hover:!bg-[#eaf9fa] hover:!text-[#00656a]">
                                                <FaLink className="!text-[#00656a]" /> Copy Link
                                            </button>
                                            <button onClick={handleWhatsapp} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left !text-[#61777a] transition hover:!bg-[#eaf9fa] hover:!text-[#00656a]">
                                                <FaWhatsapp className="!text-[#00656a]" /> WhatsApp
                                            </button>
                                            <button onClick={handleFacebook} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left !text-[#61777a] transition hover:!bg-[#eaf9fa] hover:!text-[#00656a]">
                                                <FaFacebook className="!text-[#007f86]" /> Facebook
                                            </button>
                                            <button onClick={handleInstagram} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left !text-[#61777a] transition hover:!bg-[#eaf9fa] hover:!text-[#00656a]">
                                                <FaInstagram className="!text-[#007f86]" /> Instagram
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* QUOTE FORM + PRODUCT DETAILS */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-[500px_1fr] xl:grid-cols-[600px_1fr] gap-6 md:gap-8">
                    <div className="min-w-0">
                        {/* QUOTE FORM - STICKY */}
                        <div className="mt-5 rounded-[28px] border !border-[#bfe8ea] !bg-white p-6 shadow-xl shadow-[#bfe8ea]/40 md:p-7 lg:sticky lg:top-24 lg:z-30">
                            <span className="inline-flex rounded-full !bg-[#eaf9fa] px-4 py-2 text-sm font-semibold !text-[#00656a]">
                                Quick Enquiry
                            </span>

                            <h2 className="mt-4 text-2xl font-black !text-[#12383a] md:text-3xl">
                                Request A Quote
                            </h2>

                            <p className="mt-2 leading-6 !text-[#61777a]">
                                Product: <span className="font-semibold !text-[#007f86]">{product.title}</span>
                            </p>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-2xl border !border-[#bfe8ea] !bg-[#f5fcfd] px-5 py-3.5 !text-[#12383a] outline-none transition-all duration-300 placeholder:!text-[#7d9496] focus:!border-[#007f86] focus:!bg-white focus:ring-4 focus:ring-[#d9f3f5]"
                                />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full rounded-2xl border !border-[#bfe8ea] !bg-[#f5fcfd] px-5 py-3.5 !text-[#12383a] outline-none transition-all duration-300 placeholder:!text-[#7d9496] focus:!border-[#007f86] focus:!bg-white focus:ring-4 focus:ring-[#d9f3f5]"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    maxLength={10}
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                                    className="w-full rounded-2xl border !border-[#bfe8ea] !bg-[#f5fcfd] px-5 py-3.5 !text-[#12383a] outline-none transition-all duration-300 placeholder:!text-[#7d9496] focus:!border-[#007f86] focus:!bg-white focus:ring-4 focus:ring-[#d9f3f5]"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-2xl !bg-gradient-to-r from-[#00656a] to-[#007f86] py-3.5 font-semibold !text-white shadow-lg shadow-[#bfe8ea] transition-all duration-300 hover:-translate-y-1 hover:from-[#12383a] hover:to-[#00656a] disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {submitting ? "Submitting..." : "Get Quote"}
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="min-w-0">
                        {/* PRODUCT DETAILS */}
                        <div className="rounded-[28px] border !border-[#bfe8ea] !bg-white p-6 shadow-xl shadow-[#bfe8ea]/25 md:p-8">
                            <span className="inline-flex rounded-full !bg-[#eaf9fa] px-4 py-2 text-sm font-semibold !text-[#00656a]">
                                Product Details
                            </span>

                            <h2 className="mt-4 text-2xl font-black !text-[#12383a] md:text-3xl">
                                Product Description
                            </h2>

                            <p className="mt-5 text-base leading-8 !text-[#61777a] md:text-lg">
                                {product.desc || product.description || "No description available."}
                            </p>

                            {specificationsList.length > 0 && (
                                <div className="mt-8 overflow-x-auto rounded-2xl border !border-[#bfe8ea]">
                                    <table className="w-full border-collapse">
                                        <tbody>
                                            {specificationsList.map((item, index) => (
                                                <tr key={index} className="border-b !border-[#bfe8ea]/60 last:border-b-0 transition hover:!bg-[#f5fcfd]">
                                                    <td className="w-1/3 !bg-[#f5fcfd]/80 px-5 py-3.5 text-xs font-bold uppercase tracking-wider !text-[#007f86]">
                                                        {item.label}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm font-semibold !text-[#12383a]">
                                                        {item.value}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SEO PRODUCT INFORMATION */}
                <div className="mt-8 rounded-[28px] border !border-[#bfe8ea] !bg-white p-6 shadow-xl shadow-[#bfe8ea]/25 md:p-8">
                    <span className="inline-flex rounded-full !bg-[#eaf9fa] px-4 py-2 text-sm font-semibold !text-[#00656a]">
                        Product Information
                    </span>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        {[
                            {
                                title: `Why Choose Human Biomedicals in ${cityName}?`,
                                content: `Human Biomedicals is a trusted supplier and distributor of ${product.title} in ${cityName}. We provide biomedical and laboratory equipment for hospitals, pathology laboratories, diagnostic centres and healthcare facilities.`,
                            },
                            {
                                title: `Features of ${product.title}`,
                                content: `${product.title} offers reliable performance, accurate results, user-friendly operation, long service life and efficient workflow for laboratories, hospitals and healthcare professionals.`,
                            },
                            {
                                title: `Applications of ${product.title}`,
                                content: `Widely used in hospitals, pathology laboratories, diagnostic centres, blood banks, research institutes and healthcare facilities for accurate and efficient diagnostics.`,
                            },
                            {
                                title: `${product.title} Supplier in ${cityName}`,
                                content: `Human Biomedicals supplies ${product.title} in ${cityName} with expert consultation, installation support, technical guidance and dependable after-sales service.`,
                            },
                            {
                                title: `${product.title} Dealer in ${cityName}`,
                                content: `We are a trusted dealer of ${product.title} in ${cityName}, offering biomedical equipment, laboratory instruments and diagnostic systems.`,
                            },
                            {
                                title: `${product.title} Distributor in ${cityName}`,
                                content: `Looking for a reliable distributor of ${product.title} in ${cityName}? We provide delivery, installation support, maintenance assistance and customer service.`,
                            },
                            {
                                title: `Buy ${product.title} in ${cityName}`,
                                content: `Purchase ${product.title} in ${cityName} from Human Biomedicals with genuine products, competitive pricing and nationwide support.`,
                            },
                            {
                                title: `${product.title} Price in ${cityName}`,
                                content: `The price of ${product.title} depends on the selected model, specifications and configuration. Contact our team for the latest quotation, availability and delivery information.`,
                            },
                        ].map((item, index) => (
                            <div key={index} className="rounded-2xl border !border-[#bfe8ea] !bg-gradient-to-br from-[#f5fcfd] to-white p-5 transition-all duration-300 hover:!border-[#007f86] hover:shadow-lg">
                                <h3 className="text-xl font-bold !text-[#12383a]">{item.title}</h3>
                                <p className="mt-3 leading-7 !text-[#61777a]">{item.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-8 rounded-[28px] border !border-[#bfe8ea] !bg-white p-6 shadow-xl shadow-[#bfe8ea]/25 md:p-8">
                    <span className="inline-flex rounded-full !bg-[#eaf9fa] px-4 py-2 text-sm font-semibold !text-[#00656a]">
                        Help Center
                    </span>

                    <h2 className="mt-4 text-2xl font-black !text-[#12383a] md:text-3xl">
                        Frequently Asked Questions
                    </h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {[
                            {
                                question: `What is ${product.title} used for in ${cityName}?`,
                                answer: `${product.title} is commonly used in hospitals, pathology laboratories, diagnostic centres and healthcare facilities for diagnostic and laboratory applications.`,
                            },
                            {
                                question: `What is the price of ${product.title} in ${cityName}?`,
                                answer: `The price depends on the model, configuration and specifications. Contact our team for the latest quotation and availability.`,
                            },
                            {
                                question: `Are you an authorized supplier of ${product.title}?`,
                                answer: `We supply genuine biomedical and laboratory equipment sourced from trusted manufacturers and brands.`,
                            },
                            {
                                question: `Can hospitals in ${cityName} order this product?`,
                                answer: `Yes. Hospitals, pathology laboratories, diagnostic centres, research institutes and healthcare facilities can purchase this product.`,
                            },
                            {
                                question: "Do you provide installation support?",
                                answer: `Yes. Installation guidance, technical assistance and after-sales support are available for eligible products.`,
                            },
                            {
                                question: "Can I request a quotation?",
                                answer: `Yes. Submit the enquiry form on this page and our team will provide pricing, availability and product details.`,
                            },
                            {
                                question: "Do you provide warranty?",
                                answer: `Warranty coverage depends on the manufacturer and selected product model. Our team will share complete warranty information.`,
                            },
                            {
                                question: "Do you deliver across India?",
                                answer: `Yes. We provide safe packaging and reliable delivery services across India.`,
                            },
                        ].map((item, index) => (
                            <div key={index} className="rounded-2xl border !border-[#bfe8ea] !bg-gradient-to-br from-[#f5fcfd] to-white p-5 transition-all duration-300 hover:-translate-y-1 hover:!border-[#007f86] hover:shadow-lg">
                                <h3 className="text-lg font-bold !text-[#12383a]">{item.question}</h3>
                                <p className="mt-2.5 leading-7 !text-[#61777a]">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
