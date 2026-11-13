export interface AddisLandmark {
  id: string;
  name: string;
  nameAm: string;
  lat: number;
  lng: number;
  category: 'transit' | 'hotel' | 'commercial' | 'square' | 'institution';
  description: string;
}

export const ADDIS_LANDMARKS: AddisLandmark[] = [
  {
    id: 'bole_airport',
    name: 'Bole Addis Ababa International Airport',
    nameAm: 'ቦሌ ዓለም አቀፍ አውሮፕላን ማረፊያ',
    lat: 8.9778,
    lng: 38.7993,
    category: 'transit',
    description: 'Terminal 1 & 2 Departure / Arrival',
  },
  {
    id: 'meskel_square',
    name: 'Meskel Square',
    nameAm: 'መስቀል አደባባይ',
    lat: 9.0105,
    lng: 38.7615,
    category: 'square',
    description: 'City Center & Light Rail hub',
  },
  {
    id: 'kazanchis_uneca',
    name: 'UNECA Conference Centre (Kazanchis)',
    nameAm: 'የተመድ ኢኮኖሚክ ኮሚሽን (ካዛንቺስ)',
    lat: 9.0185,
    lng: 38.7705,
    category: 'institution',
    description: 'Kazanchis diplomatic & business quarter',
  },
  {
    id: 'piassa_churchill',
    name: 'Piassa & Churchill Avenue',
    nameAm: 'ፒያሳ እና ቸርችል ጎዳና',
    lat: 9.0345,
    lng: 38.7525,
    category: 'commercial',
    description: 'Historic retail and municipal hub',
  },
  {
    id: 'mexico_square',
    name: 'Mexico Square',
    nameAm: 'ሜክሲኮ አደባባይ',
    lat: 9.0101,
    lng: 38.7450,
    category: 'square',
    description: 'Commercial interchange & bus terminals',
  },
  {
    id: 'bole_medhanialem',
    name: 'Bole Medhanialem & Edna Mall Area',
    nameAm: 'ቦሌ መድኃኔዓለም እና ኤድና ሞል',
    lat: 8.9950,
    lng: 38.7880,
    category: 'commercial',
    description: 'Restaurants, malls, cafes corridor',
  },
  {
    id: 'megenagna',
    name: 'Megenagna Roundabout',
    nameAm: 'መገናኛ አደባባይ',
    lat: 9.0210,
    lng: 38.8020,
    category: 'transit',
    description: 'Major transit terminal & commerce',
  },
  {
    id: 'sarbet_au',
    name: 'Sarbet & African Union HQ',
    nameAm: 'ሳርቤት እና የአፍሪካ ህብረት ዋና መሥሪያ ቤት',
    lat: 8.9970,
    lng: 38.7360,
    category: 'institution',
    description: 'AU Headquarters & diplomatic residences',
  },
  {
    id: 'mercato',
    name: 'Addis Mercato (Grand Market)',
    nameAm: 'አዲስ መርካቶ',
    lat: 9.0300,
    lng: 38.7390,
    category: 'commercial',
    description: "Africa's largest open-air commercial market",
  },
  {
    id: 'cmc_michael',
    name: 'CMC St. Michael Area',
    nameAm: 'ሲኤምሲ ቅዱስ ሚካኤል አካባቢ',
    lat: 9.0240,
    lng: 38.8550,
    category: 'commercial',
    description: 'Eastern residential & commercial corridor',
  },
  {
    id: 'gotera',
    name: 'Gotera Interchange',
    nameAm: 'ጎተራ ማስተላለፊያ',
    lat: 8.9910,
    lng: 38.7550,
    category: 'transit',
    description: 'Debre Zeit Road junction',
  },
  {
    id: 'sheraton_addis',
    name: 'Sheraton Addis Luxury Collection',
    nameAm: 'ሸራተን አዲስ ሆቴል',
    lat: 9.0195,
    lng: 38.7610,
    category: 'hotel',
    description: 'Taitu Street luxury hotel',
  },
];
