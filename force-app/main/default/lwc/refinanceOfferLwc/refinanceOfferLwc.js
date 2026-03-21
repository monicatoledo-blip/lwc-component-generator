import { LightningElement, api } from "lwc";

const CUMULUS_BLUE = "#0176d3";

export default class RefinanceOfferLwc extends LightningElement {
  @api cardTitle = "Member Savings Insight";
  @api headerBadgeText = "LIVE DATA MATCH";
  @api externalLoanLabel = "Current External Loan";
  @api externalApr = "7.5% APR";
  @api externalMonthly = "Monthly: $350";
  @api institutionRateLabel = "Cumulus Pre-Approved Rate";
  @api institutionApr = "4.9% APR";
  @api institutionMonthly = "Monthly: $266";
  @api rateDropSectionLabel = "Rate Drop";
  @api rateDropBarFillPercent = "42";
  @api rateDropCaption = "7.5% → 4.9% (2.6 pts)";
  @api savingsSectionLabel = "Estimated Monthly Savings";
  @api savingsAmount = "$84/month";
  @api savingsFormula = "External payment – Cumulus payment = Your savings";
  @api savingsLabelColor = "#2e844a";
  @api savingsCardBgColor = "#f3f6f9";
  @api savingsAccentBorderColor = "#0176d3";
  @api disclaimerNote =
    "Rates and payments are illustrative. Subject to credit approval.";
  @api ctaLabel = "Generate Refinance Offer";
  @api ctaButtonColor = "#0176d3";

  get rootStyle() {
    const savBg = this.savingsCardBgColor || "#f3f6f9";
    const savBorder = this.savingsAccentBorderColor || CUMULUS_BLUE;
    const savLbl = this.savingsLabelColor || "#2e844a";
    const cta = this.ctaButtonColor || CUMULUS_BLUE;
    return `--ro-cumulus-blue:${CUMULUS_BLUE};--ro-savings-bg:${savBg};--ro-savings-border:${savBorder};--ro-savings-label:${savLbl};--ro-cta-bg:${cta};--ro-cta-border:${cta};`;
  }

  get barFillStyle() {
    const raw = parseInt(String(this.rateDropBarFillPercent || "0"), 10);
    const pct = Number.isNaN(raw) ? 40 : Math.min(100, Math.max(0, raw));
    return `width:${pct}%;`;
  }

  get showHeaderBadge() {
    return !!(this.headerBadgeText && String(this.headerBadgeText).trim());
  }

  get showDisclaimer() {
    return !!(this.disclaimerNote && String(this.disclaimerNote).trim());
  }

  get showCta() {
    return !!(this.ctaLabel && String(this.ctaLabel).trim());
  }
}
