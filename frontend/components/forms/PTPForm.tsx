"use client";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export function PTPForm() {
  const [selected, setSelected] = useState<string[]>([]);
  const [applicant, setApplicant] = useState("");
  const [court, setCourt] = useState("");
  const [order, setOrder] = useState("");
  const [grounds, setGrounds] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const actions = [
    { label: "File ECRO/CRO Override", value: "ecro" },
    { label: "Demand MP Action", value: "mp" },
    { label: "Submit Article 13 breach", value: "article13" },
    { label: "Join Class Action", value: "classAction" },
    { label: "Upload Evidence Drop", value: "evidence" },
  ];

  const handleDownload = () => {
    const content = `=== N244 Legal Template Draft ===
  
  Selected Actions:
  ${selected
    .map((val) => `- ${actions.find((a) => a.value === val)?.label}`)
    .join("\n")}
  
  Applicant: ${applicant}
  Court: ${court}
  Order Sought: ${order}
  Grounds: ${grounds}
  
  Attached Evidence Files:
  ${
    files
      ? Array.from(files)
          .map((f) => `- ${f.name}`)
          .join("\n")
      : "None"
  }
  
  Additional Note:
  ${note}
  
  (Generated using the N244 Legal Template Tool)
  `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "n244-draft.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ToggleGroup
        type="multiple"
        value={selected}
        onValueChange={setSelected}
        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6"
      >
        {actions.map((action) => (
          <ToggleGroupItem
            key={action.value}
            value={action.value}
            className="w-full sm:w-60 h-[52px] data-[state=on]:bg-[#3371FF] data-[state=on]:text-white data-[state=on]:border-[#3371FF] bg-white hover:bg-[#3371FF] border border-[#3371FF] rounded-md px-[42px] py-[15px] text-[16px] font-normal leading-[140%] text-[#4A4C56] hover:text-white focus:outline-none transition-all"
          >
            {action.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="mt-10 md:mt-20 xl:mt-[100px] flex flex-col lg:flex-row items-start justify-between gap-8 rounded-[12px] bg-gradient-to-b from-[#80CFEC3D] to-[#149FD23D] [background-image:linear-gradient(171deg,rgba(128,207,236,0.24)_-10.49%,rgba(20,159,210,0.24)_119.61%)] p-6 md:p-10">
        <h1 className="max-w-[350px] shrink-0 text-[24px] md:text-[32px] text-[#1D1F2C] font-semibold leading-[160%] border-b-[2px] border-b-[#3B82F6]">
          N244 Legal Template Generator
        </h1>

        <div className="w-full space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col items-start gap-2">
              <label className="text-[16px] font-normal text-[#4A4C56]">
                Applicant
              </label>
              <Input
                type="text"
                value={applicant}
                onChange={(e) => setApplicant(e.target.value)}
                className="h-14 bg-white"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <label className="text-[16px] font-normal text-[#4A4C56]">
                Court
              </label>
              <Input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="h-14 bg-white"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <label className="text-[16px] font-normal text-[#4A4C56]">
                Order Sought
              </label>
              <Input
                type="text"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="h-14 bg-white"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <label className="text-[16px] font-normal text-[#4A4C56]">
                Grounds
              </label>
              <Input
                type="text"
                value={grounds}
                onChange={(e) => setGrounds(e.target.value)}
                className="h-14 bg-white"
              />
            </div>
            <div className="flex flex-col items-start gap-2">
              <label className="text-[16px] font-normal text-[#4A4C56]">
                Evidence Attached
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="w-full h-14 bg-white border border-gray-300 rounded-md px-4 py-2 file:bg-[#f1f5f9] file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:text-[12px] file:text-[#A5A5AB] text-[#A5A5AB] text-[12px"
              />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <label className="text-[16px] font-normal text-[#4A4C56]">
              Additional Note
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full h-[164px] px-[18px] py-[14px] justify-between text-left font-normal bg-white text-[#4A4C56] placeholder:text-[#A5A5AB] text-[16px] leading-[160%] resize-none"
            />
          </div>
          <Button
            onClick={handleDownload}
            className="w-full h-14 p-[14px] flex items-center justify-center gap-6 text-[20px] bg-[#3B82F6] cursor-pointer rounded-[10px] leading-[140%] text-[#FEF7F9] font-medium"
          >
            Download Draft
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="24"
              viewBox="0 0 25 24"
              fill="none"
            >
              <path
                opacity="0.4"
                d="M6.5 10C4.5 10 3.5 11 3.5 13V18C3.5 20 4.5 21 6.5 21H18.5C20.5 21 21.5 20 21.5 18V13C21.5 11 20.5 10 18.5 10H6.5Z"
                fill="white"
              />
              <path
                d="M16.0301 12.47C15.7371 12.177 15.262 12.177 14.969 12.47L13.249 14.19V3C13.249 2.586 12.913 2.25 12.499 2.25C12.085 2.25 11.749 2.586 11.749 3V14.189L10.0291 12.469C9.73608 12.176 9.26104 12.176 8.96804 12.469C8.67504 12.762 8.67504 13.237 8.96804 13.53L11.968 16.53C12.037 16.599 12.1199 16.654 12.2119 16.692C12.3039 16.73 12.401 16.75 12.499 16.75C12.597 16.75 12.6939 16.73 12.7859 16.692C12.8779 16.654 12.9611 16.599 13.0301 16.53L16.0301 13.53C16.3231 13.238 16.3231 12.762 16.0301 12.47Z"
                fill="white"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
