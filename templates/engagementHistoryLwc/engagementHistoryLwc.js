// engagementHistoryLwc.js — v2.0.0
import { LightningElement, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import ChartJs from "@salesforce/resourceUrl/ChartJs";

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
  { label: "Last 12 Months", value: "365" }
];

export default class EngagementHistoryLwc extends LightningElement {
  // ── Configurable properties ────────────────────────────────
  @api cardTitle = "{{{cardTitle}}}";

  @api accentColor = "{{{accentColor}}}";
  @api barChartColor = "{{{barChartColor}}}";
  @api assetBarColor = "{{{assetBarColor}}}";
  @api tableLinkColor = "{{{tableLinkColor}}}";

  // Campaign bar data (design-time values injected by generator)
  @api campaign1Name = "{{{campaign1Name}}}";
  @api campaign1Value = "{{{campaign1Value}}}";
  @api campaign2Name = "{{{campaign2Name}}}";
  @api campaign2Value = "{{{campaign2Value}}}";
  @api campaign3Name = "{{{campaign3Name}}}";
  @api campaign3Value = "{{{campaign3Value}}}";

  // Asset bar data
  @api asset1Name = "{{{asset1Name}}}";
  @api asset1Value = "{{{asset1Value}}}";
  @api asset2Name = "{{{asset2Name}}}";
  @api asset2Value = "{{{asset2Value}}}";
  @api asset3Name = "{{{asset3Name}}}";
  @api asset3Value = "{{{asset3Value}}}";
  @api asset4Name = "{{{asset4Name}}}";
  @api asset4Value = "{{{asset4Value}}}";

  // Table row data
  @api row1Asset = "{{{row1Asset}}}";
  @api row1ContentType = "{{{row1ContentType}}}";
  @api row1ActivityType = "{{{row1ActivityType}}}";
  @api row1Campaign = "{{{row1Campaign}}}";
  @api row1Date = "{{{row1Date}}}";

  @api row2Asset = "{{{row2Asset}}}";
  @api row2ContentType = "{{{row2ContentType}}}";
  @api row2ActivityType = "{{{row2ActivityType}}}";
  @api row2Campaign = "{{{row2Campaign}}}";
  @api row2Date = "{{{row2Date}}}";

  @api row3Asset = "{{{row3Asset}}}";
  @api row3ContentType = "{{{row3ContentType}}}";
  @api row3ActivityType = "{{{row3ActivityType}}}";
  @api row3Campaign = "{{{row3Campaign}}}";
  @api row3Date = "{{{row3Date}}}";

  @api row4Asset = "{{{row4Asset}}}";
  @api row4ContentType = "{{{row4ContentType}}}";
  @api row4ActivityType = "{{{row4ActivityType}}}";
  @api row4Campaign = "{{{row4Campaign}}}";
  @api row4Date = "{{{row4Date}}}";

  @api row5Asset = "{{{row5Asset}}}";
  @api row5ContentType = "{{{row5ContentType}}}";
  @api row5ActivityType = "{{{row5ActivityType}}}";
  @api row5Campaign = "{{{row5Campaign}}}";
  @api row5Date = "{{{row5Date}}}";

  // Line chart configuration
  @api lineChartTrend = "{{{lineChartTrend}}}";
  @api lineChartColor = "{{{lineChartColor}}}";

  // ── Internal state ─────────────────────────────────────────
  _chartScriptRequested = false;
  _chartsReady = false;
  chartLoadError = false;

  selectedDateRange = "all";
  selectedCampaign = "all";
  selectedContentType = "all";

  // Internal tracked properties for line chart
  _currentTrend = "upward";
  _currentLineColor = "#0070d2";

  lineChart = null;
  campaignChart = null;
  assetChart = null;

  // Collapsible chart sections
  lineChartCollapsed = false;
  campaignChartCollapsed = false;
  assetChartCollapsed = false;

  // Sort state
  sortField = "date";
  sortDirection = "desc";

  // ── Dropdown options ───────────────────────────────────────
  get dateRangeOptions() {
    return DATE_RANGE_OPTIONS;
  }

