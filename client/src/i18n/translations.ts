export type Language = 'en' | 'am';

export interface Translations {
  appName: string;
  tagline: string;
  getThereFaster: string;
  selectRole: string;
  rider: string;
  driver: string;
  admin: string;
  splitMode: string;
  language: string;
  online: string;
  offline: string;
  pickup: string;
  destination: string;
  whereTo: string;
  searchAddis: string;
  findRide: string;
  calculatingFare: string;
  fareBreakdown: string;
  baseFare: string;
  distanceFare: string;
  timeFare: string;
  vatRegulation: string;
  vatNotice: string;
  platformFee: string;
  totalEstimate: string;
  estimatedArrival: string;
  bookNow: string;
  cash: string;
  telebirr: string;
  paymentMethod: string;
  searchingDriver: string;
  driverAssigned: string;
  driverArrived: string;
  tripInProgress: string;
  tripCompleted: string;
  tripCancelled: string;
  rateDriver: string;
  tipDriver: string;
  submitRating: string;
  sosEmergency: string;
  shareTrip: string;
  callDriver: string;
  viewReceipt: string;
  taxReceipt: string;
  minivan: string;
  sedan: string;
  comfort: string;
  partnerComparison: string;
  compareRides: string;
  chebelewDirect: string;
  driverDashboard: string;
  todayEarnings: string;
  totalTrips: string;
  walletBalance: string;
  withdrawTelebirr: string;
  acceptRide: string;
  declineRide: string;
  arrivedPickup: string;
  startTrip: string;
  completeTrip: string;
  dispatchConsole: string;
  manualDispatch: string;
  liveFleetMap: string;
  driverKycQueue: string;
  vatReportTitle: string;
  callCenterBooking: string;
  callerPhone: string;
  callerName: string;
  dispatchDriver: string;
  approve: string;
  reject: string;
  fastDemo: string;
  simulateMove: string;
  tripHistory: string;
  supportHelp: string;
  reportIssue: string;
  supportTickets: string;
  tariffs: string;
  offlineQueue: string;
  syncNow: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Chebelew (ቼበለው)',
    tagline: 'Ethiopia Ride-Hailing Aggregator & Dispatch',
    getThereFaster: 'Get there faster with Chebelew',
    selectRole: 'Switch View / Role',
    rider: 'Passenger App',
    driver: 'Driver App',
    admin: 'Admin & Dispatch',
    splitMode: 'Split View',
    language: 'Language',
    online: 'ONLINE',
    offline: 'OFFLINE',
    pickup: 'Pickup Location',
    destination: 'Destination',
    whereTo: 'Where to in Addis Ababa?',
    searchAddis: 'Search Addis landmarks (e.g., Bole, Piassa, Kazanchis)...',
    findRide: 'Find Rides & Compare',
    calculatingFare: 'Calculating fares...',
    fareBreakdown: 'Fare Breakdown',
    baseFare: 'Base Fare',
    distanceFare: 'Distance Fare',
    timeFare: 'Time Fare',
    vatRegulation: 'VAT (15% - Reg. No. 570/2025)',
    vatNotice: 'Compliant with FDRE VAT Regulation No. 570/2025 on ride-hailing platforms',
    platformFee: 'Platform Commission (15%)',
    totalEstimate: 'Total Fare (Inc. VAT)',
    estimatedArrival: 'ETA',
    bookNow: 'Book Chebelew Ride',
    cash: 'Cash Payment',
    telebirr: 'Telebirr Digital Wallet',
    paymentMethod: 'Payment Method',
    searchingDriver: 'Searching for closest driver...',
    driverAssigned: 'Driver On The Way',
    driverArrived: 'Driver Arrived at Pickup',
    tripInProgress: 'Trip in Progress to Destination',
    tripCompleted: 'Trip Completed',
    tripCancelled: 'Trip Cancelled',
    rateDriver: 'Rate Your Driver',
    tipDriver: 'Add a Tip (ETB)',
    submitRating: 'Submit Feedback & Rating',
    sosEmergency: 'Emergency SOS (991)',
    shareTrip: 'Share Trip Status',
    callDriver: 'Call Driver',
    viewReceipt: 'View Tax Receipt',
    taxReceipt: 'Official VAT Tax Receipt',
    minivan: 'Chebelew XL (Minivan 7-Seater)',
    sedan: 'Chebelew Standard (Sedan 4-Seater)',
    comfort: 'Chebelew Executive Comfort',
    partnerComparison: 'Multi-Fleet Live Fare Comparison',
    compareRides: 'Compare with Partner Taxi Fleets',
    chebelewDirect: 'Chebelew Best Value',
    driverDashboard: 'Driver Operations Portal',
    todayEarnings: "Today's Net Earnings",
    totalTrips: 'Completed Trips',
    walletBalance: 'Telebirr Wallet Balance',
    withdrawTelebirr: 'Withdraw to Telebirr',
    acceptRide: 'Accept Ride',
    declineRide: 'Decline',
    arrivedPickup: 'I Have Arrived',
    startTrip: 'Start Trip (Passenger Aboard)',
    completeTrip: 'Complete Trip & Collect',
    dispatchConsole: 'Call Center Dispatch Console',
    manualDispatch: 'Manual Phone Dispatch',
    liveFleetMap: 'Addis Ababa Live Fleet Map',
    driverKycQueue: 'Driver KYC Approvals',
    vatReportTitle: 'Ethiopian VAT Regulation 570/2025 Tax Ledger',
    callCenterBooking: 'Book Ride for Call-In Passenger',
    callerPhone: 'Caller Phone (+251...)',
    callerName: 'Passenger Full Name',
    dispatchDriver: 'Dispatch Taxi Now',
    approve: 'Approve Driver KYC',
    reject: 'Reject',
    fastDemo: '⚡ 1-Click Ride Demo',
    simulateMove: 'Auto-Simulate Vehicle Movement',
    tripHistory: 'Trip History',
    supportHelp: 'Support & Help Desk (9922)',
    reportIssue: 'Report an Issue / Dispute',
    supportTickets: 'Support Tickets & Disputes',
    tariffs: 'Tariffs & Regulations',
    offlineQueue: 'Offline Queued Logs',
    syncNow: 'Sync Queued Data',
  },
  am: {
    appName: 'ቼበለው (Chebelew)',
    tagline: 'የኢትዮጵያ የታክሲ አገልግሎቶች መተግበሪያ',
    getThereFaster: 'በቼበለው በፍጥነት ይድረሱ',
    selectRole: 'ሚና ይምረጡ',
    rider: 'የተሳፋሪ መተግበሪያ',
    driver: 'የአሽከርካሪ መተግበሪያ',
    admin: 'የቁጥጥርና የዲስፓች ማዕከል',
    splitMode: 'የተከፈለ እይታ',
    language: 'ቋንቋ',
    online: 'መስመር ላይ',
    offline: 'ከመስመር ውጭ',
    pickup: 'መነሻ ቦታ',
    destination: 'መድረሻ ቦታ',
    whereTo: 'የት መሄድ ይፈልጋሉ?',
    searchAddis: 'የአዲስ አበባ ታዋቂ ቦታዎችን ይፈልጉ (ቦሌ፣ ፒያሳ፣ ካዛንቺስ)...',
    findRide: 'ታክሲዎችን ፈልግና አወዳድር',
    calculatingFare: 'ዋጋ በመገመት ላይ...',
    fareBreakdown: 'የዋጋ ዝርዝር መግለጫ',
    baseFare: 'የመነሻ ዋጋ',
    distanceFare: 'የኪሎሜትር ሂሳብ',
    timeFare: 'የደቂቃ ሂሳብ',
    vatRegulation: 'የተጨማሪ እሴት ታክስ (15% - ደንብ ቁጥር 570/2017)',
    vatNotice: 'በኢፌዲሪ የገቢዎች ሚኒስቴር የታክሲ መተግበሪያዎች ደንብ ቁጥር 570/2017 መሰረት 15% ቫት ታክሏል',
    platformFee: 'የመተግበሪያው ኮሚሽን (15%)',
    totalEstimate: 'ጠቅላላ ክፍያ (ከቫት ጋር)',
    estimatedArrival: 'የመድረሻ ጊዜ',
    bookNow: 'ጉዞ ይዘዙ',
    cash: 'በጥሬ ገንዘብ (Cash)',
    telebirr: 'በቴሌብር (Telebirr)',
    paymentMethod: 'የክፍያ ዘዴ',
    searchingDriver: 'ቅርብ ያለ አሽከርካሪ በመፈለግ ላይ...',
    driverAssigned: 'አሽከርካሪ ወደ እርስዎ በመምጣት ላይ ነው',
    driverArrived: 'አሽከርካሪው መነሻ ቦታ ደርሷል',
    tripInProgress: 'ጉዞው በመካሄድ ላይ ነው',
    tripCompleted: 'ጉዞው በተሳካ ሁኔታ ተጠናቋል',
    tripCancelled: 'ጉዞው ተሰርዟል',
    rateDriver: 'ለአሽከርካሪው ደረጃ ይስጡ',
    tipDriver: 'ጉርሻ ይጨምሩ (ብር)',
    submitRating: 'ደረጃውን አረጋግጥ',
    sosEmergency: 'የአደጋ ጊዜ ጥሪ (ፖሊስ 991)',
    shareTrip: 'የጉዞ ሁኔታን አጋራ',
    callDriver: 'ለአሽከርካሪው ይደውሉ',
    viewReceipt: 'ደረሰኝ ይመልከቱ',
    taxReceipt: 'የታክስ ደረሰኝ (VAT Receipt)',
    minivan: 'ቼበለው ኤክስ ኤል (ሚኒቫን 7 መቀመጫ)',
    sedan: 'ቼበለው መደበኛ (ሴዳን 4 መቀመጫ)',
    comfort: 'ቼበለው ኤክስኪዩቲቭ ኮምፎርት',
    partnerComparison: 'የታክሲዎች ዋጋ ማወዳደሪያ',
    compareRides: 'ከተባባሪ ታክሲዎች ጋር አወዳድር',
    chebelewDirect: 'ቼበለው - የተሻለ ዋጋ',
    driverDashboard: 'የአሽከርካሪ መቆጣጠሪያ ሰሌዳ',
    todayEarnings: 'የዛሬ የተጣራ ገቢ',
    totalTrips: 'የተጠናቀቁ ጉዞዎች',
    walletBalance: 'የቴሌብር ቦርሳ ቀሪ ሂሳብ',
    withdrawTelebirr: 'ወደ ቴሌብር አውጣ',
    acceptRide: 'ጉዞውን ተቀበል',
    declineRide: 'እምቢ በል',
    arrivedPickup: 'መነሻ ቦታ ደርሻለሁ',
    startTrip: 'ጉዞ ጀምር (ተሳፋሪ ተሳፍሯል)',
    completeTrip: 'ጉዞውን ጨርስና ክፍያ ተቀበል',
    dispatchConsole: 'የስልክ ጥሪ ዲስፓች ኮንሶል',
    manualDispatch: 'በስልክ ጥሪ ታክሲ መመደብ',
    liveFleetMap: 'የአዲስ አበባ የቀጥታ የታክሲዎች ካርታ',
    driverKycQueue: 'የአሽከርካሪዎች ማረጋገጫ (KYC)',
    vatReportTitle: 'የቫት ደንብ ቁጥር 570/2017 የታክስ ሪፖርት',
    callCenterBooking: 'በስልክ ለደወለ ደንበኛ ታክሲ መመደብ',
    callerPhone: 'የደዋይ ስልክ ቁጥር (+251...)',
    callerName: 'የደንበኛው ሙሉ ስም',
    dispatchDriver: 'አሁን ታክሲ ላክ',
    approve: 'አጽድቅ',
    reject: 'ውድቅ አድርግ',
    fastDemo: '⚡ የ1-ጠቅታ የጉዞ ማሳያ (Demo)',
    simulateMove: 'የመኪና እንቅስቃሴን አስመስል',
    tripHistory: 'የቀድሞ ጉዞዎች ታሪክ',
    supportHelp: 'የደንበኞች ድጋፍ መስጫ (9922)',
    reportIssue: 'ቅሬታ ወይም ችግር ያመልክቱ',
    supportTickets: 'የደንበኞች ቅሬታዎች መፍቻ',
    tariffs: 'የክፍያ ተመን እና ህጎች',
    offlineQueue: 'ከመስመር ውጭ የተቀመጡ መረጃዎች',
    syncNow: 'መረጃዎችን አመሳስል',
  },
};
