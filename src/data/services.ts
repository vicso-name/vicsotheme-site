import { site } from '../config/site';

const { prices } = site;

export interface ServiceItem {
  key: 'mvp' | 'cto' | 'agencies' | 'wordpress';
  n: string;
  title: string;
  desc: string;
  price: string;
}

/** The four offers from the home page, in order. Pages decide where each row links. */
export const services: ServiceItem[] = [
  { key: 'mvp', n: '01 / Founders', title: 'MVP development', desc: 'Mobile or AI-powered MVP in 6–8 weeks, fixed price, code you own.', price: `from ${prices.mvpMobile}` },
  { key: 'cto', n: '02 / Startups', title: 'Fractional CTO', desc: 'Part-time technical lead: architecture, hiring, vendors, roadmap.', price: `from ${prices.ctoAdvisor}/mo` },
  { key: 'agencies', n: '03 / Agencies', title: 'White-label development', desc: 'Overflow capacity for apps and WordPress, under your brand, NDA by default.', price: `from ${prices.agencyRate}/h` },
  { key: 'wordpress', n: '04 / Businesses', title: 'WordPress & maintenance', desc: 'Custom themes, content pipelines, updates and monitoring on a plan.', price: `from ${prices.wpMaintenance}/mo` },
];
