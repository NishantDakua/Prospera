"use client";

import { useEffect, useRef } from "react";

/**
 * VIEW: GlassSurface
 * Reusable glassmorphic container with SVG displacement-map refraction.
 * Falls back to CSS backdrop-filter on Safari / Firefox.
 *
 * @param {React.ReactNode} children
 * @param {string}          id        - unique ID (required for multiple instances on same page)
 * @param {number}          minHeight - min height in px, default 340
 * @param {string}          className - additional class names
 */
export default function GlassSurface({ children, id = "glass-surface", minHeight = 340, className = "" }) {
    const containerRef = useRef(null);

    const filterId = `${id}-filter`;
    const feMapId = `${id}-femap`;
    const gsRedId = `${id}-gs-red`;
    const gsGreenId = `${id}-gs-green`;
    const gsBlueId = `${id}-gs-blue`;
    const redGradId = `${id}-red-grad`;
    const blueGradId = `${id}-blue-grad`;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const feImage = document.getElementById(feMapId);
        const gsRed = document.getElementById(gsRedId);
        const gsGreen = document.getElementById(gsGreenId);
        const gsBlue = document.getElementById(gsBlueId);

        const br = 28, bw = 0.07, brightness = 50, opacity = 0.93, blur = 11;
        const dist = -180, rOff = 0, gOff = 10, bOff = 20;

        function supportsSVGFilters() {
            const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            if (isWebkit || /Firefox/.test(navigator.userAgent)) return false;
            const d = document.createElement("div");
            d.style.backdropFilter = `url(#${filterId})`;
            return d.style.backdropFilter !== "";
        }

        function generateMap() {
            const { width: w = 800, height: h = 340 } = container.getBoundingClientRect();
            const edge = Math.min(w, h) * (bw * 0.5);
            return "data:image/svg+xml," + encodeURIComponent(`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
    <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="black"/>
  <rect width="${w}" height="${h}" rx="${br}" fill="url(#${redGradId})"/>
  <rect width="${w}" height="${h}" rx="${br}" fill="url(#${blueGradId})" style="mix-blend-mode:difference"/>
  <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${br}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)"/>
</svg>`);
        }

        function apply() {
            if (!feImage) return;
            feImage.setAttribute("href", generateMap());
            [{ el: gsRed, o: rOff }, { el: gsGreen, o: gOff }, { el: gsBlue, o: bOff }].forEach(({ el, o }) => {
                if (!el) return;
                el.setAttribute("scale", String(dist + o));
                el.setAttribute("xChannelSelector", "R");
                el.setAttribute("yChannelSelector", "G");
            });
        }

        if (supportsSVGFilters()) {
            container.classList.replace("glass-surface--fallback", "glass-surface--svg");
            container.style.setProperty("--gs-filter-id", `url(#${filterId})`);
            apply();
            const ro = new ResizeObserver(() => setTimeout(apply, 0));
            ro.observe(container);
            return () => ro.disconnect();
        } else {
            apply();
        }
    }, []);

    return (
        <div ref={containerRef} id={id} className={`glass-surface glass-surface--fallback ${className}`} style={{ minHeight }}>
            <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
                        <feImage id={feMapId} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
                        <feDisplacementMap id={gsRedId} in="SourceGraphic" in2="map" result="dispRed" />
                        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                        <feDisplacementMap id={gsGreenId} in="SourceGraphic" in2="map" result="dispGreen" />
                        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                        <feDisplacementMap id={gsBlueId} in="SourceGraphic" in2="map" result="dispBlue" />
                        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                        <feBlend in="red" in2="green" mode="screen" result="rg" />
                        <feBlend in="rg" in2="blue" mode="screen" result="output" />
                        <feGaussianBlur in="output" stdDeviation="0.7" />
                    </filter>
                </defs>
            </svg>
            <div className="glass-surface__content">{children}</div>
        </div>
    );
}
