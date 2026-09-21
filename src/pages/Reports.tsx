import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Eye,
  Loader2,
  Calendar,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, Button, Badge, LoadingState, EmptyState } from "@/components/ui";
import { generateReport, getReports, getReport } from "@/services/api";
import { generatePDF } from "@/services/pdf";
import { formatDate, formatTimestamp, STATUS_COLORS } from "@/utils/format";
import type { Report, ReportData } from "@/types";

const RANGES = [
  { label: "Last 24 Hours", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
];

export default function Reports() {
  const { selectedStation } = useApp();
  const [reportList, setReportList] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(7);
  const [previewData, setPreviewData] = useState<ReportData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReports(selectedStation?.id);
      setReportList(data);
    } catch {
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedStation?.id]);

  const handleGenerate = async () => {
    if (!selectedStation) return;
    setGenerating(true);
    setError(null);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000).toISOString();
      const res = await generateReport({
        stationId: selectedStation.id,
        startDate,
        endDate,
      });
      setPreviewData(res.reportData);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    try {
      const report = await getReport(id);
      setPreviewData(report.report_data);
    } catch {
      setError("Unable to load report preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = (data: ReportData, reportId: string) => {
    const doc = generatePDF(data, reportId);
    doc.save(`AquaGuard_Report_${reportId.substring(0, 8)}.pdf`);
  };

  const handlePrint = (data: ReportData, reportId: string) => {
    const doc = generatePDF(data, reportId);
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  };

  if (loading) return <LoadingState message="Loading reports..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={load}>Retry</Button>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white">Report Generation</h1>
        <p className="text-sm text-slate-400">
          Generate professional water quality assessment reports as PDF
        </p>
      </div>

      {/* Generate */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <FileText size={16} className="text-cyan-400" />
          Generate New Report
        </h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs text-slate-400">Report Period</p>
            <div className="flex flex-wrap gap-2">
              {RANGES.map((range) => (
                <button
                  key={range.days}
                  onClick={() => setSelectedRange(range.days)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedRange === range.days
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating} size="lg">
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </div>
      </Card>

      {/* Preview */}
      {previewLoading && <LoadingState message="Loading report preview..." />}

      {previewData && !previewLoading && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Report Preview</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePrint(previewData, previewData.station.id)}
              >
                <Printer size={14} />
                Print
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload(previewData, previewData.station.id)}
              >
                <Download size={14} />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
            {/* Header */}
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white">AquaGuard Water Quality Assessment Report</h2>
              <p className="text-xs text-slate-400">
                {previewData.station.name} · {previewData.station.location}
              </p>
              <p className="text-xs text-slate-500">
                Period: {formatDate(previewData.period.start)} — {formatDate(previewData.period.end)}
              </p>
            </div>

            {/* Summary */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white">Executive Summary</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Avg Score</p>
                  <p className="text-lg font-bold text-cyan-300">{previewData.summary.averageScore}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className={STATUS_COLORS[previewData.summary.overallStatus as keyof typeof STATUS_COLORS]?.badge || STATUS_COLORS.safe.badge}>
                    {previewData.summary.overallLabel}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Readings</p>
                  <p className="text-lg font-bold text-white">{previewData.summary.totalReadings}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Anomalies</p>
                  <p className="text-lg font-bold text-amber-300">{previewData.summary.totalAnomalies}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white">Recommendations</h4>
              <div className="space-y-1">
                {previewData.recommendations.map((rec, i) => (
                  <p key={i} className="text-xs text-slate-300">
                    {i + 1}. {rec}
                  </p>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-slate-500">
                Demo predictions are generated using the configured forecasting engine.
                They should not be interpreted as regulatory certification.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Report List */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Generated Reports</h3>
        {reportList.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} />}
            title="No reports generated yet"
            message="Generate a report to see it here"
          />
        ) : (
          <div className="space-y-2">
            {reportList.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <FileText size={18} className="text-cyan-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white">
                    {report.stations?.name || "Unknown Station"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTimestamp(report.generated_at)} · Score: {report.overall_score}
                  </p>
                </div>
                <Badge className={STATUS_COLORS[report.overall_status as keyof typeof STATUS_COLORS]?.badge || STATUS_COLORS.safe.badge}>
                  {report.overall_status.toUpperCase()}
                </Badge>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handlePreview(report.id)}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-all hover:text-cyan-400"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => report.report_data && handleDownload(report.report_data, report.id)}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-all hover:text-emerald-400"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
