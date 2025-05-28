"use client";

import HRBRForm from "@/components/forms/HRBRForm";
import { PTPForm } from "@/components/forms/PTPForm";
import React from "react";

export default function Form() {
  return (
    <div className="max-w-[1062px] mx-auto mt-10">
      <div className="flex flex-col lg:flex-row items-start justify-between gap-8 rounded-[12px] bg-gradient-to-b from-[#80CFEC3D] to-[#149FD23D] [background-image:linear-gradient(171deg,rgba(128,207,236,0.24)_-10.49%,rgba(20,159,210,0.24)_119.61%)] p-6 md:p-10">
        <h1 className="max-w-[410px] shrink-0 text-[24px] md:text-[32px] text-[#1D1F2C] font-semibold leading-[160%] border-b-[2px] border-b-[#3B82F6]">
          999plus - Human Rights Breach Report
        </h1>

        {/* HRBR Form */}
        <HRBRForm />
      </div>

      {/* public tri8gger panel */}
      <div className="max-w-[1062px] mx-auto py-10 md:py-20 xl:py-[100px]">
        <div className="flex items-start justify-start pb-[10px] border-b-[2px] border-b-[#3B82F6] p-6">
          <h1 className="max-w-[410px] text-[24px] md:text-[32px] text-[#1D1F2C] font-semibold leading-[160%]">
            Public Trigger Panel
          </h1>
        </div>

        {/* PTP Form */}
        <div className="flex flex-col gap-10 md:gap-20 xl:gap-[100px] mt-7">
          <PTPForm />
        </div>
      </div>
    </div>
  );
}
