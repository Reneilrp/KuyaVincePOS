export type Language = 'en' | 'tl';

export const translations = {
  en: {
    // Branding & Common
    appTitle: "KuyaVince POS",
    online: "Online",
    offline: "Offline",
    back: "← Back",
    cancel: "Cancel",
    confirm: "Confirm",
    done: "Done",
    items: "items",
    each: "each",
    
    // PIN Screen
    welcomeBack: "Welcome Back 👋",
    enterPinInstruction: "Enter 4-digit PIN to clock in & start shift",
    forgotPin: "Forgot PIN? Ask your store manager",
    terminalLocked: "🔒 LOCKED: Cooldown active ({seconds}s)",
    accessDenied: "Access Denied",
    incorrectPinWarning: "Incorrect PIN. {attempts} attempt(s) remaining before lockout.",

    // POS Menu / Register
    allCategory: "All",
    outOfStock: "OUT OF STOCK",
    addBtn: "+ Add",
    checkoutBtn: "Checkout →",
    orderItems: "ORDER ITEMS ({count})",
    
    // Cart Review
    yourOrder: "Your Order",
    clearAll: "Clear All",
    totalAmountDue: "TOTAL AMOUNT DUE",
    cashAtCounter: "Cash Payment at Counter",
    addSpecialNote: "Add Note / Special Request",
    notePlaceholder: "e.g. less ice, extra sauce...",
    proceedToPayment: "₱{total} • Proceed to Payment",

    // Payment Screen
    cashPaymentHeader: "Cash Payment",
    cashTendered: "CASH TENDERED (BAYAD)",
    exactAmount: "Exact Amount",
    sukliChange: "Sukli / Change:",
    returnToCustomer: "Return to customer",
    awaitingPayment: "Awaiting payment",
    confirmPrintReceipt: "🖸️ Confirm & Print Receipt",
    enterValidAmount: "Enter Valid Cash Amount",

    // Receipt Screen
    paymentSuccessful: "Payment Successful!",
    receiptPrinting: "Receipt is printing from your device...",
    newOrderBtn: "New Order",
    printAgainBtn: "Print Again",

    // End of Day & Batch Sync
    endOfDayHeader: "End of Day & Cash Balancing",
    shiftPerformance: "📊 Today's Shift Performance",
    totalOrdersCompleted: "Total Orders Completed",
    totalCashSales: "Total Cash Sales (Gross)",
    startingFloat: "1. Starting Panukli (Float)",
    expectedInDrawer: "2. Expected in Drawer",
    actualCountedCash: "3. Actual Counted Cash",
    drawerCountSub: "Binilang sa drawer",
    balancedStatus: "✓ SAKTO / BALANCED (₱0.00)",
    shortStatus: "⚠ KULANG / SHORT ₱{amount}",
    overStatus: "▲ SOBRA / OVER ₱{amount}",
    uploadSalesBtn: "📤 Upload Today's Sales to Cloud",
    uploadHelperPending: "Sync {count} pending order(s) to Admin Dashboard",
    uploadHelperAllSynced: "All orders already backed up to cloud",
    uploadingOrders: "Uploading sales batch & inventory restocks...",
    syncedSuccess: "✅ Synced Successfully! Cloud database updated.",
    printZReportBtn: "🖸️ Print 58mm Z-Reading Slip",
    signOutEndShift: "Sign Out / End Shift",
    unsyncedWarningTitle: "⚠️ Unsynced Orders Detected",
    unsyncedWarningMsg: "You have {count} sales order(s) not yet uploaded to the cloud.\n\nPlease upload before ending your shift so the admin receives today's revenue.",
    uploadNow: "📤 Upload Now",
    skipExitOffline: "Skip & Exit (Offline)"
  },
  tl: {
    // Branding & Common
    appTitle: "KuyaVince POS",
    online: "Online",
    offline: "Offline",
    back: "← Bumalik",
    cancel: "Kanselahin",
    confirm: "Kumpirmahin",
    done: "Tapos Na",
    items: "aytem",
    each: "bawat isa",

    // PIN Screen
    welcomeBack: "Maligayang Pagbabalik 👋",
    enterPinInstruction: "Ilagay ang 4-digit PIN para mag-clock in at magsimula",
    forgotPin: "Nakalimutan ang PIN? Magtanong sa manager",
    terminalLocked: "🔒 NAKA-LOCK: Maghintay ng ({seconds}s)",
    accessDenied: "Bawal ang Access",
    incorrectPinWarning: "Maling PIN. May {attempts} natitirang subok bago ma-lock.",

    // POS Menu / Register
    allCategory: "Lahat",
    outOfStock: "UBOS NA",
    addBtn: "+ Idagdag",
    checkoutBtn: "Magbayad →",
    orderItems: "MGA INORDER ({count})",

    // Cart Review
    yourOrder: "Iyong Order",
    clearAll: "Burahin Lahat",
    totalAmountDue: "KABUUANG BAYARIN",
    cashAtCounter: "Bayad sa Kahera (Cash)",
    addSpecialNote: "Maglagay ng Hiling / Note",
    notePlaceholder: "hal. konting yelo, dagdag sarsa...",
    proceedToPayment: "₱{total} • Magpatuloy sa Bayad",

    // Payment Screen
    cashPaymentHeader: "Bayad sa Cash",
    cashTendered: "AKTIBONG BAYAD NG CUSTOMER",
    exactAmount: "Saktong Bayad",
    sukliChange: "Sukli:",
    returnToCustomer: "Ibalik sa customer",
    awaitingPayment: "Naghihintay ng bayad",
    confirmPrintReceipt: "🖸️ Tanggapin at I-print ang Resibo",
    enterValidAmount: "Kulang ang Binigay na Bayad",

    // Receipt Screen
    paymentSuccessful: "Matagumpay ang Pagbayad!",
    receiptPrinting: "Kasalukuyang nagpi-print ang resibo...",
    newOrderBtn: "Bagong Order",
    printAgainBtn: "I-print Uli",

    // End of Day & Batch Sync
    endOfDayHeader: "Katapusan ng Araw at Pagsusuri ng Pera",
    shiftPerformance: "📊 Ulat ng Benta sa Shift Ngayon",
    totalOrdersCompleted: "Kabuuang Order na Natapos",
    totalCashSales: "Kabuuang Benta (Gross)",
    startingFloat: "1. Panimulang Panukli (Float)",
    expectedInDrawer: "2. Dapat na Laman ng Drawer",
    actualCountedCash: "3. Aktwal na Binilang na Pera",
    drawerCountSub: "Binilang sa cash box",
    balancedStatus: "✓ SAKTO / TUGMA (₱0.00)",
    shortStatus: "⚠ KULANG ANG PERA (-₱{amount})",
    overStatus: "▲ SOBRA ANG PERA (+₱{amount})",
    uploadSalesBtn: "📤 I-upload ang Benta sa Cloud",
    uploadHelperPending: "I-sync ang {count} na order sa Admin Dashboard",
    uploadHelperAllSynced: "Lahat ng benta ay naka-backup na sa cloud",
    uploadingOrders: "Kasalukuyang ini-a-upload ang benta at stock...",
    syncedSuccess: "✅ Matagumpay na Na-sync sa Cloud Database!",
    printZReportBtn: "🖸️ I-print ang 58mm Z-Reading Slip",
    signOutEndShift: "Mag-Sign Out / Tapusin ang Shift",
    unsyncedWarningTitle: "⚠️ May mga Benta pang Hindi Naka-Upload",
    unsyncedWarningMsg: "May {count} na order ka pa na hindi nai-upload sa cloud.\n\nPaki-upload bago mag-sign out para pumasok ang benta sa admin.",
    uploadNow: "📤 I-upload Na",
    skipExitOffline: "Lumabas Kahit Offline"
  }
};

export type TranslationKey = keyof typeof translations.en;
