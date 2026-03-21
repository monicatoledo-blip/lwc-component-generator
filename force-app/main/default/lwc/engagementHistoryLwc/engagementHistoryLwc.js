// engagementHistoryLwc.js — v2.3.0 chart-api-lwb
/*
 * Reactivity: toggles, comboboxes, and sort use primitive class fields (default LWC reactivity).
 * Bar charts read @api campaign/asset props (LWB); the data table uses filteredRows.
 * Chart redraw runs in renderedCallback after each render.
 * Locker: canvases are resolved only via this.template.querySelector (never document.*).
 */
import { LightningElement, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import ChartJs from "@salesforce/resourceUrl/ChartJs";

/** Salesforce brand colors for horizontal bars (uniform per chart). */
const SF_CAMPAIGN_BAR = "#0176d3";
const SF_ASSET_BAR = "#2e844a";

/**
 * Inline Chart.js plugin: draw the numeric value just past the end of each bar
 * (no chartjs-plugin-datalabels dependency).
 */
function createBarEndValuePlugin(pluginId) {
  return {
    id: pluginId,
    afterDatasetsDraw(chart) {
      const dataset = chart.data?.datasets?.[0];
      const meta = chart.getDatasetMeta(0);
      if (!dataset?.data?.length || !meta?.data?.length) {
        return;
      }
      const { ctx } = chart;
      ctx.save();
      ctx.font =
        '600 12px system-ui, -apple-system, "Segoe UI", "Salesforce Sans", sans-serif';
      ctx.fillStyle = "#3e3e3c";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      meta.data.forEach((element, index) => {
        const raw = dataset.data[index];
        if (raw === null || raw === undefined) {
          return;
        }
        const num = Number(raw);
        if (Number.isNaN(num)) {
          return;
        }
        const text = String(num);
        const { x, y, base } = element.getProps(["x", "y", "base"], true);
        const endX = Math.max(x, base);
        ctx.fillText(text, endX + 8, y);
      });
      ctx.restore();
    }
  };
}

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
  { label: "Last 12 Months", value: "365" }
];

export default class EngagementHistoryLwc extends LightningElement {
  // ── Configurable properties ────────────────────────────────
  @api cardTitle = "Engagement History";

  /** @deprecated Flexipages still pass this; component does not read it (fixed SF blue for header icon). */
  @api accentColor = "#0176d3";

  @api barChartColor = "#0176d3";
  @api assetBarColor = "#2e844a";
  @api tableLinkColor = "#0070d2";

  // Campaign bar data (design-time values — match generator form defaults)
  @api campaign1Name = "Q3 Wealth Management Webinar";
  @api campaign1Value = "8";
  @api campaign2Name = "High Net Worth Prospect Outreach";
  @api campaign2Value = "5";
  @api campaign3Name = "Retirement Planning Drip Campaign";
  @api campaign3Value = "4";

  // Asset bar data
  @api asset1Name = "Wealth Management eBook";
  @api asset1Value = "8";
  @api asset2Name = "Investment Portfolio Guide";
  @api asset2Value = "5";
  @api asset3Name = "HNW Client Onboarding Email";
  @api asset3Value = "4";
  @api asset4Name = "Retirement Calculator Landing Page";
  @api asset4Value = "2";

  // Table row data
  @api row1Asset = "Wealth Management eBook";
  @api row1ContentType = "eBook";
  @api row1ActivityType = "Download";
  @api row1Campaign = "Q3 Wealth Management Webinar";
  @api row1Date = "03/15/2026 2:22 PM";

  @api row2Asset = "Investment Portfolio Guide";
  @api row2ContentType = "Whitepaper";
  @api row2ActivityType = "Download";
  @api row2Campaign = "High Net Worth Prospect Outreach";
  @api row2Date = "03/14/2026 9:18 AM";

  @api row3Asset = "HNW Client Onboarding Email";
  @api row3ContentType = "Email";
  @api row3ActivityType = "Email Click";
  @api row3Campaign = "High Net Worth Prospect Outreach";
  @api row3Date = "03/12/2026 4:45 PM";

  @api row4Asset = "Retirement Calculator Landing Page";
  @api row4ContentType = "Landing Page";
  @api row4ActivityType = "Form Submit";
  @api row4Campaign = "Retirement Planning Drip Campaign";
  @api row4Date = "03/10/2026 11:30 AM";

  @api row5Asset = "Q3 Webinar Registration";
  @api row5ContentType = "Webinar";
  @api row5ActivityType = "Registration";
  @api row5Campaign = "Q3 Wealth Management Webinar";
  @api row5Date = "03/08/2026 1:55 PM";

