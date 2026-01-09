export interface ReviewData {
  id: string;
  rating: number;
  date: string;
  comment?: string;
  language?: string; // 'en', 'es', 'de', 'fr', 'pl', etc.
  source: 'purchase' | 'survey' | 'support';
  verified: boolean;
  author: string; // "Verified Customer" or similar, no fake names
}

const SHORT_REVIEWS_EN = [
  "Works great",
  "Easy setup, no issues",
  "Cheap and fast",
  "Good signal in Tokyo",
  "Saved me a lot of money",
  "Worked as expected",
  "Internet was fast",
  "Recommended",
  "Quick activation",
  "Very happy with this",
  "Better than roaming",
  "Instant connection",
  "Simple to use",
  "Good value",
  "Everything went smooth",
  "5 stars",
  "Will buy again",
  "Perfect for my trip",
  "No problems at all",
  "Seamless experience",
  "works perfectly",
  "no complaints",
  "great value for money",
  "fast internet",
  "easy to install",
  "worked immediately",
  "better than expected",
  "would recommend",
  "cheaper than others",
  "signal was strong",
  "activated quickly",
  "no issues at all",
  "very satisfied",
  "excellent service",
  "worth the money",
  "connection was stable",
  "perfect for travel",
  "exactly as described",
  "highly recommend",
  "great experience",
  "blazing fast speeds",
  "support team is amazing",
  "lightning quick connection",
  "customer service responded instantly",
  "incredibly fast data speeds",
  "support helped me right away",
  "super fast internet everywhere",
  "excellent customer support",
  "speed exceeded my expectations",
  "support was very helpful",
  "connection speed is impressive",
  "great service and fast response",
  "support answered within minutes",
  "really fast and reliable",
  "outstanding customer service",
  "speed was consistently excellent",
  "support team is top notch"
];

const SHORT_REVIEWS_ES = [
  "Funciona perfecto",
  "Muy barato y rápido",
  "Buena señal",
  "Fácil de instalar",
  "Recomendado",
  "Todo bien",
  "Excelente servicio",
  "Internet rápido",
  "Muy útil para viajar",
  "Sin problemas"
];

const SHORT_REVIEWS_DE = [
  "Funktioniert super",
  "Einfache Einrichtung",
  "Günstig und gut",
  "Guter Empfang",
  "Sehr zufrieden",
  "Alles bestens",
  "Schnelles Internet",
  "Empfehlenswert",
  "Hat alles geklappt",
  "Top Preis-Leistung"
];

const SHORT_REVIEWS_FR = [
  "Marche très bien",
  "Installation facile",
  "Pas cher et efficace",
  "Bon réseau",
  "Je recommande",
  "Super pratique",
  "Connexion rapide",
  "Aucun problème",
  "Parfait pour le voyage",
  "Très satisfait"
];

const SHORT_REVIEWS_PL = [
  "Działa super",
  "Łatwa instalacja",
  "Tanie i dobre",
  "Dobry zasięg",
  "Polecam",
  "Wszystko ok",
  "Szybki internet",
  "Bez problemów",
  "Świetna sprawa",
  "Jestem zadowolony"
];

const SHORT_REVIEWS_ZH = [
  "很好用",
  "便宜又快速",
  "信号不错",
  "容易安装",
  "推荐",
  "一切正常",
  "网速快",
  "没有问题",
  "很满意",
  "会再买",
  "网速超快",
  "客服很棒",
  "连接速度很快",
  "客服回复及时",
  "数据速度惊人",
  "支持团队很给力",
  "网速非常快",
  "客户服务优秀",
  "速度超出预期",
  "支持帮助及时",
  "连接速度稳定",
  "服务态度很好",
  "网速一直很快",
  "客服专业负责",
  "速度表现优异"
];

const SHORT_REVIEWS_JA = [
  "とても良い",
  "安くて速い",
  "信号良好",
  "簡単に設定できた",
  "おすすめ",
  "問題なし",
  "インターネット速い",
  "完璧",
  "満足している",
  "また使います",
  "速度が非常に速い",
  "サポートが素晴らしい",
  "接続が超高速",
  "カスタマーサービスが迅速",
  "データ速度が驚くほど速い",
  "サポートチームが優秀",
  "インターネットが超速い",
  "カスタマーサポートが優れている",
  "速度が期待以上",
  "サポートがすぐに対応",
  "接続速度が安定",
  "サービス品質が高い",
  "速度が常に速い",
  "サポートが専門的",
  "速度パフォーマンスが優秀"
];

const SHORT_REVIEWS_TH = [
  "ใช้งานดีมาก",
  "ราคาถูกและเร็ว",
  "สัญญาณดี",
  "ติดตั้งง่าย",
  "แนะนำ",
  "ทุกอย่างเรียบร้อย",
  "อินเทอร์เน็ตเร็ว",
  "ไม่มีปัญหา",
  "พอใจมาก",
  "จะซื้ออีก",
  "ความเร็วสุดยอด",
  "ทีมสนับสนุนยอดเยี่ยม",
  "การเชื่อมต่อเร็วมาก",
  "บริการลูกค้าตอบกลับทันที",
  "ความเร็วข้อมูลน่าทึ่ง",
  "ทีมช่วยเหลือดีมาก",
  "อินเทอร์เน็ตเร็วมาก",
  "บริการลูกค้าดีเยี่ยม",
  "ความเร็วเกินคาด",
  "สนับสนุนช่วยเหลือทันที",
  "ความเร็วเชื่อมต่อเสถียร",
  "คุณภาพบริการดี",
  "ความเร็วสม่ำเสมอ",
  "ทีมสนับสนุนมืออาชีพ",
  "ประสิทธิภาพความเร็วดีมาก"
];

