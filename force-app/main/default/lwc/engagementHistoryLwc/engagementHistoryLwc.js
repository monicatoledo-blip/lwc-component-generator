// engagementHistoryLwc.js — v2.0.0 fix-engagement-history
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
  @api cardTitle = "Contact Engagement History";

  @api accentColor = "#0070d2";
  @api lineChartColor = "#0070d2";
  @api barChartColor = "#0070d2";
  @api assetBarColor = "#7b68ee";

  // Campaign bar data (design-time values injected by generator)
  @api campaign1Name = "";
  @api campaign1Value = "0";
  @api campaign2Name = "";
  @api campaign2Value = "0";
  @api campaign3Name = "";
  @api campaign3Value = "0";

  // Asset bar data
  @api asset1Name = "";
  @api asset1Value = "0";
  @api asset2Name = "";
  @api asset2Value = "0";
  @api asset3Name = "";
  @api asset3Value = "0";
  @api asset4Name = "";
  @api asset4Value = "0";

  // Table row data
  @api row1Asset = "";
  @api row1ContentType = "";
  @api row1ActivityType = "";
  @api row1Campaign = "";
  @api row1Date = "";

  @api row2Asset = "";
  @api row2ContentType = "";
  @api row2ActivityType = "";
  @api row2Campaign = "";
  @api row2Date = "";

  @api row3Asset = "";
  @api row3ContentType = "";
  @api row3ActivityType = "";
  @api row3Campaign = "";
  @api row3Date = "";

  @api row4Asset = "";
  @api row4ContentType = "";
  @api row4ActivityType = "";
  @api row4Campaign = "";
  @api row4Date = "";

  @api row5Asset = "";
  @api row5ContentType = "";
  @api row5ActivityType = "";
  @api row5Campaign = "";
  @api row5Date = "";

  // ── Internal state ─────────────────────────────────────────
  chartJsLoaded = false;
  chartLoadError = false;

  selectedDateRange = "all";
  selectedCampaign = "all";
  selectedContentType = "all";

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

  // ── Lifecycle ──────────────────────────────────────────────
  renderedCallback() {
    if (this.chartJsLoaded) {
      return;
    }
    this.chartJsLoaded = true;

    loadScript(this, ChartJs)
      .then(() => {
        this._renderAllCharts();
      })
      .catch((error) => {
        this.chartLoadError = true;
        console.error("Chart.js load error:", error);
      });
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

    // Build time-series data from filtered rows
    const rows = this.filteredRows;
    const dateMap = {};
    rows.forEach((r) => {
      const d = this._parseDate(r.date);
      if (d) {
        const key = d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short"
        });
        dateMap[key] = (dateMap[key] || 0) + 1;
      }
    });

    const sortedKeys = Object.keys(dateMap).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    // Cumulative total
    let cumulative = 0;
    const cumulativeData = sortedKeys.map((k) => {
      cumulative += dateMap[k];
      return cumulative;
    });

    const ctx = canvas.getContext("2d");
    this.lineChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: sortedKeys,
        datasets: [
          {
            label: "Total Activities",
            data: cumulativeData,
            borderColor: this.lineChartColor || "#0070d2",
            backgroundColor: "rgba(0,112,210,0.08)",
            fill: true,
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: this.lineChartColor || "#0070d2"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: "Activity Date" },
            grid: { display: false }
          },
          y: {
            title: { display: true, text: "Total Activities" },
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
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
            label: "Total Activities",
            data,
            backgroundColor: this.barChartColor || "#0070d2",
            borderRadius: 4,
            barThickness: 22
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: "Total Activities" },
            beginAtZero: true,
            ticks: { stepSize: 1 }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  _renderAssetChart() {
    if (this.assetChartCollapsed) return;
    const canvas = this.template.querySelector(
      ".asset-chart-container canvas"
    );
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
      "#2e8b57",
      "#e6812f"
    ];
    const bgColors = data.map((_, idx) => palette[idx % palette.length]);

    const ctx = canvas.getContext("2d");
    this.assetChart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Total Activities",
            data,
            backgroundColor: bgColors,
            borderRadius: 4,
            barThickness: 22
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: { display: true, text: "Total Activities" },
            beginAtZero: true,
            ticks: { stepSize: 1 }
          },
          y: {
            grid: { display: false }
          }
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  _parseDate(str) {
    if (!str) return null;
    // Handle "YYYY/M/DD HH:mm" and standard formats
    const normalised = str.replace(/\//g, "-");
    const d = new Date(normalised);
    return isNaN(d.getTime()) ? null : d;
  }
}
