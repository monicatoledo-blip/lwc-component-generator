import { LightningElement, api } from "lwc";

/** Cumulus / Salesforce brand blue — fixed for card chrome; only the CTA uses ctaButtonColor. */
const CUMULUS_BLUE = "#0176d3";

export default class RefinanceOfferLwc extends LightningElement {
  @api cardTitle = "{{{cardTitle}}}";
  @api headerBadgeText = "{{{headerBadgeText}}}";
  @api externalLoanLabel = "{{{externalLoanLabel}}}";
  @api externalApr = "{{{externalApr}}}";
  @api externalMonthly = "{{{externalMonthly}}}";
  @api institutionRateLabel = "{{{institutionRateLabel}}}";
  @api institutionApr = "{{{institutionApr}}}";
  @api institutionMonthly = "{{{institutionMonthly}}}";
  @api rateDropSectionLabel = "{{{rateDropSectionLabel}}}";
  @api rateDropBarFillPercent = "{{{rateDropBarFillPercent}}}";
  @api rateDropCaption = "{{{rateDropCaption}}}";
  @api savingsSectionLabel = "{{{savingsSectionLabel}}}";
  @api savingsAmount = "{{{savingsAmount}}}";
  @api savingsFormula = "{{{savingsFormula}}}";
  @api savingsLabelColor = "{{{savingsLabelColor}}}";
  @api savingsCardBgColor = "{{{savingsCardBgColor}}}";
  @api savingsAccentBorderColor = "{{{savingsAccentBorderColor}}}";
  @api disclaimerNote = "{{{disclaimerNote}}}";
  @api ctaLabel = "{{{ctaLabel}}}";
  @api ctaButtonColor = "{{{ctaButtonColor}}}";

  get rootStyle() {
    const savBg = this.savingsCardBgColor || "#f3f6f9";
    const savBorder = this.savingsAccentBorderColor || CUMULUS_BLUE;
    const savLbl = this.savingsLabelColor || "#2e844a";
    const cta = this.ctaButtonColor || CUMULUS_BLUE;
    return `--ro-cumulus-blue:${CUMULUS_BLUE};--ro-savings-bg:${savBg};--ro-savings-border:${savBorder};--ro-savings-label:${savLbl};--ro-cta-bg:${cta};--ro-cta-border:${cta};`;
  }

  get barFillStyle() {
    const raw = parseInt(String(this.rateDropBarFillPercent || "0"), 10);
    const pct = Number.isNaN(raw)
      ? 40
      : Math.min(100, Math.max(0, raw));
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