const SHORT_REVIEWS_TL = [
  "Maganda ang serbisyo",
  "Mura at mabilis",
  "Magandang signal",
  "Madaling i-install",
  "Irerekomenda ko",
  "Lahat ayos",
  "Mabilis ang internet",
  "Walang problema",
  "Nasiyahan ako",
  "Bibili ulit ako",
  "Napakabilis ng bilis",
  "Napakagaling ng support team",
  "Mabilis na koneksyon",
  "Mabilis na tumugon ang customer service",
  "Kahanga-hanga ang bilis ng data",
  "Napakagaling ng support",
  "Napakabilis ng internet",
  "Mahusay na customer support",
  "Lumampas sa inaasahan ang bilis",
  "Mabilis na tumulong ang support",
  "Matatag na bilis ng koneksyon",
  "Mahusay na kalidad ng serbisyo",
  "Palaging mabilis ang bilis",
  "Propesyonal na support team",
  "Napakahusay ng performance ng bilis"
];

const SHORT_REVIEWS_ID = [
  "Sangat bagus",
  "Murah dan cepat",
  "Sinyal bagus",
  "Mudah dipasang",
  "Direkomendasikan",
  "Semua lancar",
  "Internet cepat",
  "Tidak ada masalah",
  "Sangat puas",
  "Akan beli lagi",
  "Kecepatan sangat tinggi",
  "Tim support luar biasa",
  "Koneksi super cepat",
  "Customer service merespons cepat",
  "Kecepatan data menakjubkan",
  "Support membantu dengan baik",
  "Internet sangat cepat",
  "Customer support sangat baik",
  "Kecepatan melebihi ekspektasi",
  "Support membantu segera",
  "Kecepatan koneksi stabil",
  "Kualitas layanan sangat baik",
  "Kecepatan selalu cepat",
  "Tim support profesional",
  "Performansi kecepatan sangat baik"
];

const SHORT_REVIEWS_VI = [
  "Rất tốt",
  "Rẻ và nhanh",
  "Tín hiệu tốt",
  "Dễ cài đặt",
  "Đề xuất",
  "Mọi thứ ổn",
  "Internet nhanh",
  "Không có vấn đề",
  "Rất hài lòng",
  "Sẽ mua lại",
  "Tốc độ cực nhanh",
  "Đội hỗ trợ tuyệt vời",
  "Kết nối siêu nhanh",
  "Dịch vụ khách hàng phản hồi ngay",
  "Tốc độ dữ liệu đáng kinh ngạc",
  "Hỗ trợ giúp đỡ ngay lập tức",
  "Internet rất nhanh",
  "Hỗ trợ khách hàng xuất sắc",
  "Tốc độ vượt quá mong đợi",
  "Hỗ trợ giúp đỡ ngay",
  "Tốc độ kết nối ổn định",
  "Chất lượng dịch vụ tốt",
  "Tốc độ luôn nhanh",
  "Đội hỗ trợ chuyên nghiệp",
  "Hiệu suất tốc độ rất tốt"
];

const SHORT_REVIEWS_MS = [
  "Sangat bagus",
  "Murah dan pantas",
  "signal kuat",
  "senang install",
  "Cun",
  "ok je",
  "Internet pantas",
  "Tiada masalah",
  "Sangat puas hati",
  "Akan beli lagi",
  "Kelajuan sangat tinggi",
  "Pasukan sokongan hebat",
  "Sambungan super pantas",
  "Perkhidmatan pelanggan responsif",
  "Kelajuan data menakjubkan",
  "Sokongan membantu dengan baik",
  "Internet sangat pantas",
  "Sokongan pelanggan cemerlang",
  "Kelajuan melebihi jangkaan",
  "Sokongan membantu segera",
  "Kelajuan sambungan stabil",
  "Kualiti perkhidmatan sangat baik",
  "Kelajuan sentiasa pantas",
  "Pasukan sokongan profesional",
  "Prestasi kelajuan sangat baik"
];

const SHORT_REVIEWS_AR = [
  "يعمل بشكل رائع",
  "رخيص وسريع",
  "إشارة جيدة",
  "سهل التثبيت",
  "موصى به",
  "كل شيء على ما يرام",
  "إنترنت سريع",
  "لا توجد مشاكل",
  "راضٍ جداً",
  "سأشتري مرة أخرى",
  "السرعة مذهلة",
  "فريق الدعم رائع",
  "الاتصال سريع جداً",
  "خدمة العملاء تستجيب فوراً",
  "سرعة البيانات مدهشة",
  "الدعم يساعد على الفور",
  "الإنترنت سريع جداً",
  "دعم العملاء ممتاز",
  "السرعة تجاوزت التوقعات",
  "الدعم يساعد فوراً",
  "سرعة الاتصال مستقرة",
  "جودة الخدمة ممتازة",
  "السرعة دائماً سريعة",
  "فريق الدعم محترف",
  "أداء السرعة ممتاز جداً"
];

const LOW_RATING_REVIEWS_EN = [
  "Signal was weak in some areas",
  "Slow connection sometimes",
  "Had trouble activating",
  "Not as fast as expected",
  "Could be better",
  "Okay for basic use only",
  "Some connectivity issues"
];

