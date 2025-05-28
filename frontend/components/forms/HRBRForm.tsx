"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function HRBRForm() {
  const [date, setDate] = useState<Date | undefined>();
  const [court, setCourt] = useState("");
  const [right, setRight] = useState("");
  const [breach, setBreach] = useState("");

  const handleDownload = () => {
    const content = `=== Human Rights Breach Report ===\n\nDate of Breach: ${date ? format(date, "dd/MM/yyyy") : "Not specified"}\nCourt / Body: ${court}\nRight Breached: ${right}\n\nDescribe Breach:\n${breach}\n\n(Generated using the HRBR Form)`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hrbr-report.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col items-start gap-2">
        <label className="text-[16px] font-normal text-[#4A4C56]">
          Date of Breach *
        </label>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full px-[18px] justify-between text-left font-normal"
            >
              <span className="text-[#A5A5AB] text-[16px] font-normal leading-[160%]">
                {date ? format(date, "dd/MM/yyyy") : "dd/mm/yyyy"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  opacity="0.4"
                  d="M3 18C3 20 4 21 6 21H18C20 21 21 20 21 18V9H3V18Z"
                  fill="#3B82F6"
                />
                <path
                  d="M18 4.5H16.75V3C16.75 2.586 16.414 2.25 16 2.25C15.586 2.25 15.25 2.586 15.25 3V4.5H8.75V3C8.75 2.586 8.414 2.25 8 2.25C7.586 2.25 7.25 2.586 7.25 3V4.5H6C4 4.5 3 5.5 3 7.5V9H21V7.5C21 5.5 20 4.5 18 4.5Z"
                  fill="#3B82F6"
                />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col items-start gap-2">
        <label className="text-[16px] font-normal text-[#4A4C56]">
          Court / Body *
        </label>
        <Select onValueChange={setCourt}>
          <SelectTrigger className="w-full px-[18px] py-[14px] justify-between text-left font-normal bg-white text-[#A5A5AB] text-[16px] leading-[160%]">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ecj">European Court of Justice</SelectItem>
            <SelectItem value="echr">European Court of Human Rights</SelectItem>
            <SelectItem value="national">National Court</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-start gap-2">
        <label className="text-[16px] font-normal text-[#4A4C56]">
          Right Breached *
        </label>
        <Select onValueChange={setRight}>
          <SelectTrigger className="w-full px-[18px] py-[14px] justify-between text-left font-normal bg-white text-[#A5A5AB] text-[16px] leading-[160%]">
            <SelectValue placeholder="Article 6 - Right to fair trial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="article-6">Article 6 – Right to fair trial</SelectItem>
            <SelectItem value="article-8">Article 8 – Right to privacy</SelectItem>
            <SelectItem value="article-10">Article 10 – Freedom of expression</SelectItem>
            <SelectItem value="article-13">Article 13 – Right to effective remedy</SelectItem>
            <SelectItem value="article-15">Article 15 – Derogation in time of emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-start gap-2">
        <label className="text-[16px] font-normal text-[#4A4C56]">
          Describe Breach
        </label>
        <Textarea
          placeholder="Share your thoughts..."
          className="w-full h-[164px] px-[18px] py-[14px] bg-white text-[#4A4C56] placeholder:text-[#A5A5AB] text-[16px] leading-[160%] resize-none"
          onChange={(e) => setBreach(e.target.value)}
        />
      </div>

      <Button
        onClick={handleDownload}
        className="w-full h-14 p-[14px] flex items-center justify-center gap-6 text-[20px] bg-[#3B82F6] cursor-pointer rounded-[10px] leading-[140%] text-[#FEF7F9] font-medium"
      >
        Download Draft
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
          <path opacity="0.4" d="M6.5 10C4.5 10 3.5 11 3.5 13V18C3.5 20 4.5 21 6.5 21H18.5C20.5 21 21.5 20 21.5 18V13C21.5 11 20.5 10 18.5 10H6.5Z" fill="white" />
          <path d="M16.0301 12.47C15.7371 12.177 15.262 12.177 14.969 12.47L13.249 14.19V3C13.249 2.586 12.913 2.25 12.499 2.25C12.085 2.25 11.749 2.586 11.749 3V14.189L10.0291 12.469C9.73608 12.176 9.26104 12.176 8.96804 12.469C8.67504 12.762 8.67504 13.237 8.96804 13.53L11.968 16.53C12.037 16.599 12.1199 16.654 12.2119 16.692C12.3039 16.73 12.401 16.75 12.499 16.75C12.597 16.75 12.6939 16.73 12.7859 16.692C12.8779 16.654 12.9611 16.599 13.0301 16.53L16.0301 13.53C16.3231 13.238 16.3231 12.762 16.0301 12.47Z" fill="white" />
        </svg>
      </Button>
    </div>
  );
}