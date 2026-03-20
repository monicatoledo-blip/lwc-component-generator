import { LightningElement, api } from "lwc";

export default class EngagementHistoryLwc extends LightningElement {
  // Card Title
  @api cardTitle = "{{{cardTitle}}}";

  // Filter Labels
  @api dateRangeLabel = "{{{dateRangeLabel}}}";
  @api campaignLabel = "{{{campaignLabel}}}";
  @api contentTypeLabel = "{{{contentTypeLabel}}}";

  // Colors
  @api bgColor = "{{{bgColor}}}";
  @api headerBgColor = "{{{headerBgColor}}}";
  @api accentColor = "{{{accentColor}}}";
  @api lineChartColor = "{{{lineChartColor}}}";
  @api barChartColor = "{{{barChartColor}}}";
  @api assetBarColor = "{{{assetBarColor}}}";
  @api tableLinkColor = "{{{tableLinkColor}}}";

  // Campaign Bar Chart Data
  @api campaign1Name = "{{{campaign1Name}}}";
  @api campaign1Value = "{{{campaign1Value}}}";
  @api campaign2Name = "{{{campaign2Name}}}";
  @api campaign2Value = "{{{campaign2Value}}}";
  @api campaign3Name = "{{{campaign3Name}}}";
  @api campaign3Value = "{{{campaign3Value}}}";

  // Asset Bar Chart Data
  @api asset1Name = "{{{asset1Name}}}";
  @api asset1Value = "{{{asset1Value}}}";
  @api asset2Name = "{{{asset2Name}}}";
  @api asset2Value = "{{{asset2Value}}}";
  @api asset3Name = "{{{asset3Name}}}";
  @api asset3Value = "{{{asset3Value}}}";
  @api asset4Name = "{{{asset4Name}}}";
  @api asset4Value = "{{{asset4Value}}}";

  // Table Rows
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
}