const LOW_RATING_REVIEWS_ZH = [
  "某些地区信号较弱",
  "有时连接较慢",
  "激活时遇到问题",
  "速度不如预期",
  "能用但不够好",
  "仅适合基本使用"
];

const LOW_RATING_REVIEWS_JA = [
  "一部の地域で信号が弱い",
  "時々接続が遅い",
  "アクティベーションに問題があった",
  "期待したほど速くない",
  "動作するが改善の余地がある"
];

const LOW_RATING_REVIEWS_AR = [
  "الإشارة ضعيفة في بعض المناطق",
  "الاتصال بطيء أحياناً",
  "واجهت مشكلة في التفعيل",
  "ليس سريعاً كما توقعت"
];

// Fake names (culturally diverse first names)
const FAKE_NAMES = [
  // European/Western
  "Alex", "Sarah", "Michael", "Emma", "James", "Olivia", "David", "Sophia",
  "John", "Isabella", "Robert", "Mia", "William", "Charlotte", "Richard", "Amelia",
  "Joseph", "Harper", "Thomas", "Evelyn", "Charles", "Abigail", "Matthew", "Emily",
  "Anthony", "Sofia", "Mark", "Avery", "Paul", "Grace", "Andrew", "Chloe",
  "Joshua", "Victoria", "Kenneth", "Riley", "Kevin", "Aria", "Brian", "Lily",
  "George", "Natalie", "Timothy", "Zoe", "Ronald", "Hannah", "Jason", "Lillian",
  "Edward", "Addison", "Jeffrey", "Aubrey", "Ryan", "Eleanor", "Jacob", "Stella",
  "Gary", "Nora", "Nicholas", "Maya", "Eric", "Willow", "Jonathan", "Lucy",
  "Stephen", "Paisley", "Larry", "Daniel", "Justin", "Anna", "Scott", "Caroline",
  "Brandon", "Nova", "Benjamin", "Genesis", "Samuel", "Aaliyah", "Frank", "Kennedy",
  "Gregory", "Kinsley", "Raymond", "Allison", "Alexander", "Patrick", "Jack", "Savannah",
  "Dennis", "Audrey", "Jerry", "Brooklyn", "Tyler", "Claire", "Aaron", "Skylar",
  "Jose", "Henry", "Adam", "Everly", "Douglas", "Nathan", "Zachary", "Kyle",
  "Noah", "Ethan", "Jeremy", "Hunter", "Christian",
  
  // Hispanic/Latino
  "Carlos", "Maria", "Juan", "Ana", "Luis", "Carmen", "Miguel", "Rosa",
  "Francisco", "Laura", "Antonio", "Patricia", "Manuel", "Guadalupe", "Pedro", "Monica",
  "Ricardo", "Fernanda", "Roberto", "Valentina", "Fernando", "Sofia", "Daniel", "Camila",
  "Alejandro", "Andrea", "Javier", "Daniela", "Rafael", "Mariana", "Diego", "Gabriela",
  "Sergio", "Natalia", "Eduardo", "Paola", "Andres", "Alejandra", "Oscar", "Lucia",
  "Mario", "Elena", "Alberto", "Claudia", "Raul", "Adriana", "Victor", "Cristina",
  "Enrique", "Diana", "Jorge", "Beatriz", "Pablo", "Veronica",
  
  // Asian (Chinese)
  "Wei", "Li", "Zhang", "Wang", "Chen", "Liu", "Yang", "Huang",
  "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu",
  "Guo", "He", "Gao", "Lin", "Luo", "Song", "Zheng", "Liang",
  "Xie", "Tang", "Han", "Feng", "Deng", "Cao", "Peng", "Zeng",
  "Yuan", "Tian", "Qian", "Dai", "Jiang", "Fan", "Fang", "Shi",
  "Yao", "Shen", "Yu", "Lu", "Jin", "Pan",
  
  // Asian (Japanese)
  "Hiroshi", "Yuki", "Takeshi", "Sakura", "Kenji", "Akiko", "Ryota", "Emiko",
  "Daiki", "Mei", "Kenta", "Yui", "Satoshi", "Aiko", "Taro", "Hana",
  "Shinji", "Mika", "Kazuki", "Nana", "Ryo", "Miyuki", "Yuto", "Saki",
  "Haruto", "Yuna", "Ren", "Mio", "Sora", "Rin", "Kaito", "Hinata",
  "Soma", "Aoi", "Hayato", "Koharu", "Minato", "Nanami",
  
  // Asian (Korean)
  "Min-jun", "Soo-jin", "Ji-hoon", "Hae-won", "Seung-ho", "Ji-woo", "Hyun-woo", "Seo-yeon",
  "Jin-woo", "Yeon-woo", "Tae-hyun", "Min-seo", "Dong-hyun", "Ji-eun", "Sang-min", "Eun-ji",
  "Jun-seo", "Ha-eun", "Min-hyuk", "So-min", "Woo-jin", "Chae-won", "Seo-jun", "Yoo-jin",
  "Hyeon-woo", "Seo-hyun", "Ji-min", "Na-yeon", "Tae-min", "Ga-eul", "Seung-min", "Da-eun",
  
  // Asian (Indian)
  "Arjun", "Priya", "Rohan", "Ananya", "Vikram", "Kavya", "Aditya", "Isha",
  "Rahul", "Meera", "Karan", "Sneha", "Aryan", "Divya", "Raj", "Pooja",
  "Siddharth", "Anjali", "Vishal", "Riya", "Nikhil", "Shreya", "Aman", "Neha",
  "Ravi", "Kritika", "Suresh", "Deepika", "Mohan", "Swati", "Gaurav", "Tanvi",
  "Varun", "Aditi", "Harsh", "Nisha", "Vhesvek", "Radha", "Kunal", "Pallavi",
  
  // Middle Eastern
  "Ahmed", "Fatima", "Mohammed", "Aisha", "Ali", "Zainab", "Hassan", "Mariam",
  "Omar", "Layla", "Yusuf", "Amina", "Ibrahim", "Sara", "Khalid", "Noor",
  "Muhammad", "Hana", "Zain", "Zara", "Amir", "Leila", "Malik", "Yasmin",
  "Rashid", "Salma", "Karim", "Dina", "Nabil", "Rania", "Fadi", "Lina",
  "Samir", "Nadia", "Bilal", "Mona", "Jamal", "Rana", "Hala",
  
  // African
  "Kwame", "Amina", "Kofi", "Zara", "Jabari", "Nia", "Jide", "Zuri",
  "Tendai", "Amara", "Jengo", "Oba", "Zola", "Imani", "Kiano", "Ayanna",
  "Thabo", "Nala", "Kamau", "Zendaya", "Amani", "Kira", "Jafari",
  "Zaire", "Kendrick", "Tariq", "Jabari", "Kofi", "Jengo",
  
  // Southeast Asian
  "Aqil", "Sari", "Muhammad", "Dewi", "Putra", "Indah", "Wahyu", "Siti",
  "Ahmad", "Ratna", "Hadi", "Lestari", "Rizki", "Maya", "Dedi", "Nina",
  "Andi", "Rina", "Daud", "Sinta", "Yusuf", "Diana", "Syarif", "Linda",
  "Tono", "Rita", "Joko", "Ari", "Bayu", "Nur",
  
  // Filipino
  "Juan", "Maria", "Jose", "Ana", "Carlos", "Rosa", "Miguel", "Carmen",
  "Antonio", "Patricia", "Marvin", "Guadalupe", "Roberto", "Monica", "Fernando", "Isabella",
  "Ricardo", "Fernanda", "Daniel", "Valentina", "Alejandro", "Sofia", "Javier", "Camila",
  "Rafael", "Andrea", "Diego", "Daniela", "Sergio", "Mariana", "Eduardo", "Gabriela",
  
  // Thai
  "Somchai", "Niran", "Prasert", "Suda", "Somsak", "Wanida", "Chai", "Siriporn",
  "Suthep", "Naree", "Anan", "Pornthip", "Sakchai", "Supaporn", "Wichai", "Jintana",
  "Narong", "Prasit", "Somsri"
];

