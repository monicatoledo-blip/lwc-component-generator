import { LightningElement, api } from "lwc";

export default class NextBestActionsLwc extends LightningElement {
  @api headerTitle = "{{{headerTitle}}}";
  @api headerSubtitle = "{{{headerSubtitle}}}";
  @api headerIcon = "{{{headerIcon}}}";

  @api card1Image = "{{{card1Image}}}";
  @api card1Title = "{{{card1Title}}}";
  @api card1Text = "{{{card1Text}}}";
  @api card1PrimaryBtn = "{{{card1PrimaryBtn}}}";
  @api card1SecondaryBtn = "{{{card1SecondaryBtn}}}";

  @api card2Image = "{{{card2Image}}}";
  @api card2Title = "{{{card2Title}}}";
  @api card2Text = "{{{card2Text}}}";
  @api card2PrimaryBtn = "{{{card2PrimaryBtn}}}";
  @api card2SecondaryBtn = "{{{card2SecondaryBtn}}}";

  // Colors
  @api bgColor = "{{{bgColor}}}";
  @api textColor = "{{{textColor}}}";

  get containerStyle() {
    return `background-color: ${this.bgColor}; color: ${this.textColor};`;
  }
}