  get trendOptions() {
    return [
      { label: "Trending Upward", value: "upward" },
      { label: "Trending Downward", value: "downward" }
    ];
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

  get colorPreviewStyle() {
    return `background-color: ${this._currentLineColor}`;
  }

  get currentTrend() {
    return this._currentTrend || this.lineChartTrend || "upward";
  }

  get currentLineColor() {
    return this._currentLineColor || this.lineChartColor || "#0070d2";
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
  get lineChartSectionClass() {
    return this.lineChartCollapsed ? "chart-body hidden" : "chart-body";
  }
  get campaignChartSectionClass() {
    return this.campaignChartCollapsed ? "chart-body hidden" : "chart-body";
  }
  get assetChartSectionClass() {
    return this.assetChartCollapsed ? "chart-body hidden" : "chart-body";
  }

  // ── Toggle icon getters (LWC does not allow ternaries in templates) ──
  get lineChartToggleIcon() {
    return this.lineChartCollapsed
      ? "utility:chevronright"
      : "utility:chevrondown";
  }
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
  connectedCallback() {
    // Initialize internal properties from @api properties
    this._currentTrend = this.lineChartTrend || "upward";
    this._currentLineColor = this.lineChartColor || "#0070d2";
  }

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

  toggleLineChart() {
    this.lineChartCollapsed = !this.lineChartCollapsed;
    if (!this.lineChartCollapsed) {
      // eslint-disable-next-line @lwc/lwc/no-async-operation
      setTimeout(() => this._renderLineChart(), 50);
    }
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
    this._renderLineChart();
    this._renderCampaignChart();
    this._renderAssetChart();
  }

  _renderLineChart() {
    if (this.lineChartCollapsed) return;
    const canvas = this.template.querySelector(".line-chart-container canvas");
    if (!canvas) return;

    if (this.lineChart) {
      this.lineChart.destroy();
    }

    // Predefined trend data
    const labels = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    const trendData = {
      upward: [12, 28, 45, 68, 95, 135, 188],
      downward: [188, 152, 118, 85, 58, 32, 15]
    };
    const dataValues = trendData[this.currentTrend] || trendData.upward;

    // Convert hex color to rgba for gradient
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const ctx = canvas.getContext("2d");

    // Create gradient for area fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, hexToRgba(this.currentLineColor, 0.3));
    gradient.addColorStop(1, hexToRgba(this.currentLineColor, 0.01));

    this.lineChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Engagement",
            data: dataValues,
            borderColor: this.currentLineColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#ffffff",
            pointHoverBorderColor: this.currentLineColor,
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 8,
            right: 8,
            top: 20,
            bottom: 8
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: 14,
            titleFont: { size: 14, weight: "600" },
            bodyFont: { size: 13 },
            displayColors: false,
            borderColor: this.currentLineColor,
            borderWidth: 2,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return "Engagement: " + context.parsed.y;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: { size: 11, weight: "500" },
              padding: 10,
              color: "#6b7280"
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: false,
              color: "rgba(0, 0, 0, 0.03)",
              lineWidth: 1
            },
            ticks: {
              font: { size: 11, weight: "500" },
              padding: 12,
              color: "#6b7280",
              callback: function (value) {
                return value;
              }
            }
          }
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        animation: {
          duration: 750,
          easing: "easeInOutQuart"
        }
      }
    });
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

    const ctx = canvas.getContext("2d");
    this.campaignChart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Activities",
            data,
            backgroundColor: this.barChartColor || "#0070d2",
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
            left: 0,
            right: 20,
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
            ticks: {
              stepSize: 5,
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
              padding: 2,
              color: "#3e3e3c"
            },
            afterFit: (scale) => {
              // Ultra-compact label width for extremely tight bar alignment
              const longestLabel = labels.reduce(
                (max, label) => Math.max(max, String(label).length),
                0
              );
              scale.width = Math.min(Math.max(longestLabel * 5 + 4, 70), 180);
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

    // Multi-color bars for assets
    const palette = [
      this.barChartColor || "#0070d2",
      this.assetBarColor || "#7b68ee",
      "#16a34a",
      "#ea580c"
    ];
    const bgColors = data.map((_, idx) => palette[idx % palette.length]);

    const ctx = canvas.getContext("2d");
    this.assetChart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Activities",
            data,
            backgroundColor: bgColors,
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
            left: 0,
            right: 20,
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
            ticks: {
              stepSize: 3,
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
              padding: 2,
              color: "#3e3e3c"
            },
            afterFit: (scale) => {
              // Ultra-compact label width for extremely tight bar alignment
              const longestLabel = labels.reduce(
                (max, label) => Math.max(max, String(label).length),
                0
              );
              scale.width = Math.min(Math.max(longestLabel * 5 + 4, 70), 180);
            }
          }
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  /** Room for long horizontal-bar category labels (Chart.js y-axis when indexAxis is 'y'). */
  _ehHorizontalBarLabelAxisWidth(labels) {
    if (!labels || !labels.length) {
      return 140;
    }
    const longest = labels.reduce(
      (max, s) => Math.max(max, String(s).length),
      0
    );
    return Math.min(Math.max(longest * 7 + 28, 120), 340);
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

  // ── Line Chart Configuration Handlers ──────────────────────
  handleTrendChange(event) {
    this._currentTrend = event.detail.value;
    if (this._chartsReady) {
      this._renderLineChart();
    }
  }

  handleLineColorChange(event) {
    this._currentLineColor = event.target.value;
    if (this._chartsReady) {
      this._renderLineChart();
    }
  }
}