// Random usernames (mix of patterns)
const RANDOM_USERNAMES = [
    "throwaway_48721",
    "justPassingBy",
    "wifiOnPlane",
    "nomadAF",
    "lostInTransit",
    "plsDontTrackMe",
    "idkMan42",
    "actuallyHelpful",
    "workedForMe",
    "noIssuesHere",
  
    "404username",
    "signalWasFine",
    "landingAt3am",
    "batteryLowAgain",
    "airportCoffee",
    "oneBagOnly",
    "seat39B",
    "checkedBagsSuck",
    "offlineIsPain",
    "customsLine",
  
    "whySoSlow",
    "surprisinglyGood",
    "notSponsored",
    "skepticalAtFirst",
    "worthItIMO",
    "noRegretsTBH",
    "wouldBuyAgain",
    "cheapButWorks",
    "asAdvertised",
    "finallyOnline",
  
    "randomHuman93",
    "user_178392",
    "anotherInternetGuy",
    "somebodyElse",
    "anonTraveller",
    "probablyABot",
    "trustIssues",
    "lowExpectations",
    "pleasantlySurprised",
    "mehItsFine",
  
    "midnightPurchase",
    "usedOnce",
    "workedAbroad",
    "didTheJob",
    "quickSetup",
    "noComplaintsHere",
    "notTechy",
    "parentsApproved",
    "travelBrain",
    "jetlaggedUser"
  ];  

// Generic labels (for remaining 20%)
const GENERIC_LABELS = [
  "Traveler",
  "Customer",
  "User",
  "Guest",
  "Anonymous",
  "",
  "",
  ""
];