  // ── Internal state (primitives → reactive without @track) ──
  _chartScriptRequested = false;
  _chartsReady = false;
  chartLoadError = false;

  selectedDateRange = "all";
  selectedCampaign = "all";
  selectedContentType = "all";

  /** Section visibility — bound to lightning-input toggles; drives if:true templates. */
  showCampaigns = true;
  showAssets = true;
  showTable = true;

  campaignChart = null;
  assetChart = null;

  // Collapsible chart sections
  campaignChartCollapsed = false;
  assetChartCollapsed = false;

  // Sort state
  sortField = "date";
  sortDirection = "desc";

  // ── Dropdown options ───────────────────────────────────────
  get dateRangeOptions() {
    return DATE_RANGE_OPTIONS;
  }

  get campaignOptions() {
    const campaigns = this._allRows
      .map((r) => r.campaign)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    const opts = [{ label: "All Campaigns", value: "all" }];
    campaigns.forEach((c) => opts.push({ label: c, value: c }));
    return opts;
  }

  get contentTypeOptions() {
    const types = this._allRows
      .map((r) => r.contentType)
      .filter((v, i, a) => v && a.indexOf(v) === i);
    const opts = [{ label: "All Types", value: "all" }];
    types.forEach((t) => opts.push({ label: t, value: t }));
    return opts;
  }

  // ── Normalised master data array ───────────────────────────
  get _allRows() {
    const rows = [];
    for (let i = 1; i <= 5; i++) {
      const asset = this[`row${i}Asset`];
      if (asset) {
        rows.push({
          id: i,
          asset,
          contentType: this[`row${i}ContentType`] || "",
          activityType: this[`row${i}ActivityType`] || "",
          campaign: this[`row${i}Campaign`] || "",
          date: this[`row${i}Date`] || ""
        });
      }
    }
    return rows;
  }

  // ── Filtered + sorted rows for the table ───────────────────
  get filteredRows() {
    let rows = [...this._allRows];

    // Date range filter
    if (this.selectedDateRange !== "all") {
      const days = parseInt(this.selectedDateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      rows = rows.filter((r) => {
        const d = this._parseDate(r.date);
        return d && d >= cutoff;
      });
    }

    // Campaign filter
    if (this.selectedCampaign !== "all") {
      rows = rows.filter((r) => r.campaign === this.selectedCampaign);
    }

    // Content-type filter
    if (this.selectedContentType !== "all") {
      rows = rows.filter((r) => r.contentType === this.selectedContentType);
    }

    // Sort
    const dir = this.sortDirection === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      let va = a[this.sortField] || "";
      let vb = b[this.sortField] || "";
      if (this.sortField === "date") {
        va = this._parseDate(va) || new Date(0);
        vb = this._parseDate(vb) || new Date(0);
        return (va - vb) * dir;
      }
      return va.localeCompare(vb) * dir;
    });

