// engagementHistoryLwc.js — v3.0.0 pure-CSS charts, zero external deps
import { LightningElement, api } from "lwc";

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

  // Campaign bar data
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
  selectedDateRange = "all";
  selectedCampaign = "all";
  selectedContentType = "all";

  lineChartCollapsed = false;
  campaignChartCollapsed = false;
  assetChartCollapsed = false;

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

    if (this.selectedDateRange !== "all") {
      const days = parseInt(this.selectedDateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      rows = rows.filter((r) => {
        const d = this._parseDate(r.date);
        return d && d >= cutoff;
      });
    }

    if (this.selectedCampaign !== "all") {
      rows = rows.filter((r) => r.campaign === this.selectedCampaign);
    }

    if (this.selectedContentType !== "all") {
      rows = rows.filter((r) => r.contentType === this.selectedContentType);
    }

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

  // ── Pure-CSS chart data (Engagement Over Time — line dots) ─
  get lineChartData() {
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

    const sortedKeys = Object.keys(dateMap).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    let cumulative = 0;
    const points = sortedKeys.map((k) => {
      cumulative += dateMap[k];
      return { label: k, value: cumulative };
    });

    if (points.length === 0) return [];

    const maxVal = Math.max(...points.map((p) => p.value), 1);
    return points.map((p) => ({
      label: p.label,
      value: p.value,
      heightPct: Math.round((p.value / maxVal) * 100),
      barStyle: `height: ${Math.round((p.value / maxVal) * 100)}%`,
      dotStyle: `bottom: ${Math.round((p.value / maxVal) * 100)}%`
    }));
  }

  get lineChartMaxValue() {
    const pts = this.lineChartData;
    if (pts.length === 0) return 1;
    return Math.max(...pts.map((p) => p.value), 1);
  }

  get hasLineData() {
    return this.lineChartData.length > 0;
  }

  get noLineData() {
    return this.lineChartData.length === 0;
  }

  // ── Pure-CSS chart data (Campaign horizontal bars) ─────────
  get campaignChartData() {
    const rows = this.filteredRows;
    const campMap = {};
    rows.forEach((r) => {
      if (r.campaign) {
        campMap[r.campaign] = (campMap[r.campaign] || 0) + 1;
      }
    });

    if (Object.keys(campMap).length === 0) {
      for (let i = 1; i <= 3; i++) {
        const name = this[`campaign${i}Name`];
        const val = parseInt(this[`campaign${i}Value`], 10) || 0;
        if (name) campMap[name] = val;
      }
    }

    const maxVal = Math.max(...Object.values(campMap), 1);
    const color = this.barChartColor || "#0070d2";
    return Object.keys(campMap).map((name) => ({
      label: name,
      value: campMap[name],
      widthPct: Math.round((campMap[name] / maxVal) * 100),
      color,
      barStyle: `width: ${Math.round((campMap[name] / maxVal) * 100)}%; background-color: ${color}`
    }));
  }

  get hasCampaignData() {
    return this.campaignChartData.length > 0;
  }

  get noCampaignData() {
    return this.campaignChartData.length === 0;
  }

  // ── Pure-CSS chart data (Asset horizontal bars) ────────────
  get assetChartData() {
    const rows = this.filteredRows;
    const assetMap = {};
    rows.forEach((r) => {
      if (r.asset) {
        assetMap[r.asset] = (assetMap[r.asset] || 0) + 1;
      }
    });

    if (Object.keys(assetMap).length === 0) {
      for (let i = 1; i <= 4; i++) {
        const name = this[`asset${i}Name`];
        const val = parseInt(this[`asset${i}Value`], 10) || 0;
        if (name) assetMap[name] = val;
      }
    }

    const palette = [
      this.barChartColor || "#0070d2",
      this.assetBarColor || "#7b68ee",
      "#2e8b57",
      "#e6812f"
    ];

    const maxVal = Math.max(...Object.values(assetMap), 1);
    let idx = 0;
    return Object.keys(assetMap).map((name) => {
      const color = palette[idx % palette.length];
      idx++;
      return {
        label: name,
        value: assetMap[name],
        widthPct: Math.round((assetMap[name] / maxVal) * 100),
        color,
        barStyle: `width: ${Math.round((assetMap[name] / maxVal) * 100)}%; background-color: ${color}`
      };
    });
  }

  get hasAssetData() {
    return this.assetChartData.length > 0;
  }

  get noAssetData() {
    return this.assetChartData.length === 0;
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
    return this._sortIcon("asset");
  }
  get sortContentTypeIcon() {
    return this._sortIcon("contentType");
  }
  get sortActivityTypeIcon() {
    return this._sortIcon("activityType");
  }
  get sortCampaignIcon() {
    return this._sortIcon("campaign");
  }
  get sortDateIcon() {
    return this._sortIcon("date");
  }

  _sortIcon(field) {
    if (this.sortField !== field) return "↕";
    return this.sortDirection === "asc" ? "↑" : "↓";
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

  // ── Event handlers ─────────────────────────────────────────
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

  toggleLineChart() {
    this.lineChartCollapsed = !this.lineChartCollapsed;
  }

  toggleCampaignChart() {
    this.campaignChartCollapsed = !this.campaignChartCollapsed;
  }

  toggleAssetChart() {
    this.assetChartCollapsed = !this.assetChartCollapsed;
  }

  // ── Helpers ────────────────────────────────────────────────
  _parseDate(str) {
    if (!str) return null;
    const normalised = str.replace(/\//g, "-");
    const d = new Date(normalised);
    return isNaN(d.getTime()) ? null : d;
  }
}