const LONG_REVIEWS_EN = [
  "activated instantly when I landed the speed was consistently good throughout my trip much cheaper than my carrier's roaming plan",
  "I was worried about setting it up, but the instructions were clear scanned the QR code and it just worked will definitely use again",
  "used this for a 2-week trip to Japan signal was strong even in rural areas the unlimited data came in handy for maps and social media",
  "great alternative to physical SIM cards no need to swap cards at the airport price is unbeatable compared to other providers I checked",
  "had a small issue with activation but support helped me sort it out quickly via email after that, smooth sailing good customer service",
  "comparing this to Airalo, the prices are better here connection quality seems exactly the same since they use local networks",
  "the data speed was decent not 5G everywhere but solid 4G which is enough for everything I needed Google Maps loaded instantly",
  "highly recommend for anyone traveling it's so much more convenient than hunting for a SIM card shop at the airport after a long flight",
  "worked perfectly from day one used it across multiple countries in Europe and never had any connectivity issues the setup was super simple",
  "I travel a lot for work and this has been a game changer no more expensive roaming charges or hunting for local SIM cards at airports",
  "the signal strength was impressive even in remote areas I was able to video call my family back home without any lag or drops",
  "initially skeptical about eSIMs but this changed my mind completely seamless activation and the data speeds were better than my home WiFi",
  "spent 3 weeks in Asia and this eSIM worked flawlessly in every country I visited saved me hundreds compared to my usual roaming costs",
  "customer support was responsive when I had a question about activation they replied within an hour and helped me resolve it quickly",
  "the unlimited plan was perfect for my needs I streamed videos, used maps constantly, and never had to worry about running out of data",
  "setup took less than 5 minutes just scanned the QR code and I was online immediately much easier than I expected",
  "used this during a business trip and it was reliable for video conferences and file uploads no interruptions or quality issues",
  "the price point is unbeatable I compared with several other providers and this was significantly cheaper for the same data allowance",
  "worked great in both urban and rural areas I was surprised by how strong the signal was even in the countryside",
  "I'm not very tech-savvy but the installation process was straightforward the instructions were clear and easy to follow",
  "the connection was stable throughout my entire trip no random disconnections or slow periods even during peak usage times",
  "this is my second time using this service and it's been consistent both times reliable, affordable, and exactly what I need for travel",
  "the data speeds were fast enough for everything I needed including streaming music, using social media, and video calls",
  "I appreciated that I could activate it before leaving home so I had internet as soon as I landed no waiting at the airport",
  "great value for money especially compared to what my carrier charges for international roaming saved me over $100 on this trip alone",
  "the internet speed was absolutely incredible I was streaming 4K videos without any buffering even in remote mountain areas",
  "customer support team is phenomenal they helped me troubleshoot a minor issue at 2am and resolved it within 15 minutes",
  "connection speeds are consistently fast I did multiple video calls for work and the quality was crystal clear throughout",
  "support responded to my email within 30 minutes and provided step-by-step guidance that solved my activation problem immediately",
  "the service quality is outstanding I've used many eSIM providers and this one has the fastest speeds and most reliable connection",
  "data speeds are lightning fast I downloaded large files in seconds and streamed HD content without any interruptions",
  "customer service is top tier they're knowledgeable, friendly, and always ready to help with any questions or concerns",
  "the connection speed exceeded all my expectations I was able to work remotely with video calls and file transfers seamlessly",
  "support team went above and beyond when I had questions they provided detailed explanations and made sure I understood everything",
  "internet speeds are consistently excellent I never experienced slowdowns even during peak hours in busy tourist areas",
  "the customer support experience was amazing they responded quickly and helped me set everything up perfectly on my first try",
  "data speeds are impressively fast I could stream music, browse social media, and use navigation apps simultaneously without lag",
  "service quality is exceptional the connection is always stable and fast making it perfect for both work and leisure activities",
  "support staff is incredibly helpful and professional they answered all my questions and made the whole process stress-free",
  "the speed is remarkable I was able to upload photos and videos instantly and video calls were smooth and clear",
  "customer service is outstanding they're available 24/7 and always provide quick, accurate solutions to any issues that arise"
];

// Medium length reviews (between short and long)
const MEDIUM_REVIEWS_EN = [
  "worked great during my trip to Europe no issues with connectivity and the price was much better than roaming",
  "easy setup process took maybe 2 minutes and I was online immediately would definitely use this again",
  "signal was strong throughout my stay in Tokyo used it for maps and social media without any problems",
  "cheaper than buying a local SIM card and way more convenient activated before I left home",
  "the data speeds were good enough for video calls and streaming didn't experience any lag or buffering",
  "customer service responded quickly when I had a question about my plan very helpful and friendly",
  "used this for a week in Singapore and it worked perfectly everywhere I went strong signal even underground",
  "the unlimited plan was perfect for my needs never had to worry about running out of data",
  "setup was straightforward just scanned the QR code and followed the instructions no technical knowledge needed",
  "much better value than my carrier's international plan saved me over $50 on this trip alone",
  "connection was stable the entire time no random disconnections or slow periods during my 2 week trip",
  "worked in multiple countries seamlessly didn't need to change anything when crossing borders",
  "the activation email came quickly and the instructions were clear made the whole process stress-free",
  "data speeds were consistent whether I was in the city center or more remote areas",
  "appreciated being able to activate before leaving so I had internet as soon as I landed",
  "used it for work calls and video conferences and it performed well no quality issues",
  "the price point is really competitive compared to other eSIM providers I've tried",
  "signal strength was impressive even in areas where my phone normally struggles",
  "simple installation process that even someone not tech-savvy could handle easily",
  "reliable connection throughout my entire vacation never had to worry about losing internet access",
  "connection speeds are blazing fast I streamed movies and made video calls without any quality issues",
  "customer support is excellent they responded within minutes and helped me resolve my question immediately",
  "data speeds are consistently impressive I never experienced any slowdowns even during heavy usage",
  "support team is fantastic they provided clear instructions and made sure everything worked perfectly",
  "internet speed is outstanding I downloaded large files quickly and streamed content without buffering",
  "customer service is top notch they're professional, friendly, and always ready to assist",
  "connection speed exceeded my expectations I could do everything I needed without any delays",
  "support responded quickly to my inquiry and provided helpful solutions that worked right away",
  "data speeds are excellent I used multiple apps simultaneously and everything loaded instantly",
  "service quality is remarkable the connection is fast, stable, and reliable everywhere I went",
  "customer support is outstanding they helped me understand the setup process and answered all questions",
  "internet speeds are consistently fast I streamed videos and made calls without any interruptions",
  "support team is very responsive they got back to me quickly and solved my issue efficiently",
  "connection speed is impressive I was able to work remotely with video conferences and file sharing",
  "data speeds are great I never had to wait for pages to load or videos to buffer",
  "customer service is excellent they're knowledgeable and always provide helpful guidance",
  "internet speed is fantastic I could do everything I needed without experiencing any lag",
  "support staff is amazing they made the entire process easy and stress-free",
  "connection speeds are consistently excellent making it perfect for all my online activities"
];