    return rows;
  }

  get hasRows() {
    return this.filteredRows.length > 0;
  }

  get noRows() {
    return this.filteredRows.length === 0;
  }

  // ── Sort indicator getters ─────────────────────────────────
  get sortAssetClass() {
    return this.sortField === "asset" ? "sorted" : "";
  }
  get sortContentTypeClass() {
    return this.sortField === "contentType" ? "sorted" : "";
  }
  get sortActivityTypeClass() {
    return this.sortField === "activityType" ? "sorted" : "";
  }
  get sortCampaignClass() {
    return this.sortField === "campaign" ? "sorted" : "";
  }
  get sortDateClass() {
    return this.sortField === "date" ? "sorted" : "";
  }

  get sortAssetIcon() {
    return this.sortField === "asset"
      ? this.sortDirection === "asc"
        ? "↑"
        : "↓"
      : "↕";
  }
  get sortContentTypeIcon() {
    return this.sortField === "contentType"
      ? this.sortDirection === "asc"
        ? "↑"
        : "↓"
      : "↕";
  }
  get sortActivityTypeIcon() {
    return this.sortField === "activityType"
      ? this.sortDirection === "asc"
        ? "↑"
        : "↓"
      : "↕";
  }
  get sortCampaignIcon() {
    return this.sortField === "campaign"
      ? this.sortDirection === "asc"
        ? "↑"
        : "↓"
      : "↕";
  }
  get sortDateIcon() {
    return this.sortField === "date"
      ? this.sortDirection === "asc"
        ? "↑"
        : "↓"
      : "↕";
  }

  // ── Collapse toggles ──────────────────────────────────────
  get campaignChartSectionClass() {
    return this.campaignChartCollapsed ? "chart-body hidden" : "chart-body";
  }
  get assetChartSectionClass() {
    return this.assetChartCollapsed ? "chart-body hidden" : "chart-body";
  }

  // ── Toggle icon getters (LWC does not allow ternaries in templates) ──
  get campaignChartToggleIcon() {
    return this.campaignChartCollapsed
      ? "utility:chevronright"
      : "utility:chevrondown";
  }
  get assetChartToggleIcon() {
    return this.assetChartCollapsed
      ? "utility:chevronright"
      : "utility:chevrondown";
  }

  // ── Lifecycle ──────────────────────────────────────────────
  /** After any reactive update, sync Chart.js with current template + filtered data. */
  renderedCallback() {
    this._syncTableLinkCssVariable();
    if (!this._chartScriptRequested) {
      this._chartScriptRequested = true;
      loadScript(this, ChartJs)
        .then(() => {
          this._chartsReady = true;
          this._renderAllCharts();
        })
        .catch((error) => {
          this.chartLoadError = true;
          console.error("Chart.js load error:", error);
        });
      return;
    }
    if (this._chartsReady) {
      this._renderAllCharts();
    }
  }

  // ── Event handlers (assign reactive primitives; renderedCallback redraws charts) ──
  handleDateRangeChange(event) {
    this.selectedDateRange = event.detail.value;
  }

  handleCampaignChange(event) {
    this.selectedCampaign = event.detail.value;
  }

  handleContentTypeChange(event) {
    this.selectedContentType = event.detail.value;
  }

  handleSort(event) {
    const field = event.currentTarget.dataset.field;
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "asc";
    }
  }

  handleToggleCampaigns(event) {
    this.showCampaigns = event.detail.checked;
  }

  handleToggleAssets(event) {
    this.showAssets = event.detail.checked;
  }

  handleToggleTable(event) {
    this.showTable = event.detail.checked;
  }

  toggleCampaignChart() {
    this.campaignChartCollapsed = !this.campaignChartCollapsed;
  }

  toggleAssetChart() {
    this.assetChartCollapsed = !this.assetChartCollapsed;
  }

  // ── Chart rendering ────────────────────────────────────────
  _renderAllCharts() {
    this._renderCampaignChart();
    this._renderAssetChart();
  }

  _renderCampaignChart() {
    if (this.campaignChartCollapsed) {
      return;
    }
    const canvas = this.template.querySelector(
      ".campaign-chart-container canvas"
    );
    if (!canvas) {
      if (this.campaignChart) {
        this.campaignChart.destroy();
        this.campaignChart = null;
      }
      return;
    }

    if (this.campaignChart) {
      this.campaignChart.destroy();
    }

    // Bar chart uses @api campaign N name/value only (LWB / Experience Generator).
    // Table filters apply to the data table, not these mock chart bars.
    const labels = [];
    const data = [];
    for (let i = 1; i <= 3; i++) {
      const name = String(this[`campaign${i}Name`] || "").trim();
      if (!name) {
        continue;
      }
      const val = parseInt(this[`campaign${i}Value`], 10) || 0;
      labels.push(name);
      data.push(this._barDisplayCount(val));
    }
    if (labels.length === 0) {
      return;
    }
    const yAxisMinWidth = this._yAxisMinWidthForLabels(labels);
    const valueLabelPaddingRight = 44;

    const ctx = canvas.getContext("2d");
    this.campaignChart = new window.Chart(ctx, {
      type: "bar",
      plugins: [createBarEndValuePlugin("ehBarEndValuesCampaign")],
      data: {
        labels,
        datasets: [
          {
            label: "Activities",
            data,
            backgroundColor: SF_CAMPAIGN_BAR,
            borderRadius: 6,
            barThickness: 28,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 8,
            right: valueLabelPaddingRight,
            top: 8,
            bottom: 8
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13, weight: "600" },
            bodyFont: { size: 12 },
            displayColors: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Activities",
              font: { size: 11, weight: "600" },
              padding: { top: 8 }
            },
            beginAtZero: true,
            suggestedMax: 10,
            ticks: {
              stepSize: 1,
              font: { size: 11 },
              padding: 6
            },
            grid: {
              display: true,
              drawBorder: false,
              color: "rgba(0, 0, 0, 0.06)"
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              autoSkip: false,
              font: { size: 12, weight: "500" },
              padding: 8,
              color: "#3e3e3c",
              mirror: false
            },
            afterFit: (scale) => {
              scale.width = Math.max(scale.width, yAxisMinWidth);
            }
          }
        }
      }
    });
  }

  _renderAssetChart() {
    if (this.assetChartCollapsed) {
      return;
    }
    const canvas = this.template.querySelector(".asset-chart-container canvas");
    if (!canvas) {
      if (this.assetChart) {
        this.assetChart.destroy();
        this.assetChart = null;
      }
      return;
    }

    if (this.assetChart) {
      this.assetChart.destroy();
    }

    const labels = [];
    const data = [];
    for (let i = 1; i <= 4; i++) {
      const name = String(this[`asset${i}Name`] || "").trim();
      if (!name) {
        continue;
      }
      const val = parseInt(this[`asset${i}Value`], 10) || 0;
      labels.push(name);
      data.push(this._barDisplayCount(val));
    }
    if (labels.length === 0) {
      return;
    }
    const yAxisMinWidth = this._yAxisMinWidthForLabels(labels);
    const valueLabelPaddingRight = 44;

    const ctx = canvas.getContext("2d");
    this.assetChart = new window.Chart(ctx, {
      type: "bar",
      plugins: [createBarEndValuePlugin("ehBarEndValuesAsset")],
      data: {
        labels,
        datasets: [
          {
            label: "Activities",
            data,
            backgroundColor: SF_ASSET_BAR,
            borderRadius: 6,
            barThickness: 28,
            borderSkipped: false
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 8,
            right: valueLabelPaddingRight,
            top: 8,
            bottom: 8
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: { size: 13, weight: "600" },
            bodyFont: { size: 12 },
            displayColors: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Activities",
              font: { size: 11, weight: "600" },
              padding: { top: 8 }
            },
            beginAtZero: true,
            suggestedMax: 10,
            ticks: {
              stepSize: 1,
              font: { size: 11 },
              padding: 6
            },
            grid: {
              display: true,
              drawBorder: false,
              color: "rgba(0, 0, 0, 0.06)"
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              autoSkip: false,
              font: { size: 12, weight: "500" },
              padding: 8,
              color: "#3e3e3c",
              mirror: false
            },
            afterFit: (scale) => {
              scale.width = Math.max(scale.width, yAxisMinWidth);
            }
          }
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  /** Single-digit mock counts (0–9) for bar lengths and end labels; caps legacy LWB / generator values. */
  _barDisplayCount(raw) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) {
      return 0;
    }
    return Math.min(n, 9);
  }

  /** Apply @api tableLinkColor as --eh-table-link-color (avoids style={...} in HTML for IDE/CSS parsers). */
  _syncTableLinkCssVariable() {
    const wrap = this.template.querySelector(".eh-table-wrap");
    if (!wrap) {
      return;
    }
    const c = this.tableLinkColor || "#0070d2";
    wrap.style.setProperty("--eh-table-link-color", c);
  }

  /**
   * Minimum y-axis width so category labels are not clipped (horizontal bars, indexAxis "y").
   * Uses a generous char-width estimate; afterFit expands the scale when Chart's default is too narrow.
   */
  _yAxisMinWidthForLabels(labels) {
    if (!labels || !labels.length) {
      return 160;
    }
    const longest = labels.reduce(
      (max, s) => Math.max(max, String(s).length),
      0
    );
    return Math.max(longest * 8 + 48, 160);
  }

  _parseDate(str) {
    if (!str) return null;
    const s = String(str).trim();

    // mm/dd/yyyy h:mm AM|PM (preferred mock format)
    const us12 =
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s);
    if (us12) {
      const month = parseInt(us12[1], 10) - 1;
      const day = parseInt(us12[2], 10);
      const year = parseInt(us12[3], 10);
      let hour = parseInt(us12[4], 10);
      const minute = parseInt(us12[5], 10);
      const ap = us12[6].toUpperCase();
      if (ap === "PM" && hour !== 12) {
        hour += 12;
      }
      if (ap === "AM" && hour === 12) {
        hour = 0;
      }
      const d = new Date(year, month, day, hour, minute, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    // Legacy: yyyy/m/d HH:mm (24-hour)
    const legacy = /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/.exec(s);
    if (legacy) {
      const year = parseInt(legacy[1], 10);
      const month = parseInt(legacy[2], 10) - 1;
      const day = parseInt(legacy[3], 10);
      const hour = parseInt(legacy[4], 10);
      const minute = parseInt(legacy[5], 10);
      const d = new Date(year, month, day, hour, minute, 0, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    const normalised = s.replace(/\//g, "-");
    const d = new Date(normalised);
    return isNaN(d.getTime()) ? null : d;
  }

  _parseCommaSeparated(str) {
    if (!str) return [];
    return str
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
  }
}
