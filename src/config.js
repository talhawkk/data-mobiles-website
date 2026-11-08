/**
 * DATA - Global Configuration & Dummy Store
 * Single source of truth for site content.
 * 
 * ALL VALUES BELOW ARE DUMMY PLACEHOLDERS FOR DEVELOPMENT AS SPECIFIED IN UPGRADE.MD
 */

// DUMMY STORE IDENTIFIERS & CONTACT
export const BRAND_NAME = 'DATA';
export const WHATSAPP_NUMBER = '923001234567'; // DUMMY: confirm with shop
export const WHATSAPP_PREFILL = 'Hi DATA, I need help with my phone.'; // DUMMY: confirm with shop
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;

export const ADDRESS = 'Shop 12, Main Market, Lahore'; // DUMMY: confirm with shop
export const MAPS_URL = 'https://maps.google.com/?q=Main+Market+Gulberg+Lahore'; // DUMMY: confirm with shop

// STORE OPERATING HOURS
export const HOURS = {
  open: 10,
  close: 22,
  tz: 'Asia/Karachi',
};

/**
 * Computes live open status for shop in Asia/Karachi timezone
 * Returns { open: bool, label: string }
 */
export function getOpenStatus(now = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: HOURS.tz,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(now), 10);
    const isOpen = hour >= HOURS.open && hour < HOURS.close;
    return {
      open: isOpen,
      label: isOpen ? 'Open now · until 10 PM' : 'Closed · opens 10 AM',
    };
  } catch (e) {
    const hour = now.getHours();
    const isOpen = hour >= HOURS.open && hour < HOURS.close;
    return {
      open: isOpen,
      label: isOpen ? 'Open now · until 10 PM' : 'Closed · opens 10 AM',
    };
  }
}

// CENTRAL COPY STORE
// Every visible string lives here. Every claim carries // DUMMY: confirm with shop
export const copy = {
  brand: 'DATA', // DUMMY: confirm with shop
  tagline: 'Mobiles. Repairs. WiFi.', // DUMMY: confirm with shop
  nav: {
    repairs: 'Repairs', // DUMMY: confirm with shop
    accessories: 'Accessories', // DUMMY: confirm with shop
    wifi: 'WiFi', // DUMMY: confirm with shop
  },
  hero: {
    eyebrow: 'MAIN MARKET, LAHORE', // DUMMY: confirm with shop
    title: 'Mobiles.<br>Repairs.<br>WiFi.', // DUMMY: confirm with shop
    subtitle: 'Screens, batteries, accessories and home WiFi.', // DUMMY: confirm with shop
  },
  inspect: {
    battery: {
      id: 'battery',
      part: 'battery',
      number: '01',
      eyebrow: 'POWER', // DUMMY: confirm with shop
      title: 'Battery', // DUMMY: confirm with shop
      body: 'Full day power again.', // DUMMY: confirm with shop
    },
    board: {
      id: 'board',
      part: 'board',
      number: '02',
      eyebrow: 'CIRCUIT', // DUMMY: confirm with shop
      title: 'Board', // DUMMY: confirm with shop
      body: 'Dead phone? We try.', // DUMMY: confirm with shop
    },
    camera: {
      id: 'camera',
      part: 'cameraUnit',
      number: '03',
      eyebrow: 'OPTICS', // DUMMY: confirm with shop
      title: 'Camera', // DUMMY: confirm with shop
      body: 'Sharp again.', // DUMMY: confirm with shop
    },
    port: {
      id: 'port',
      part: 'port',
      number: '04',
      eyebrow: 'CHARGING', // DUMMY: confirm with shop
      title: 'Port', // DUMMY: confirm with shop
      body: 'Charges like new.', // DUMMY: confirm with shop
    },
    screen: {
      id: 'screen',
      part: 'screen',
      number: '05',
      eyebrow: 'DISPLAY', // DUMMY: confirm with shop
      title: 'Screen', // DUMMY: confirm with shop
      body: 'Cracked? Replaced today.', // DUMMY: confirm with shop
    },
  },
  rebuild: {
    eyebrow: 'RESTORED', // DUMMY: confirm with shop
    title: 'Fixed.', // DUMMY: confirm with shop
    body: 'Most repairs, same day.', // DUMMY: confirm with shop
  },
  accessories: {
    eyebrow: 'ORIGINAL GEAR', // DUMMY: confirm with shop
    title: 'Everything it wears.', // DUMMY: confirm with shop
    items: ['Cases', 'Chargers', 'Cables', 'Earbuds'], // DUMMY: confirm with shop
  },
  wifi: {
    eyebrow: 'HOME WIFI', // DUMMY: confirm with shop
    title: 'Fast WiFi. No drama.', // DUMMY: confirm with shop
    plans: [
      { name: 'Home', speed: '10 Mbps', price: 'Rs. XXX' }, // DUMMY: confirm with shop
      { name: 'Family', speed: '20 Mbps', price: 'Rs. XXX' }, // DUMMY: confirm with shop
      { name: 'Max', speed: '50 Mbps', price: 'Rs. XXX' }, // DUMMY: confirm with shop
    ],
  },
  finale: {
    eyebrow: 'VISIT OR CALL', // DUMMY: confirm with shop
    title: "Tell us what's broken.", // DUMMY: confirm with shop
    cta: 'Chat on WhatsApp →', // DUMMY: confirm with shop
    addressLabel: 'ADDRESS:', // DUMMY: confirm with shop
    address: 'Shop 12, Main Market, Lahore', // DUMMY: confirm with shop
    hoursLabel: 'HOURS:', // DUMMY: confirm with shop
    hours: '10 AM - 10 PM, daily', // DUMMY: confirm with shop
  },
};

// DUMMY SERVICES
export const SERVICES = [
  'Screen', // DUMMY: confirm with shop
  'Battery', // DUMMY: confirm with shop
  'Charging port', // DUMMY: confirm with shop
  'Camera', // DUMMY: confirm with shop
  'Board repair', // DUMMY: confirm with shop
];

// INSPECT LABELS (Order in v2: Battery -> Board -> Camera -> Port -> Screen)
export const INSPECT_LABELS = [
  copy.inspect.battery,
  copy.inspect.board,
  copy.inspect.camera,
  copy.inspect.port,
  copy.inspect.screen,
];

// DUMMY WIFI PLANS
export const WIFI_PLANS = copy.wifi.plans;

// DUMMY ACCESSORIES
export const ACCESSORIES = copy.accessories.items;

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
