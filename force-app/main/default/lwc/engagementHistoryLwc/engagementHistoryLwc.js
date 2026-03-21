// engagementHistoryLwc.js — v2.1.0 chart-polish
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
  @api row1Date = "2026/3/15 14:22";

  @api row2Asset = "Investment Portfolio Guide";
  @api row2ContentType = "Whitepaper";
  @api row2ActivityType = "Download";
  @api row2Campaign = "High Net Worth Prospect Outreach";
  @api row2Date = "2026/3/14 09:18";

  @api row3Asset = "HNW Client Onboarding Email";
  @api row3ContentType = "Email";
  @api row3ActivityType = "Email Click";
  @api row3Campaign = "High Net Worth Prospect Outreach";
  @api row3Date = "2026/3/12 16:45";

  @api row4Asset = "Retirement Calculator Landing Page";
  @api row4ContentType = "Landing Page";
  @api row4ActivityType = "Form Submit";
  @api row4Campaign = "Retirement Planning Drip Campaign";
  @api row4Date = "2026/3/10 11:30";

  @api row5Asset = "Q3 Webinar Registration";
  @api row5ContentType = "Webinar";
  @api row5ActivityType = "Registration";
  @api row5Campaign = "Q3 Wealth Management Webinar";
  @api row5Date = "2026/3/08 13:55";

  // ── Internal state ─────────────────────────────────────────
  _chartScriptRequested = false;
  _chartsReady = false;
  chartLoadError = false;

  selectedDateRange = "all";
  selectedCampaign = "all";
  selectedContentType = "all";

  // Section visibility (internal state)
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

  get tableLinkScopeStyle() {
    const c = this.tableLinkColor || "#0070d2";
    return `--eh-table-link-color: ${c}`;
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
  renderedCallback() {
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

  // ── Event handlers ─────────────────────────────────────────
  handleDateRangeChange(event) {
    this.selectedDateRange = event.detail.value;
    this._renderAllCharts();
  }

  handleCampaignChange(event) {
    this.selectedCampaign = event.detail.value;
    this._renderAllCharts();
  }

  handleContentTypeChange(event) {
    this.selectedContentType = event.detail.value;
    this._renderAllCharts();
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
    if (this.showCampaigns && this._chartsReady) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => this._renderCampaignChart(), 50);
    }
  }

  handleToggleAssets(event) {
    this.showAssets = event.detail.checked;
    if (this.showAssets && this._chartsReady) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => this._renderAssetChart(), 50);
    }
  }

  handleToggleTable(event) {
    this.showTable = event.detail.checked;
  }

  toggleCampaignChart() {
    this.campaignChartCollapsed = !this.campaignChartCollapsed;
    if (!this.campaignChartCollapsed) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => this._renderCampaignChart(), 50);
    }
  }

  toggleAssetChart() {
    this.assetChartCollapsed = !this.assetChartCollapsed;
    if (!this.assetChartCollapsed) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => this._renderAssetChart(), 50);
    }
  }

  // ── Chart rendering ────────────────────────────────────────
  _renderAllCharts() {
    this._renderCampaignChart();
    this._renderAssetChart();
  }

  _renderCampaignChart() {
    if (this.campaignChartCollapsed) return;
    const canvas = this.template.querySelector(
      ".campaign-chart-container canvas"
    );
    if (!canvas) return;

    if (this.campaignChart) {
      this.campaignChart.destroy();
    }

    // Aggregate campaign counts from filtered rows
    const rows = this.filteredRows;
    const campMap = {};
    rows.forEach((r) => {
      if (r.campaign) {
        campMap[r.campaign] = (campMap[r.campaign] || 0) + 1;
      }
    });

    // Fallback to @api props when no row data matches
    if (Object.keys(campMap).length === 0) {
      for (let i = 1; i <= 3; i++) {
        const name = this[`campaign${i}Name`];
        const val = parseInt(this[`campaign${i}Value`], 10) || 0;
        if (name) campMap[name] = val;
      }
    }

    const labels = Object.keys(campMap);
    const data = labels.map((l) => campMap[l]);
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
    if (this.assetChartCollapsed) return;
    const canvas = this.template.querySelector(".asset-chart-container canvas");
    if (!canvas) return;

    if (this.assetChart) {
      this.assetChart.destroy();
    }

    // Aggregate asset counts from filtered rows
    const rows = this.filteredRows;
    const assetMap = {};
    rows.forEach((r) => {
      if (r.asset) {
        assetMap[r.asset] = (assetMap[r.asset] || 0) + 1;
      }
    });

    // Fallback to @api props when no row data matches
    if (Object.keys(assetMap).length === 0) {
      for (let i = 1; i <= 4; i++) {
        const name = this[`asset${i}Name`];
        const val = parseInt(this[`asset${i}Value`], 10) || 0;
        if (name) assetMap[name] = val;
      }
    }

    const labels = Object.keys(assetMap);
    const data = labels.map((l) => assetMap[l]);
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
    // Handle "YYYY/M/DD HH:mm" and standard formats
    const normalised = str.replace(/\//g, "-");
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
