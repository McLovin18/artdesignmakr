"use client";

import React from "react";

export function Loading3DIcon() {
  return (
    <div className="flex flex-col items-center justify-center py-10 select-none">

      {/* CONTENEDOR */}
      <div className="relative w-36 h-36 flex items-center justify-center">

        {/* Glow principal */}
        <div className="
          absolute inset-0
          bg-[var(--primary)]/15
          blur-3xl
          rounded-full
          animate-pulse
        " />

        {/* Ring exterior */}
        <div className="
          absolute inset-2
          rounded-full
          border border-[var(--border)]
        " />

        {/* Ring animado */}
        <div className="
          absolute inset-0
          rounded-full
          border-2 border-transparent
          border-t-[var(--primary)]
          animate-spin
        "
        style={{
          animationDuration: "2.5s"
        }}
        />

        {/* Núcleo */}
        <div className="
          relative w-24 h-24
          rounded-full
          bg-[var(--primary)]
          shadow-[0_0_40px_rgba(88,71,56,0.35)]
          flex items-center justify-center
        ">

          {/* Ícono: ramo de flores */}
          <div className="relative w-14 h-14 animate-pulse flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_0_10px_rgba(241,234,218,0.5)]"
              fill="none"
              stroke="var(--color-vanilla, #f1eada)"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* tallos, convergen al lazo */}
              <path d="M12 7.6c0 4 0 7.5 0 9.9" />
              <path d="M7.7 10.3c0.4 2.6 2.2 4.9 4.3 7.2" />
              <path d="M16.3 10.3c-0.4 2.6-2.2 4.9-4.3 7.2" />

              {/* hojas */}
              <path d="M9.6 12.6c-1.1 0.3-2-0.4-2.2-1.5 1.2-0.3 2.1 0.4 2.2 1.5z" />
              <path d="M14.4 14.6c1.1 0.3 2-0.4 2.2-1.5-1.2-0.3-2.1 0.4-2.2 1.5z" />

              {/* flor principal (arriba, centro) */}
              <g>
                <circle cx="12" cy="4.1" r="1.35" />
                <circle cx="13.7" cy="5.05" r="1.35" />
                <circle cx="13.05" cy="6.95" r="1.35" />
                <circle cx="10.95" cy="6.95" r="1.35" />
                <circle cx="10.3" cy="5.05" r="1.35" />
                <circle cx="12" cy="5.5" r="1" fill="var(--color-vanilla, #f1eada)" stroke="none" />
              </g>

              {/* flor izquierda */}
              <g>
                <circle cx="7.4" cy="7.6" r="1.05" />
                <circle cx="8.6" cy="8.35" r="1.05" />
                <circle cx="8.15" cy="9.75" r="1.05" />
                <circle cx="6.65" cy="9.75" r="1.05" />
                <circle cx="6.2" cy="8.35" r="1.05" />
                <circle cx="7.4" cy="8.7" r="0.75" fill="var(--color-vanilla, #f1eada)" stroke="none" />
              </g>

              {/* flor derecha */}
              <g>
                <circle cx="16.6" cy="7.6" r="1.05" />
                <circle cx="17.8" cy="8.35" r="1.05" />
                <circle cx="17.35" cy="9.75" r="1.05" />
                <circle cx="15.85" cy="9.75" r="1.05" />
                <circle cx="15.4" cy="8.35" r="1.05" />
                <circle cx="16.6" cy="8.7" r="0.75" fill="var(--color-vanilla, #f1eada)" stroke="none" />
              </g>

              {/* lazo */}
              <path d="M12 17.5 9.2 16.1 9.5 18.7z" />
              <path d="M12 17.5 14.8 16.1 14.5 18.7z" />
              <circle cx="12" cy="17.5" r="0.55" fill="var(--color-vanilla, #f1eada)" stroke="none" />
              <path d="M11.3 18 10.6 20.6" />
              <path d="M12.7 18 13.4 20.6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Texto */}
      <div className="mt-6 flex flex-col items-center">

        <span className="
          text-[11px]
          font-bold
          tracking-[0.35em]
          uppercase
          text-[var(--text)]
        ">
          Central de Florerías
        </span>


        <div className="flex gap-1.5 mt-3 items-center">

          <div className="flex gap-1.5 animate-loadingSteps">

            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />

            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />

            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />

          </div>
        </div>
      </div>
    </div>
  );
}