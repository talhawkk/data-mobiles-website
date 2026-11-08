/**
 * DATA - Global Configuration & Dummy Store
 * Single source of truth for site content.
 * 
 * ALL VALUES BELOW ARE DUMMY PLACEHOLDERS FOR DEVELOPMENT AS SPECIFIED IN SPEC.MD
 */

// DUMMY STORE IDENTIFIERS & CONTACT
export const BRAND_NAME = 'DATA';
export const WHATSAPP_NUMBER = '923001234567'; // DUMMY: International format, digits only
export const WHATSAPP_PREFILL = 'Hi DATA, I need help with my phone.'; // DUMMY
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

export const ADDRESS = 'Shop 12, Main Market, Lahore'; // DUMMY
export const HOURS = '10 AM - 10 PM, daily'; // DUMMY
export const MAPS_URL = 'https://maps.google.com/?q=Main+Market+Gulberg+Lahore'; // DUMMY

// DUMMY SERVICES
export const SERVICES = [
  'Screen',
  'Battery',
  'Charging port',
  'Camera',
  'Board repair',
];

// DUMMY INSPECT LABELS (Projected onto 3D phone parts)
export const INSPECT_LABELS = [
  { id: 'screen', part: 'screen', title: 'Screen', line: 'Cracked? Replaced today.' },
  { id: 'battery', part: 'battery', title: 'Battery', line: 'Full day power again.' },
  { id: 'port', part: 'port', title: 'Port', line: 'Charges like new.' },
  { id: 'camera', part: 'cameraUnit', title: 'Camera', line: 'Sharp again.' },
  { id: 'board', part: 'board', title: 'Board', line: 'Dead phone? We try.' },
];

// DUMMY WIFI PLANS
export const WIFI_PLANS = [
  { name: 'Home', speed: '10 Mbps', price: 'Rs. XXX' },
  { name: 'Family', speed: '20 Mbps', price: 'Rs. XXX' },
  { name: 'Max', speed: '50 Mbps', price: 'Rs. XXX' },
];

// DUMMY ACCESSORIES
export const ACCESSORIES = [
  'Cases',
  'Chargers',
  'Cables',
  'Earbuds',
];

// JSON-LD SCHEMA OBJECT
export const LOCAL_BUSINESS_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: BRAND_NAME,
  description: 'Phone accessories, repair services, and high-speed local WiFi in Lahore.',
  telephone: `+${WHATSAPP_NUMBER}`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Shop 12, Main Market',
    addressLocality: 'Lahore',
    addressRegion: 'Punjab',
    addressCountry: 'PK',
  },
  openingHours: 'Mo-Su 10:00-22:00',
  priceRange: '$$',
};
