import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportData } from "@/types";

export function generatePDF(report: ReportData, reportId: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 20;

  // Header background
  doc.setFillColor(8, 145, 178);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AquaGuard Water Quality Assessment Report", margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Based Smart Water Quality Monitoring, Prediction & Anomaly Detection", margin, 28);
  doc.text(`Generated: ${new Date(report.summary ? new Date().toISOString() : Date.now()).toLocaleString()}`, margin, 34);

  y = 50;
  doc.setTextColor(30, 30, 30);

  // Station info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Monitoring Station", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${report.station.name}`, margin, y);
  y += 5;
  doc.text(`Location: ${report.station.location}`, margin, y);
  y += 5;
  doc.text(`Report Period: ${new Date(report.period.start).toLocaleDateString()} to ${new Date(report.period.end).toLocaleDateString()}`, margin, y);
  y += 10;

  // Executive Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Overall Quality Score: ${report.summary.averageScore} / 100`, margin, y);
  y += 5;
  doc.text(`Overall Status: ${report.summary.overallLabel}`, margin, y);
  y += 5;
  doc.text(`Total Readings: ${report.summary.totalReadings}`, margin, y);
  y += 5;
  doc.text(`Total Anomalies: ${report.summary.totalAnomalies}`, margin, y);
  y += 5;
  doc.text(`Total Alerts: ${report.summary.totalAlerts}`, margin, y);
  y += 5;
  doc.text(`Score Range: ${report.summary.minScore} - ${report.summary.maxScore}`, margin, y);
  y += 10;

  // Parameter Analysis
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Parameter Analysis", margin, y);
  y += 4;

  const lastReading = report.readings[report.readings.length - 1];
  if (lastReading) {
    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Value", "Unit", "Status"]],
      body: [
        ["pH", String(lastReading.ph), "", lastReading.ph >= 6.5 && lastReading.ph <= 8.5 ? "Normal" : "Warning"],
        ["Turbidity", String(lastReading.turbidity), "NTU", lastReading.turbidity <= 5 ? "Normal" : "Warning"],
        ["Temperature", String(lastReading.temperature), "°C", lastReading.temperature <= 30 ? "Normal" : "Warning"],
        ["TDS", String(lastReading.tds), "ppm", lastReading.tds <= 500 ? "Normal" : "Warning"],
        ["Dissolved Oxygen", String(lastReading.dissolved_oxygen), "mg/L", lastReading.dissolved_oxygen >= 5 ? "Normal" : "Warning"],
        ["Conductivity", String(lastReading.conductivity), "µS/cm", lastReading.conductivity <= 600 ? "Normal" : "Warning"],
      ],
      theme: "striped",
      headStyles: { fillColor: [8, 145, 178] },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Anomaly Summary
  if (report.anomalies.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Anomaly Summary", margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Observed", "Expected", "Severity", "Status"]],
      body: report.anomalies.slice(0, 10).map((a) => [
        a.parameter,
        String(a.observed_value),
        String(a.expected_value),
        a.severity,
        a.resolved ? "Resolved" : "Open",
      ]),
      theme: "striped",
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Prediction Summary
  if (report.predictions.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AI Prediction Summary", margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Current", "Predicted", "Trend", "Confidence", "Risk"]],
      body: report.predictions.map((p) => [
        p.parameter,
        String(p.current_value),
        String(p.predicted_value),
        p.trend,
        `${p.confidence}%`,
        p.risk_level,
      ]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: margin, right: margin },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Recommendations
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Recommendations", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  report.recommendations.forEach((rec, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 2 * margin);
    if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  });

  // Technical Methodology
  y += 5;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Technical Methodology", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const methodology = [
    "The AquaGuard composite water quality index is calculated from six parameters:",
    "pH (weight 20%), Turbidity (20%), Temperature (10%), TDS (15%), Dissolved Oxygen (20%),",
    "and Conductivity (15%). Each parameter is scored based on its deviation from the",
    "acceptable range, then weighted to produce an overall score (0-100).",
    "",
    "Anomaly detection uses a statistical approach: rolling mean and standard deviation",
    "from the last 50 readings, with z-score thresholding (>2.5 = anomaly).",
    "",
    "Prediction uses a trend-based forecasting model (linear regression with mean",
    "reversion). If ML_API_URL is configured, the system forwards to an external ML service.",
  ];
  methodology.forEach((line) => {
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 4;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "AquaGuard - AI-Based Smart Water Quality Monitoring  |  Report ID: " + reportId,
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      "Demo predictions are generated using the configured forecasting engine. They should not be interpreted as regulatory certification.",
      margin,
      doc.internal.pageSize.getHeight() - 4
    );
  }

  return doc;
}
