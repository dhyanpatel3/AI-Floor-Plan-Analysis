import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AnalysisResult, ProjectSettings } from "../types";
import {
  getMaterialDefaultRate,
  MATERIAL_CATALOG,
} from "../constants/materials";

interface PDFGeneratorParams {
  analysis: AnalysisResult;
  consolidatedReport: { category: string; cost: number }[];
  calculatedQuantities: Record<string, number>;
  customQuantities: Record<string, number>;
  customRates: Record<string, number>;
  totalCost: number;
  settings: ProjectSettings;
  calibrationArea: string; // To show calibrated area
  companyDetails?: {
    name?: string;
    address?: string;
    phone?: string;
    logo?: string;
  };
}

export const generatePDF = ({
  analysis,
  consolidatedReport,
  calculatedQuantities,
  customQuantities,
  customRates,
  totalCost,
  settings,
  calibrationArea,
  companyDetails,
}: PDFGeneratorParams) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Helper for currency
  const formatCurrency = (val: number) => {
    // jsPDF default fonts do not support the Rupee symbol (₹).
    // We manually format with "Rs." or the currency code to avoid broken characters.
    const formattedNumber = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

    const symbol = settings.currency === "INR" ? "Rs." : settings.currency;
    return `${symbol} ${formattedNumber}`;
  };

  // --- Header ---
  let contentStartY = 42;

  // Add Company Logo if available
  // Making logo medium: 30x30
  const logoSize = 30;
  let logoBottomY = 10 + logoSize;
  let hasCompanyDetails = false;

  if (companyDetails?.logo) {
    try {
      doc.addImage(companyDetails.logo, "PNG", margin, 10, logoSize, logoSize);
      hasCompanyDetails = true;
    } catch (e) {
      console.error("Error adding logo", e);
      // If logo fails, we still want to show text, but maybe adjust alignment?
      // For now, let's just proceed.
    }
  }

  // Company Details (Replacing Title)
  const textX = companyDetails?.logo ? margin + logoSize + 10 : margin;
  let textY = 22; // Start slightly lower to align with logo top

  if (
    companyDetails?.name ||
    companyDetails?.address ||
    companyDetails?.phone
  ) {
    hasCompanyDetails = true;
    if (companyDetails.name) {
      doc.setFontSize(20); // Medium-Large Company Name
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(companyDetails.name, textX, textY);
      textY += 8;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10); // Standard readable size
    doc.setTextColor(80, 80, 80);

    if (companyDetails.address) {
      doc.text(companyDetails.address, textX, textY);
      textY += 5;
    }
    if (companyDetails.phone) {
      doc.text(companyDetails.phone, textX, textY);
      textY += 5;
    }

    // Calculate where content should start
    // Ensure we have padding below the lowest element (logo or text)
    // Add extra padding (25 units) to ensure separation
    contentStartY = Math.max(logoBottomY, textY) + 25;
  }

  if (!hasCompanyDetails) {
    // If no company details, keep default title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Project Cost Estimation Report", margin, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 30);
    contentStartY = 45;
  }

  // --- Project Summary Section ---
  doc.setDrawColor(200, 200, 200);
  const lineY = contentStartY - 10;
  doc.line(margin, lineY, pageWidth - margin, lineY);

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Project Summary", margin, contentStartY);

  const summaryData = [
    ["Total Estimated Cost", formatCurrency(totalCost)],
    [
      "Total Area",
      `${
        calibrationArea ||
        (
          analysis.summary.totalAreaSqFt ||
          (analysis.summary.totalAreaSqM
            ? analysis.summary.totalAreaSqM * 10.7639
            : 0)
        ).toFixed(1)
      } ft²`,
    ],
    ["Number of Rooms", analysis.rooms.length.toString()],
    ["Wall Height", `${settings.wallHeightFt} ft`],
  ];

  autoTable(doc, {
    startY: contentStartY + 5, // Dynamic startY based on header height
    head: [],
    body: summaryData,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { halign: "right" },
    },
  });

  // --- Cost Breakdown Section ---
  const breakdownStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Cost Breakdown by Category", margin, breakdownStartY);

  const breakdownData = consolidatedReport.map((item) => [
    item.category,
    formatCurrency(item.cost),
    `${((item.cost / totalCost) * 100).toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: breakdownStartY + 6,
    head: [["Category", "Cost", "% of Total"]],
    body: breakdownData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
  });

  // --- Detailed Bill of Quantities (BOQ) ---
  const boqStartY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("Detailed Bill of Quantities", margin, boqStartY);

  // Prepare BOQ Data
  // We need to merge everything into a list: ID, Qty, Rate, Total
  const allIds = new Set([
    ...Object.keys(calculatedQuantities),
    ...Object.keys(customQuantities),
  ]);

  const boqRows: any[] = [];

  allIds.forEach((id) => {
    const qty = customQuantities[id] ?? calculatedQuantities[id] ?? 0;
    const rate = customRates[id] ?? getMaterialDefaultRate(id);
    const total = qty * rate;
    const def = MATERIAL_CATALOG.find((m) => m.id === id);

    if (qty > 0) {
      boqRows.push({
        material: def ? def.name : id.replace(/-/g, " ").toUpperCase(),
        quantity: qty.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        unit: def ? def.unit : "-",
        rate: formatCurrency(rate),
        total: total, // Keep number for sorting
        formattedTotal: formatCurrency(total),
      });
    }
  });

  // Sort by Total Cost desc
  boqRows.sort((a, b) => b.total - a.total);

  const boqTableData = boqRows.map((row) => [
    row.material,
    row.quantity,
    row.unit,
    row.rate,
    row.formattedTotal,
  ]);

  autoTable(doc, {
    startY: boqStartY + 6,
    head: [["Material Item", "Quantity", "Unit", "Unit Rate", "Total Cost"]],
    body: boqTableData,
    theme: "grid",
    headStyles: { fillColor: [51, 65, 85] }, // Slate-700
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right" },
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right", fontStyle: "bold" },
    },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      doc.internal.pageSize.height - 10,
      { align: "right" },
    );
    doc.text(
      "Generated by AI Floor Analyzer",
      margin,
      doc.internal.pageSize.height - 10,
    );
  }

  doc.save("Project-Estimation-Report.pdf");
};