const MEDIUM_REVIEWS_ES = [
  "funcionó muy bien durante mi viaje a Europa sin problemas de conectividad y el precio fue mucho mejor que el roaming",
  "proceso de configuración fácil tomó quizás 2 minutos y estaba en línea inmediatamente definitivamente lo usaría de nuevo",
  "la señal fue fuerte durante toda mi estancia en Tokio lo usé para mapas y redes sociales sin ningún problema",
  "más barato que comprar una tarjeta SIM local y mucho más conveniente activado antes de salir de casa",
  "las velocidades de datos fueron lo suficientemente buenas para videollamadas y transmisión no experimenté retrasos ni buffering",
  "el servicio al cliente respondió rápidamente cuando tuve una pregunta sobre mi plan muy útil y amable",
  "lo usé durante una semana en Singapur y funcionó perfectamente en todas partes donde fui señal fuerte incluso bajo tierra",
  "el plan ilimitado fue perfecto para mis necesidades nunca tuve que preocuparme por quedarme sin datos",
  "la configuración fue sencilla solo escaneé el código QR y seguí las instrucciones no se necesita conocimiento técnico",
  "mucho mejor valor que el plan internacional de mi operador me ahorré más de $50 solo en este viaje",
  "la conexión fue estable todo el tiempo sin desconexiones aleatorias o períodos lentos durante mi viaje de 2 semanas",
  "funcionó en múltiples países sin problemas no necesité cambiar nada al cruzar fronteras",
  "el correo de activación llegó rápidamente y las instrucciones fueron claras hicieron todo el proceso sin estrés",
  "las velocidades de datos fueron consistentes ya fuera en el centro de la ciudad o en áreas más remotas",
  "aprecié poder activar antes de salir para tener internet tan pronto como aterricé",
  "lo usé para llamadas de trabajo y videoconferencias y funcionó bien sin problemas de calidad",
  "el precio es realmente competitivo comparado con otros proveedores de eSIM que he probado",
  "la fuerza de la señal fue impresionante incluso en áreas donde mi teléfono normalmente tiene problemas",
  "proceso de instalación simple que incluso alguien no experto en tecnología podría manejar fácilmente",
  "conexión confiable durante todas mis vacaciones nunca tuve que preocuparme por perder el acceso a internet",
  "las velocidades de conexión son extremadamente rápidas transmití películas e hice videollamadas sin problemas de calidad",
  "el soporte al cliente es excelente respondieron en minutos y me ayudaron a resolver mi pregunta inmediatamente",
  "las velocidades de datos son consistentemente impresionantes nunca experimenté ralentizaciones ni siquiera con uso intenso",
  "el equipo de soporte es fantástico proporcionaron instrucciones claras y se aseguraron de que todo funcionara perfectamente",
  "la velocidad de internet es sobresaliente descargué archivos grandes rápidamente y transmití contenido sin buffering",
  "el servicio al cliente es de primera clase son profesionales, amigables y siempre listos para ayudar",
  "la velocidad de conexión superó mis expectativas pude hacer todo lo que necesitaba sin retrasos",
  "el soporte respondió rápidamente a mi consulta y proporcionó soluciones útiles que funcionaron de inmediato",
  "las velocidades de datos son excelentes usé múltiples aplicaciones simultáneamente y todo se cargó instantáneamente",
  "la calidad del servicio es notable la conexión es rápida, estable y confiable en todas partes donde fui",
  "el soporte al cliente es sobresaliente me ayudaron a entender el proceso de configuración y respondieron todas las preguntas",
  "las velocidades de internet son consistentemente rápidas transmití videos e hice llamadas sin interrupciones",
  "el equipo de soporte es muy receptivo me respondieron rápidamente y resolvieron mi problema de manera eficiente",
  "la velocidad de conexión es impresionante pude trabajar remotamente con videoconferencias y compartir archivos",
  "las velocidades de datos son geniales nunca tuve que esperar a que las páginas se cargaran o los videos se bufferizaran",
  "el servicio al cliente es excelente son conocedores y siempre proporcionan orientación útil",
  "la velocidad de internet es fantástica pude hacer todo lo que necesitaba sin experimentar ningún retraso",
  "el personal de soporte es increíble hicieron todo el proceso fácil y sin estrés",
  "las velocidades de conexión son consistentemente excelentes perfectas para todas mis actividades en línea"
];

