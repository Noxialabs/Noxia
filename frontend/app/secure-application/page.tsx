"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { createSecureEntrySystems, deleteSecureEntrySystems, getSingleSecureEntrySystems } from "@/apis/SecureEntrySystemApi";
import { Link, Loader2 } from "lucide-react";
import logo from "@/public/Grouplogo.png";

import { format } from "date-fns";

export default function SecureApplication() {
  const [statement, setStatement] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [referenceCode, setReferenceCode] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempResponse, setTempResponse] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const generateAlias = async () => {
    if (!statement.trim()) {
      toast.error("Please enter a statement or description.");
      return;
    }

    if (!file) {
      toast.error("Please attach a file before generating a reference code.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await createSecureEntrySystems(file, statement);
      setReferenceCode(response.data.referenceCode);
      setTempResponse(response);
      toast.success("Reference code generated successfully!");
    } catch (error) {
      toast.error("Failed to generate reference code. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!statement.trim() || !referenceCode || !tempResponse) {
      toast.error("Please enter a statement and generate a reference code first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await getSingleSecureEntrySystems(tempResponse.data.referenceCode);

      const newSubmission = {
        id: Date.now(),
        statement: response.data.descriptions,
        referenceCode: response.data.referenceCode,
        fileName: response.data.file,
        timestamp: new Date(response.data.createdAt).toLocaleString(),
        qrCodeURL: response.qrCodeDataURL
      };

      setSubmissions([...submissions, newSubmission]);

      setStatement("");
      setFile(null);
      setReferenceCode("");
      setTempResponse(null);

      toast.success("Entry submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit entry. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteEntry = async (id: number, referenceCode: string) => {
    try {
      await deleteSecureEntrySystems(referenceCode);
      const updatedSubmissions = submissions.filter((sub) => sub.id !== id);
      setSubmissions(updatedSubmissions);
      toast.success("Entry deleted successfully!");
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry. Please try again.");
    }
  };

  const exportToPDF = async () => {
    if (!tempResponse) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();


    doc.addImage(logo.src, 'PNG', 20, 10, 25, 25);
    doc.setFontSize(20);
    doc.setTextColor(29, 31, 44);
    doc.text('Secure Entry Document', pageWidth / 2, 45, { align: 'center' });

    // Add QR Code - made smaller and adjusted position
    const qrElement = document.getElementById("qrCanvas");
    if (qrElement) {
      const qrData = (qrElement as HTMLCanvasElement).toDataURL();
      doc.addImage(qrData, 'PNG', pageWidth / 2 - 20, 55, 40, 40);
    }

    doc.setFontSize(11);
    doc.setTextColor(74, 76, 86);

    const contentStart = 110;
    const lineHeight = 8;
    let currentY = contentStart;

    // Reference Code
    doc.setFont(undefined, 'bold');
    doc.text('Reference Code:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(tempResponse.data.referenceCode, 85, currentY);
    currentY += lineHeight * 1.5;

    // Date
    doc.setFont(undefined, 'bold');
    doc.text('Date:', 20, currentY);
    doc.setFont(undefined, 'normal');
    doc.text(format(new Date(tempResponse.data.createdAt), 'PPpp'), 85, currentY);
    currentY += lineHeight * 1.5;

    // Description
    doc.setFont(undefined, 'bold');
    doc.text('Statement/Description:', 20, currentY);
    doc.setFont(undefined, 'normal');
    const descriptionLines = doc.splitTextToSize(tempResponse.data.descriptions, pageWidth - 40);
    doc.text(descriptionLines, 20, currentY + lineHeight);
    currentY += (descriptionLines.length + 1.5) * lineHeight;

    // File Attachment
    doc.setFont(undefined, 'bold');
    doc.text('File Attachment:', 20, currentY);
    doc.setFont(undefined, 'normal');

    // Add file link with better styling
    const attachmentName = tempResponse.data.file.split('/').pop() || 'attachment';
    doc.setTextColor(59, 130, 246);
    doc.setFont(undefined, 'normal');
    doc.textWithLink(attachmentName, 20, currentY + lineHeight, {
      url: tempResponse.data.file
    });

    // Add decorative line above footer
    currentY = pageHeight - 25;
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, currentY, pageWidth - 20, currentY);


    doc.setFontSize(10);
    doc.setTextColor(74, 76, 86);
    doc.text('999plus - AI Crime Reporting for Corruption', pageWidth / 2, pageHeight - 15, {
      align: 'center'
    });

    // Add subtle border to the page
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.rect(10, 5, pageWidth - 20, pageHeight - 10);

    // Save the PDF
    const pdfFileName = `${tempResponse.data.referenceCode}_SecureEntry.pdf`;
    doc.save(pdfFileName);
  };

  const downloadQR = () => {
    if (!tempResponse) return;

    //********* */ Get QR canvas element
    const qrElement = document.getElementById("qrCanvas");
    if (!qrElement) return;

    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(29, 31, 44);
    doc.text('QR Code Document', pageWidth / 2, 45, { align: 'center' });


    doc.addImage(logo.src, 'PNG', 20, 10, 25, 25);

    // Add reference code
    // doc.setFontSize(12);
    // doc.setTextColor(74, 76, 86);
    // doc.text(`Reference Code: ${tempResponse.data.referenceCode}`, pageWidth / 2, 60, { align: 'center' });

    // Add QR Code (centered and larger)
    const qrData = (qrElement as HTMLCanvasElement).toDataURL();
    const qrSize = 70;
    doc.addImage(
      qrData,
      'PNG',
      (pageWidth - qrSize) / 2,
      80,
      qrSize,
      qrSize
    );

    // Add decorative line above footer
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(74, 76, 86);
    doc.text('999plus - AI Crime Reporting for Corruption', pageWidth / 2, pageHeight - 15, {
      align: 'center'
    });

    // Add subtle border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.rect(10, 5, pageWidth - 20, pageHeight - 10);

    // Save the PDF
    doc.save(`${tempResponse.data.referenceCode}_QR.pdf`);
  };

  return (
    <div className="max-w-[846px] mx-auto mt-10 flex flex-col rounded-[12px] bg-gradient-to-b from-[#80CFEC3D] to-[#149FD23D] [background-image:linear-gradient(171deg,rgba(128,207,236,0.24)_-10.49%,rgba(20,159,210,0.24)_119.61%)] p-6 md:p-10">
      <div className="max-w-[536px] mx-auto flex flex-col items-center justify-center gap-2 pb-[10px] border-b-[2px] border-b-[#3B82F6] mb-[38px]">
        <h1 className="shrink-0 text-center text-[24px] md:text-[32px] text-[#1D1F2C] font-semibold leading-[160%]">
          Secure Entry System
        </h1>
        <p className="max-w-[300px] mx-auto text-[16px] text-center leading-[160%] font-normal text-[#1D1F2C]">
          Generate and manage secure reference codes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col items-start gap-2">
            <label className="text-[16px] font-normal text-[#4A4C56]">
              Statement/Description *
            </label>
            <Textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full min-h-[150px] bg-white placeholder:text-[#A5A5AB] placeholder:text-[16px] placeholder:font-normal placeholder:leading-[160%]"
              placeholder="Type your statement or description here..."
              required
            />
          </div>

          <div className="flex flex-col items-start gap-2">
            <label className="text-[16px] font-normal text-[#4A4C56]">
              Attach File *
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.txt"
              className="w-full h-14 bg-white border border-gray-300 rounded-[10px] px-4 py-2 file:bg-[#f1f5f9] file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:text-[12px] file:text-[#A5A5AB] text-[#A5A5AB] text-[12px]"
              required
            />
          </div>
        </div>

        {referenceCode && (
          <div className="p-4 bg-white/5 border border-[#3B82F6]/20 rounded-xl text-center">
            <p className="text-[#4A4C56] text-sm">Your Reference Code</p>
            <p className="text-2xl font-mono font-bold text-[#3B82F6]">{referenceCode}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          <Button
            type="button"
            onClick={generateAlias}
            disabled={isGenerating}
            className="flex-1 h-14 p-[14px] flex items-center justify-center gap-6 text-[20px] bg-[#3B82F6] cursor-pointer rounded-[10px] leading-[140%] text-[#FEF7F9] font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Create Reference'
            )}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-14 p-[14px] flex items-center justify-center gap-6 text-[20px] bg-[#3B82F6] cursor-pointer rounded-[10px] leading-[140%] text-[#FEF7F9] font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Entry'
            )}
          </Button>
        </div>

        {referenceCode && (
          <div className="bg-white/5 p-6 rounded-xl text-center">
            <QRCodeCanvas
              id="qrCanvas"
              value={referenceCode}
              size={192}
              className="mx-auto"
            />
          </div>
        )}

        {referenceCode && (
          <div className="flex flex-wrap gap-4">
            <Button
              type="button"
              onClick={exportToPDF}
              className="flex-1 h-14 p-[14px] flex items-center justify-center gap-6 text-[20px] border border-[#3B82F6] cursor-pointer rounded-[10px] leading-[140%] text-[#3B82F6] font-medium"
            >
              Export Document
            </Button>
            <Button
              type="button"
              onClick={downloadQR}
              className="flex-1 h-14 p-[14px] flex items-center justify-center gap-6 text-[20px] border border-[#3B82F6] cursor-pointer rounded-[10px] leading-[140%] text-[#3B82F6] font-medium"
            >
              Download QR
            </Button>
          </div>
        )}
      </form>

      <div className="mt-12">
        <h2 className="text-[24px] text-[#1D1F2C] font-semibold mb-6">📂 Saved Entries</h2>
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 bg-white/5 border border-[#3B82F6]/20 rounded-xl"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#4A4C56]">{sub.timestamp}</span>
                <button
                  onClick={() => deleteEntry(sub.id, sub.referenceCode)}
                  className="text-red-500 cursor-pointer hover:text-red-600 p-2 rounded-lg"
                >
                  Delete
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[#3B82F6] font-mono font-semibold mt-2">
                    {sub.referenceCode}
                  </p>
                  <p className="text-[#4A4C56] mt-2">{sub.statement}</p>
                </div>
                {/* Add QR Code */}
                <div className="flex justify-center my-3">
                  <QRCodeCanvas
                    value={sub.referenceCode}
                    size={80}
                    className="rounded-lg"
                  />
                </div>
              </div>



              {sub.fileName && (
                <div className="flex items-center flex-wrap justify-between mt-2 gap-2">
                  <p className="text-xs text-[#4A4C56] flex items-center gap-1"> <Link size={16} /> {sub.fileName}</p>
                  <Button
                    onClick={() => window.open(sub.fileName, '_blank')}
                    className="px-4 py-1 cursor-pointer text-xs bg-[#3B82F6] text-white rounded-md hover:bg-[#2563EB] transition-colors"
                  >
                    View File
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
