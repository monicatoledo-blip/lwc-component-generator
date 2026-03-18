import { LightningElement, api } from "lwc";

export default class AgentforceLeadBriefLwc extends LightningElement {
  // Header
  @api astroIconUrl = "{{{astroIconUrl}}}";
  @api title = "{{{title}}}";
  @api timestampText = "{{{timestampText}}}";

  // Intent Section
  @api intentHeading = "{{{intentHeading}}}";
  @api intentText = "{{{intentText}}}";

  // Context Section
  @api contextHeading = "{{{contextHeading}}}";
  @api contextText = "{{{contextText}}}";

  // Suggested Opener Section
  @api openerHeading = "{{{openerHeading}}}";
  @api openerText = "{{{openerText}}}";

  // Footer Buttons
  @api primaryButtonText = "{{{primaryButtonText}}}";
  @api secondaryButtonText = "{{{secondaryButtonText}}}";

  // Colors
  @api bgColor = "{{{bgColor}}}";
  @api textColor = "{{{textColor}}}";

  get containerStyle() {
    return `background-color: ${this.bgColor}; color: ${this.textColor};`;
  }
}