const LONG_REVIEWS_ES = [
  "se activó al instante cuando aterricé la velocidad fue buena durante todo el viaje mucho más barato que el roaming de mi operador",
  "tenía dudas sobre la configuración, pero las instrucciones eran claras escaneé el código QR y funcionó definitivamente lo usaré de nuevo",
  "usé esto para un viaje de 2 semanas la señal era fuerte incluso en áreas rurales los datos ilimitados fueron muy útiles",
  "gran alternativa a las tarjetas SIM físicas no hay necesidad de cambiar tarjetas en el aeropuerto el precio es inmejorable",
  "funcionó perfectamente desde el primer día lo usé en varios países de Europa y nunca tuve problemas de conectividad la configuración fue súper simple",
  "viajo mucho por trabajo y esto ha sido un cambio total no más cargos caros de roaming ni buscar tarjetas SIM locales en aeropuertos",
  "la fuerza de la señal fue impresionante incluso en áreas remotas pude hacer videollamadas a mi familia sin retrasos ni cortes",
  "al principio escéptico sobre los eSIMs pero esto cambió mi opinión completamente activación sin problemas y las velocidades fueron mejores que mi WiFi de casa",
  "pasé 3 semanas en Asia y este eSIM funcionó perfectamente en todos los países que visité me ahorré cientos comparado con mis costos de roaming habituales",
  "el soporte al cliente fue rápido cuando tuve una pregunta sobre la activación respondieron en una hora y me ayudaron a resolverlo rápidamente",
  "el plan ilimitado fue perfecto para mis necesidades transmití videos, usé mapas constantemente y nunca tuve que preocuparme por quedarme sin datos",
  "la configuración tomó menos de 5 minutos solo escaneé el código QR y estaba en línea inmediatamente mucho más fácil de lo que esperaba",
  "lo usé durante un viaje de negocios y fue confiable para videoconferencias y carga de archivos sin interrupciones ni problemas de calidad",
  "el precio es inmejorable comparé con varios otros proveedores y esto fue significativamente más barato por la misma cantidad de datos",
  "funcionó bien tanto en áreas urbanas como rurales me sorprendió lo fuerte que era la señal incluso en el campo",
  "no soy muy experto en tecnología pero el proceso de instalación fue sencillo las instrucciones fueron claras y fáciles de seguir",
  "la conexión fue estable durante todo mi viaje sin desconexiones aleatorias ni períodos lentos incluso durante horas pico de uso",
  "esta es la segunda vez que uso este servicio y ha sido consistente ambas veces confiable, asequible y exactamente lo que necesito para viajar",
  "la velocidad de internet es increíble pude transmitir videos en alta calidad sin interrupciones incluso en zonas remotas",
  "el equipo de soporte al cliente es excepcional me ayudaron a resolver un problema menor en minutos y fueron muy amables",
  "las velocidades de conexión son consistentemente rápidas hice varias videollamadas de trabajo y la calidad fue perfecta",
  "el soporte respondió a mi correo en menos de 30 minutos y me dio instrucciones claras que solucionaron mi problema de inmediato",
  "la calidad del servicio es sobresaliente he usado muchos proveedores de eSIM y este tiene las velocidades más rápidas",
  "las velocidades de datos son impresionantes descargué archivos grandes en segundos y transmití contenido HD sin problemas",
  "el servicio al cliente es de primera clase son conocedores, amigables y siempre dispuestos a ayudar con cualquier pregunta",
  "la velocidad de conexión superó todas mis expectativas pude trabajar remotamente con videollamadas y transferencias de archivos",
  "el equipo de soporte fue más allá cuando tuve preguntas proporcionaron explicaciones detalladas y se aseguraron de que entendiera todo",
  "las velocidades de internet son consistentemente excelentes nunca experimenté ralentizaciones ni siquiera en horas pico",
  "la experiencia de soporte al cliente fue increíble respondieron rápidamente y me ayudaron a configurar todo perfectamente",
  "las velocidades de datos son notablemente rápidas pude transmitir música, navegar en redes sociales y usar aplicaciones de navegación simultáneamente",
  "la calidad del servicio es excepcional la conexión es siempre estable y rápida perfecta para trabajo y actividades de ocio",
  "el personal de soporte es increíblemente útil y profesional respondieron todas mis preguntas y hicieron todo el proceso sin estrés",
  "la velocidad es notable pude subir fotos y videos instantáneamente y las videollamadas fueron fluidas y claras",
  "el servicio al cliente es sobresaliente están disponibles 24/7 y siempre proporcionan soluciones rápidas y precisas"
];

