import { LightningElement, api } from "lwc";

export default class NextBestLeadsLwc extends LightningElement {
  // Header
  @api headerTitle = "{{{headerTitle}}}";
  @api headerSubtitle = "{{{headerSubtitle}}}";

  // Lead 1
  @api lead1Name = "{{{lead1Name}}}";
  @api lead1Role = "{{{lead1Role}}}";
  @api lead1Match = "{{{lead1Match}}}";
  @api lead1Context = "{{{lead1Context}}}";

  // Lead 2
  @api lead2Name = "{{{lead2Name}}}";
  @api lead2Role = "{{{lead2Role}}}";
  @api lead2Match = "{{{lead2Match}}}";
  @api lead2Context = "{{{lead2Context}}}";

  // Lead 3
  @api lead3Name = "{{{lead3Name}}}";
  @api lead3Role = "{{{lead3Role}}}";
  @api lead3Match = "{{{lead3Match}}}";
  @api lead3Context = "{{{lead3Context}}}";

  // Colors
  @api bgColor = "{{{bgColor}}}";
  @api textColor = "{{{textColor}}}";

  get containerStyle() {
    return `background-color: ${this.bgColor}; color: ${this.textColor};`;
  }
}
