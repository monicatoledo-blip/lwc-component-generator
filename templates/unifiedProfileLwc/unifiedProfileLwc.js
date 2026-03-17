import { LightningElement, api } from "lwc";

export default class UnifiedProfileLwc extends LightningElement {
  // Avatar and Header
  @api avatarUrl = "{{{avatarUrl}}}";
  @api contactName = "{{{contactName}}}";
  @api contactTitle = "{{{contactTitle}}}";

  // Badge
  @api badgeText = "{{{badgeText}}}";
  @api badgeBgColor = "{{{badgeBgColor}}}";
  @api badgeTextColor = "{{{badgeTextColor}}}";

  // Colors
  @api bgColor = "{{{bgColor}}}";
  @api textColor = "{{{textColor}}}";

  // Field 1
  @api field1Icon = "{{{field1Icon}}}";
  @api field1Label = "{{{field1Label}}}";
  @api field1Value = "{{{field1Value}}}";

  // Field 2
  @api field2Icon = "{{{field2Icon}}}";
  @api field2Label = "{{{field2Label}}}";
  @api field2Value = "{{{field2Value}}}";

  // Field 3
  @api field3Icon = "{{{field3Icon}}}";
  @api field3Label = "{{{field3Label}}}";
  @api field3Value = "{{{field3Value}}}";

  // Field 4
  @api field4Icon = "{{{field4Icon}}}";
  @api field4Label = "{{{field4Label}}}";
  @api field4Value = "{{{field4Value}}}";

  // Field 5
  @api field5Icon = "{{{field5Icon}}}";
  @api field5Label = "{{{field5Label}}}";
  @api field5Value = "{{{field5Value}}}";

  // Field 6
  @api field6Icon = "{{{field6Icon}}}";
  @api field6Label = "{{{field6Label}}}";
  @api field6Value = "{{{field6Value}}}";

  // Field 7
  @api field7Icon = "{{{field7Icon}}}";
  @api field7Label = "{{{field7Label}}}";
  @api field7Value = "{{{field7Value}}}";

  // Field 8
  @api field8Icon = "{{{field8Icon}}}";
  @api field8Label = "{{{field8Label}}}";
  @api field8Value = "{{{field8Value}}}";

  // Propensity Slider
  @api sliderPercentage = "{{{sliderPercentage}}}";
  @api sliderBgColor = "{{{sliderBgColor}}}";
  @api sliderFillColor = "{{{sliderFillColor}}}";
  @api sliderKnobColor = "{{{sliderKnobColor}}}";

  // Engagement Ring
  @api ringPercentage = "{{{ringPercentage}}}";
  @api ringBgColor = "{{{ringBgColor}}}";
  @api ringProgressColor = "{{{ringProgressColor}}}";
  @api ringTextColor = "{{{ringTextColor}}}";
  @api ringDashOffset = "{{{ringDashOffset}}}";

  // Engagement Text
  @api engagementTitle = "{{{engagementTitle}}}";
  @api engagementDescription = "{{{engagementDescription}}}";
}