// Helper to get random item from array
const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Seeded random number generator to ensure consistent results across renders
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateReviews(count: number = 3240): ReviewData[] {
  const reviews: ReviewData[] = [];
  const now = new Date();
  
  // Track used medium/long reviews to prevent duplicates
  const usedMediumLongReviews = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    // Deterministic randomness based on index
    const rand = seededRandom(i); 
    
    // Distribution Logic
    // ~75% Star only
    // ~15% Short text
    // ~5% Long text
    // ~5% Low ratings (mostly star only or short)
    
    let rating = 5;
    let hasText = false;
    let text = "";
    let language = "en";
    let isMediumOrLong = false;
    
    // Determine Rating
    // Distribution: ~82% 5 stars, ~7% 4 stars, ~4% 3 stars, ~4% 2 stars, ~3% 1 star
    if (rand > 0.93) rating = 4;      // 7% 4 stars (0.93-1.0)
    else if (rand > 0.89) rating = 3; // 4% 3 stars (0.89-0.93)
    else if (rand > 0.85) rating = 2; // 4% 2 stars (0.85-0.89)
    else if (rand > 0.82) rating = 1; // 3% 1 star (0.82-0.85)
    else rating = 5;                  // ~82% 5 stars (0-0.82)

    // Determine Type
    const typeRand = seededRandom(i + 1000);
    
    if (typeRand < 0.75) {
      // Star only (75%)
      hasText = false;
    } else if (typeRand < 0.90) {
      // Short text (15%) - can repeat
      hasText = true;
      isMediumOrLong = false;
      // Select language with expanded distribution
      const langRand = seededRandom(i + 2000);
      if (langRand < 0.30) {
        language = "en";
        text = sample(SHORT_REVIEWS_EN);
      } else if (langRand < 0.40) {
        language = "zh";
        text = sample(SHORT_REVIEWS_ZH);
      } else if (langRand < 0.48) {
        language = "ja";
        text = sample(SHORT_REVIEWS_JA);
      } else if (langRand < 0.54) {
        language = "es";
        text = sample(SHORT_REVIEWS_ES);
      } else if (langRand < 0.60) {
        language = "ar";
        text = sample(SHORT_REVIEWS_AR);
      } else if (langRand < 0.65) {
        language = "th";
        text = sample(SHORT_REVIEWS_TH);
      } else if (langRand < 0.70) {
        language = "id";
        text = sample(SHORT_REVIEWS_ID);
      } else if (langRand < 0.75) {
        language = "vi";
        text = sample(SHORT_REVIEWS_VI);
      } else if (langRand < 0.80) {
        language = "tl";
        text = sample(SHORT_REVIEWS_TL);
      } else if (langRand < 0.85) {
        language = "ms";
        text = sample(SHORT_REVIEWS_MS);
      } else if (langRand < 0.90) {
        language = "de";
        text = sample(SHORT_REVIEWS_DE);
      } else if (langRand < 0.95) {
        language = "fr";
        text = sample(SHORT_REVIEWS_FR);
      } else {
        language = "pl";
        text = sample(SHORT_REVIEWS_PL);
      }
    } else if (typeRand < 0.95) {
      // Medium text (5%) - no duplicates
      hasText = true;
      isMediumOrLong = true;
      const langRand = seededRandom(i + 3000);
      let reviewKey = "";
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        if (langRand < 0.7) {
          language = "en";
          text = sample(MEDIUM_REVIEWS_EN);
        } else {
          language = "es";
          text = sample(MEDIUM_REVIEWS_ES);
        }
        reviewKey = `${language}:${text}`;
        attempts++;
      } while (usedMediumLongReviews.has(reviewKey) && attempts < maxAttempts);
      
      if (attempts >= maxAttempts && usedMediumLongReviews.has(reviewKey)) {
        language = "en";
        text = sample(SHORT_REVIEWS_EN);
        isMediumOrLong = false;
      } else {
        usedMediumLongReviews.add(reviewKey);
      }
    } else {
      // Long text (5%) - no duplicates
      hasText = true;
      isMediumOrLong = true;
      const langRand = seededRandom(i + 3000);
      let reviewKey = "";
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        if (langRand < 0.8) {
          language = "en";
          text = sample(LONG_REVIEWS_EN);
        } else {
          language = "es";
          text = sample(LONG_REVIEWS_ES);
        }
        reviewKey = `${language}:${text}`;
        attempts++;
      } while (usedMediumLongReviews.has(reviewKey) && attempts < maxAttempts);
      
      if (attempts >= maxAttempts && usedMediumLongReviews.has(reviewKey)) {
        language = "en";
        text = sample(SHORT_REVIEWS_EN);
        isMediumOrLong = false;
      } else {
        usedMediumLongReviews.add(reviewKey);
      }
    }

    // Override low ratings to have specific complaints
    if (rating <= 2 && hasText) {
      const lowRand = seededRandom(i + 5000);
      if (language === "en" || !language) {
        text = sample(LOW_RATING_REVIEWS_EN);
      } else if (language === "zh") {
        text = sample(LOW_RATING_REVIEWS_ZH);
      } else if (language === "ja") {
        text = sample(LOW_RATING_REVIEWS_JA);
      } else if (language === "ar") {
        text = sample(LOW_RATING_REVIEWS_AR);
      } else {
        // For other languages, use English complaint or generic
        text = sample(LOW_RATING_REVIEWS_EN);
      }
    } else if (rating === 3 && hasText) {
      // 3-star reviews are neutral
      if (language === "en" || !language) {
        text = "Signal was okay but slow in some areas";
      } else {
        text = sample(SHORT_REVIEWS_EN); // Use generic positive text but rating shows it's not perfect
      }
    }
    
    // Select username deterministically
    // Distribution: 50% fake names, 30% random usernames, 20% generic/empty
    const usernameRand = seededRandom(i + 6000);
    let username: string;
    if (usernameRand < 0.5) {
      // 50% fake names
      const nameIndex = Math.floor(seededRandom(i + 7000) * FAKE_NAMES.length);
      username = FAKE_NAMES[nameIndex];
    } else if (usernameRand < 0.8) {
      // 30% random usernames
      const userIndex = Math.floor(seededRandom(i + 8000) * RANDOM_USERNAMES.length);
      username = RANDOM_USERNAMES[userIndex];
    } else {
      // 20% generic labels or empty
      const labelIndex = Math.floor(seededRandom(i + 9000) * GENERIC_LABELS.length);
      username = GENERIC_LABELS[labelIndex];
    }

    // Date generation (spread over last 2 years)
    const daysBack = Math.floor(seededRandom(i + 4000) * 730);
    const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    // All reviews show verified purchase badge
    const isVerified = true;

    reviews.push({
      id: `mock-${i}`,
      rating,
      date,
      comment: hasText ? text : undefined,
      language: hasText ? language : undefined,
      source: i % 10 === 0 ? 'support' : 'purchase', // 10% from support, rest purchase
      verified: isVerified,
      author: username
    });
  }

  // Sort by date (newest first)
  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Determines if a review is medium or long length
 * Medium: 50-150 characters
 * Long: 150+ characters
 */
export function isMediumOrLongReview(review: ReviewData): boolean {
  if (!review.comment) return false;
  const length = review.comment.length;
  return length >= 50; // Medium and long reviews are 50+ characters
}

