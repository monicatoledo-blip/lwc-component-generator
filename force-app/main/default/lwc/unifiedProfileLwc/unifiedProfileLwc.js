import { LightningElement, api } from 'lwc';

export default class UnifiedProfileLwc extends LightningElement {
    // Avatar and Header
    @api avatarUrl = 'https://i.pravatar.cc/150?img=47';
    @api contactName = 'BATMAN';
    @api contactTitle = 'VP of Finance | BrightPath';

    // Badge
    @api badgeText = 'VERIFIED DECISION MAKER';
    @api badgeBgColor = '#2d7a3e';
    @api badgeTextColor = '#ffffff';

    // Colors
    @api bgColor = '#a94442';

    // Field 1
    @api field1Icon = 'utility:user';
    @api field1Label = 'Customer ID';
    @api field1Value = 'ADP-008291';

    // Field 2
    @api field2Icon = 'utility:email';
    @api field2Label = 'Email';
    @api field2Value = 'rachel.adams@brightpath.com';

    // Field 3
    @api field3Icon = 'utility:phone_portrait';
    @api field3Label = 'Phone';
    @api field3Value = '(315) 545-1254';

    // Field 4
    @api field4Icon = 'utility:location';
    @api field4Label = 'Address';
    @api field4Value = '2259 Green Avenue, Alpharetta, GA 30004';

    // Field 5
    @api field5Icon = 'utility:graph';
    @api field5Label = 'Segment';
    @api field5Value = 'Small Business (RUN) Cross-Sell';

    // Field 6
    @api field6Icon = 'utility:groups';
    @api field6Label = 'Employee Count';
    @api field6Value = '35';

    // Field 7
    @api field7Icon = 'utility:money';
    @api field7Label = 'Lifetime Value';
    @api field7Value = '$11,450';

    // Field 8
    @api field8Icon = 'utility:trending';
    @api field8Label = 'Propensity to Purchase';
    @api field8Value = 'Most Likely';

    // Propensity Slider
    @api sliderPercentage = '85';
    @api sliderBgColor = '#d4a5a5';
    @api sliderFillColor = '#1b4f72';
    @api sliderKnobColor = '#ffffff';

    // Engagement Ring
    @api ringPercentage = '84';
    @api ringBgColor = '#d4a5a5';
    @api ringProgressColor = '#1b4f72';
    @api ringTextColor = '#1b4f72';
    @api ringDashOffset = '40.19';

    // Engagement Text
    @api engagementTitle = 'Highly Engaged';
    @api engagementDescription = 'Compared to 12K similar RUN prospects';
}
