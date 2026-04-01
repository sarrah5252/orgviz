// Generate a 120-employee insurance company Excel file
const XLSX = require('xlsx');

const employees = [
  // ═══ C-Suite (Level 0) ═══
  { Name: 'Zahid Mahmood',         Title: 'Chief Executive Officer (CEO)',           ReportsTo: '',                      Client: '—',                    Location: 'Karachi' },
  { Name: 'Nazia Parveen',         Title: 'Chief Operating Officer (COO)',           ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Rehan Ahmed',           Title: 'Chief Financial Officer (CFO)',           ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Sadia Khalil',          Title: 'Chief Technology Officer (CTO)',          ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Lahore' },
  { Name: 'Mansoor Ali Shah',      Title: 'Chief Marketing Officer (CMO)',           ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Dubai' },
  { Name: 'Farhat Javed',          Title: 'Chief Human Resources Officer (CHRO)',    ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Irfan Ul Haq',          Title: 'Chief Risk Officer (CRO)',                ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'KSA' },
  { Name: 'Asma Bashir',           Title: 'Chief Compliance Officer (CCO)',          ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Karachi' },

  // ═══ UNDERWRITING DEPARTMENT ═══
  { Name: 'Tariq Hussain',         Title: 'VP Underwriting',                        ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Amina Bibi',            Title: 'Director — Life Underwriting',           ReportsTo: 'Tariq Hussain',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Waqas Saleem',          Title: 'Director — General Underwriting',        ReportsTo: 'Tariq Hussain',         Client: '—',                    Location: 'Lahore' },
  { Name: 'Bushra Nawaz',          Title: 'Senior Underwriter — Life',              ReportsTo: 'Amina Bibi',            Client: 'National Bank',        Location: 'Karachi' },
  { Name: 'Shoaib Akhtar',         Title: 'Underwriter — Life',                     ReportsTo: 'Amina Bibi',            Client: 'HBL Group',            Location: 'Karachi' },
  { Name: 'Zara Iqbal',            Title: 'Underwriter — Life',                     ReportsTo: 'Amina Bibi',            Client: 'PTCL Corporate',       Location: 'Lahore' },
  { Name: 'Nabeel Khan',           Title: 'Senior Underwriter — General',           ReportsTo: 'Waqas Saleem',          Client: 'Engro Corp',           Location: 'Lahore' },
  { Name: 'Rabia Aslam',           Title: 'Underwriter — Motor',                    ReportsTo: 'Waqas Saleem',          Client: 'Toyota Indus',         Location: 'Lahore' },
  { Name: 'Owais Raza',            Title: 'Underwriter — Property',                 ReportsTo: 'Waqas Saleem',          Client: 'DHA Lahore',           Location: 'Lahore' },
  { Name: 'Hina Shahzadi',         Title: 'Underwriting Assistant',                 ReportsTo: 'Waqas Saleem',          Client: '—',                    Location: 'Karachi' },

  // ═══ CLAIMS DEPARTMENT ═══
  { Name: 'Shahid Mehmood',        Title: 'VP Claims',                              ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Farah Deeba',           Title: 'Director — Life Claims',                 ReportsTo: 'Shahid Mehmood',        Client: '—',                    Location: 'Karachi' },
  { Name: 'Adeel Ashraf',          Title: 'Director — General Claims',              ReportsTo: 'Shahid Mehmood',        Client: '—',                    Location: 'Lahore' },
  { Name: 'Nimra Fatima',          Title: 'Director — Health Claims',               ReportsTo: 'Shahid Mehmood',        Client: '—',                    Location: 'Dubai' },
  { Name: 'Kashif Iqbal',          Title: 'Senior Claims Examiner — Life',          ReportsTo: 'Farah Deeba',           Client: 'National Bank',        Location: 'Karachi' },
  { Name: 'Sobia Arshad',          Title: 'Claims Examiner — Life',                 ReportsTo: 'Farah Deeba',           Client: 'UBL Group',            Location: 'Karachi' },
  { Name: 'Junaid Akhtar',         Title: 'Claims Processor — Life',                ReportsTo: 'Farah Deeba',           Client: 'HBL Group',            Location: 'Lahore' },
  { Name: 'Arooj Zahra',           Title: 'Senior Claims Adjuster — General',       ReportsTo: 'Adeel Ashraf',          Client: 'Pak Suzuki',           Location: 'Lahore' },
  { Name: 'Rizwan Shah',           Title: 'Claims Adjuster — Motor',                ReportsTo: 'Adeel Ashraf',          Client: 'Honda Atlas',          Location: 'Lahore' },
  { Name: 'Kiran Bano',            Title: 'Claims Adjuster — Property',             ReportsTo: 'Adeel Ashraf',          Client: 'DHA Islamabad',        Location: 'Lahore' },
  { Name: 'Taimoor Raza',          Title: 'Health Claims Analyst',                  ReportsTo: 'Nimra Fatima',          Client: 'ADNOC',                Location: 'Dubai' },
  { Name: 'Madiha Kanwal',         Title: 'Health Claims Processor',                ReportsTo: 'Nimra Fatima',          Client: 'Emirates Group',       Location: 'Dubai' },
  { Name: 'Faizan Ali',            Title: 'Claims Support Coordinator',             ReportsTo: 'Nimra Fatima',          Client: 'Aramco',               Location: 'KSA' },

  // ═══ SALES & DISTRIBUTION ═══
  { Name: 'Imran Haider',          Title: 'VP Sales & Distribution',                ReportsTo: 'Mansoor Ali Shah',      Client: '—',                    Location: 'Karachi' },
  { Name: 'Sanam Baloch',          Title: 'Director — Corporate Sales',             ReportsTo: 'Imran Haider',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Fawad Alam',            Title: 'Director — Retail Sales',                ReportsTo: 'Imran Haider',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Mahrukh Shah',          Title: 'Director — Bancassurance',               ReportsTo: 'Imran Haider',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Talha Siddiqui',        Title: 'Regional Manager — Sindh',               ReportsTo: 'Sanam Baloch',          Client: 'Lucky Cement',         Location: 'Karachi' },
  { Name: 'Sundas Noor',           Title: 'Senior Account Manager',                 ReportsTo: 'Sanam Baloch',          Client: 'K-Electric',           Location: 'Karachi' },
  { Name: 'Ahsan Raza',            Title: 'Corporate Account Executive',            ReportsTo: 'Sanam Baloch',          Client: 'Engro Corp',           Location: 'Karachi' },
  { Name: 'Noman Ahmed',           Title: 'Account Executive',                      ReportsTo: 'Sanam Baloch',          Client: 'PSO',                  Location: 'Karachi' },
  { Name: 'Ayesha Siddiqua',       Title: 'Regional Manager — Punjab',              ReportsTo: 'Fawad Alam',            Client: 'Nestle PK',            Location: 'Lahore' },
  { Name: 'Hamza Tariq',           Title: 'Senior Sales Officer',                   ReportsTo: 'Fawad Alam',            Client: 'Packages Ltd',         Location: 'Lahore' },
  { Name: 'Saman Javed',           Title: 'Sales Officer',                          ReportsTo: 'Fawad Alam',            Client: 'Interwood',            Location: 'Lahore' },
  { Name: 'Umar Farooq',           Title: 'Bancassurance Manager — HBL',            ReportsTo: 'Mahrukh Shah',          Client: 'HBL Group',            Location: 'Karachi' },
  { Name: 'Mehreen Akhtar',        Title: 'Bancassurance Manager — UBL',            ReportsTo: 'Mahrukh Shah',          Client: 'UBL Group',            Location: 'Karachi' },
  { Name: 'Bilal Hasnain',         Title: 'Bancassurance Coordinator',              ReportsTo: 'Mahrukh Shah',          Client: 'MCB Bank',             Location: 'Lahore' },

  // ═══ ACTUARIAL DEPARTMENT ═══
  { Name: 'Dr. Amir Saeed',        Title: 'VP Actuarial',                           ReportsTo: 'Rehan Ahmed',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Lubna Rafiq',           Title: 'Chief Actuary — Life',                   ReportsTo: 'Dr. Amir Saeed',        Client: '—',                    Location: 'Karachi' },
  { Name: 'Asad Mehmood',          Title: 'Chief Actuary — General',                ReportsTo: 'Dr. Amir Saeed',        Client: '—',                    Location: 'Lahore' },
  { Name: 'Fatima Noor',           Title: 'Senior Actuary',                         ReportsTo: 'Lubna Rafiq',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Sameer Qureshi',        Title: 'Actuary — Pricing',                     ReportsTo: 'Lubna Rafiq',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Anum Sheikh',           Title: 'Actuarial Analyst',                      ReportsTo: 'Lubna Rafiq',           Client: '—',                    Location: 'Lahore' },
  { Name: 'Yasir Abbas',           Title: 'Senior Actuary — P&C',                  ReportsTo: 'Asad Mehmood',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Misbah Aslam',          Title: 'Actuarial Analyst — Reserving',          ReportsTo: 'Asad Mehmood',          Client: '—',                    Location: 'Lahore' },

  // ═══ FINANCE & ACCOUNTING ═══
  { Name: 'Naeem Uddin',           Title: 'VP Finance',                             ReportsTo: 'Rehan Ahmed',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Shazia Parveen',        Title: 'Director — Financial Reporting',         ReportsTo: 'Naeem Uddin',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Kamran Zafar',          Title: 'Director — Treasury',                    ReportsTo: 'Naeem Uddin',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Nida Hassan',           Title: 'Senior Accountant',                      ReportsTo: 'Shazia Parveen',        Client: '—',                    Location: 'Karachi' },
  { Name: 'Arif Hussain',          Title: 'Financial Analyst',                      ReportsTo: 'Shazia Parveen',        Client: '—',                    Location: 'Lahore' },
  { Name: 'Sadia Batool',          Title: 'Accounts Payable Officer',               ReportsTo: 'Shazia Parveen',        Client: '—',                    Location: 'Karachi' },
  { Name: 'Danish Mirza',          Title: 'Treasury Analyst',                       ReportsTo: 'Kamran Zafar',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Uzma Shaheen',          Title: 'Investment Analyst',                     ReportsTo: 'Kamran Zafar',          Client: '—',                    Location: 'Karachi' },

  // ═══ INFORMATION TECHNOLOGY ═══
  { Name: 'Hassan Nawaz',          Title: 'VP Information Technology',               ReportsTo: 'Sadia Khalil',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Maria Sultan',          Title: 'Director — Software Development',        ReportsTo: 'Hassan Nawaz',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Zubair Ahmed',          Title: 'Director — IT Infrastructure',           ReportsTo: 'Hassan Nawaz',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Ayesha Latif',          Title: 'Director — Data & Analytics',            ReportsTo: 'Hassan Nawaz',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Ali Raza',              Title: 'Lead Software Engineer',                 ReportsTo: 'Maria Sultan',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Huma Akram',            Title: 'Senior Full-Stack Developer',            ReportsTo: 'Maria Sultan',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Waheed Murad',          Title: 'Full-Stack Developer',                   ReportsTo: 'Maria Sultan',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Sana Mir',              Title: 'QA Lead',                                ReportsTo: 'Maria Sultan',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Qasim Shah',            Title: 'QA Engineer',                            ReportsTo: 'Sana Mir',              Client: '—',                    Location: 'Karachi' },
  { Name: 'Fahad Rana',            Title: 'Systems Administrator',                  ReportsTo: 'Zubair Ahmed',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Nosheen Amir',          Title: 'Network Engineer',                       ReportsTo: 'Zubair Ahmed',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Atif Butt',             Title: 'Cybersecurity Analyst',                  ReportsTo: 'Zubair Ahmed',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Saima Akbar',           Title: 'Senior Data Analyst',                    ReportsTo: 'Ayesha Latif',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Naveed Iqbal',          Title: 'Data Engineer',                          ReportsTo: 'Ayesha Latif',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Rida Zaidi',            Title: 'BI Developer',                           ReportsTo: 'Ayesha Latif',          Client: '—',                    Location: 'Karachi' },

  // ═══ HUMAN RESOURCES ═══
  { Name: 'Naila Rauf',            Title: 'VP Human Resources',                     ReportsTo: 'Farhat Javed',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Shafiq Ur Rehman',      Title: 'Director — Talent Acquisition',          ReportsTo: 'Naila Rauf',            Client: '—',                    Location: 'Karachi' },
  { Name: 'Ambreen Fatima',        Title: 'Director — Learning & Development',      ReportsTo: 'Naila Rauf',            Client: '—',                    Location: 'Lahore' },
  { Name: 'Omer Hayat',            Title: 'Director — Compensation & Benefits',     ReportsTo: 'Naila Rauf',            Client: '—',                    Location: 'Karachi' },
  { Name: 'Saira Bano',            Title: 'Senior Recruiter',                       ReportsTo: 'Shafiq Ur Rehman',      Client: '—',                    Location: 'Karachi' },
  { Name: 'Furqan Hashmi',         Title: 'Talent Acquisition Specialist',          ReportsTo: 'Shafiq Ur Rehman',      Client: '—',                    Location: 'Lahore' },
  { Name: 'Zainab Malik',          Title: 'Training Manager',                       ReportsTo: 'Ambreen Fatima',        Client: '—',                    Location: 'Lahore' },
  { Name: 'Dawood Khan',           Title: 'L&D Coordinator',                        ReportsTo: 'Ambreen Fatima',        Client: '—',                    Location: 'Lahore' },
  { Name: 'Iram Shahzadi',         Title: 'Payroll Manager',                        ReportsTo: 'Omer Hayat',            Client: '—',                    Location: 'Karachi' },
  { Name: 'Sajid Awan',            Title: 'Benefits Administrator',                 ReportsTo: 'Omer Hayat',            Client: '—',                    Location: 'Karachi' },

  // ═══ RISK MANAGEMENT ═══
  { Name: 'Khalid Mehmood',        Title: 'VP Risk Management',                     ReportsTo: 'Irfan Ul Haq',          Client: '—',                    Location: 'KSA' },
  { Name: 'Rukhsana Bibi',         Title: 'Director — Enterprise Risk',             ReportsTo: 'Khalid Mehmood',        Client: '—',                    Location: 'KSA' },
  { Name: 'Mudassar Iqbal',        Title: 'Director — Reinsurance',                 ReportsTo: 'Khalid Mehmood',        Client: '—',                    Location: 'Dubai' },
  { Name: 'Tahira Sultana',        Title: 'Senior Risk Analyst',                    ReportsTo: 'Rukhsana Bibi',         Client: 'Aramco',               Location: 'KSA' },
  { Name: 'Shakeel Ahmed',         Title: 'Risk Analyst',                           ReportsTo: 'Rukhsana Bibi',         Client: 'SABIC',                Location: 'KSA' },
  { Name: 'Anam Zahra',            Title: 'Risk Assessment Officer',                ReportsTo: 'Rukhsana Bibi',         Client: 'STC',                  Location: 'KSA' },
  { Name: 'Faisal Nawaz',          Title: 'Reinsurance Manager',                    ReportsTo: 'Mudassar Iqbal',        Client: 'Swiss Re',             Location: 'Dubai' },
  { Name: 'Haleema Sadia',         Title: 'Reinsurance Analyst',                    ReportsTo: 'Mudassar Iqbal',        Client: 'Munich Re',            Location: 'Dubai' },

  // ═══ COMPLIANCE & LEGAL ═══
  { Name: 'Advocate Pervez',       Title: 'VP Legal & Compliance',                  ReportsTo: 'Asma Bashir',           Client: '—',                    Location: 'Karachi' },
  { Name: 'Sadaf Naz',             Title: 'Director — Regulatory Compliance',       ReportsTo: 'Advocate Pervez',       Client: '—',                    Location: 'Karachi' },
  { Name: 'Babar Azam',            Title: 'Director — Legal Affairs',               ReportsTo: 'Advocate Pervez',       Client: '—',                    Location: 'Lahore' },
  { Name: 'Komal Rizvi',           Title: 'Compliance Officer',                     ReportsTo: 'Sadaf Naz',             Client: 'SECP',                 Location: 'Karachi' },
  { Name: 'Wajid Ali',             Title: 'AML/KYC Analyst',                        ReportsTo: 'Sadaf Naz',             Client: 'State Bank',           Location: 'Karachi' },
  { Name: 'Tayyaba Gul',           Title: 'Senior Legal Counsel',                   ReportsTo: 'Babar Azam',            Client: '—',                    Location: 'Lahore' },
  { Name: 'Nauman Aslam',          Title: 'Legal Associate',                        ReportsTo: 'Babar Azam',            Client: '—',                    Location: 'Lahore' },

  // ═══ MARKETING ═══
  { Name: 'Zoya Nasir',            Title: 'VP Marketing',                           ReportsTo: 'Mansoor Ali Shah',      Client: '—',                    Location: 'Dubai' },
  { Name: 'Taha Malik',            Title: 'Director — Digital Marketing',           ReportsTo: 'Zoya Nasir',            Client: '—',                    Location: 'Dubai' },
  { Name: 'Aliya Bukhari',         Title: 'Director — Brand & Communications',      ReportsTo: 'Zoya Nasir',            Client: '—',                    Location: 'Karachi' },
  { Name: 'Haris Sohail',          Title: 'Social Media Manager',                   ReportsTo: 'Taha Malik',            Client: '—',                    Location: 'Dubai' },
  { Name: 'Areesha Khan',          Title: 'SEO/SEM Specialist',                     ReportsTo: 'Taha Malik',            Client: '—',                    Location: 'Lahore' },
  { Name: 'Uzair Ahmed',           Title: 'Content Writer',                         ReportsTo: 'Taha Malik',            Client: '—',                    Location: 'Dubai' },
  { Name: 'Mishal Bukhari',        Title: 'Brand Manager',                          ReportsTo: 'Aliya Bukhari',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Noor Ul Ain',           Title: 'Communications Specialist',              ReportsTo: 'Aliya Bukhari',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Shehroz Sabzwari',      Title: 'Graphic Designer',                       ReportsTo: 'Aliya Bukhari',         Client: '—',                    Location: 'Lahore' },

  // ═══ CUSTOMER SERVICE ═══
  { Name: 'Rana Waqar',            Title: 'VP Customer Service',                    ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Sehrish Afzal',         Title: 'Director — Call Center Operations',      ReportsTo: 'Rana Waqar',            Client: '—',                    Location: 'Karachi' },
  { Name: 'Anwaar Hussain',        Title: 'Director — Customer Experience',         ReportsTo: 'Rana Waqar',            Client: '—',                    Location: 'Lahore' },
  { Name: 'Ghazala Parveen',       Title: 'Call Center Team Lead — A',              ReportsTo: 'Sehrish Afzal',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Mujahid Khan',          Title: 'Call Center Team Lead — B',              ReportsTo: 'Sehrish Afzal',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Sidra Batool',          Title: 'Senior CSR',                             ReportsTo: 'Ghazala Parveen',       Client: '—',                    Location: 'Karachi' },
  { Name: 'Rashid Minhas',         Title: 'CSR Agent',                              ReportsTo: 'Ghazala Parveen',       Client: '—',                    Location: 'Karachi' },
  { Name: 'Umme Habiba',           Title: 'CSR Agent',                              ReportsTo: 'Mujahid Khan',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Haroon Rasheed',        Title: 'CSR Agent',                              ReportsTo: 'Mujahid Khan',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Maryam Aurangzeb',      Title: 'CX Specialist',                          ReportsTo: 'Anwaar Hussain',        Client: '—',                    Location: 'Lahore' },
  { Name: 'Azhar Mahmood',         Title: 'Customer Feedback Analyst',              ReportsTo: 'Anwaar Hussain',        Client: '—',                    Location: 'Lahore' },

  // ═══ INTERNAL AUDIT ═══
  { Name: 'Ghulam Abbas',          Title: 'VP Internal Audit',                      ReportsTo: 'Zahid Mahmood',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Rubina Ashraf',         Title: 'Senior Internal Auditor',                ReportsTo: 'Ghulam Abbas',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Imtiaz Gul',            Title: 'Internal Auditor',                       ReportsTo: 'Ghulam Abbas',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Sumera Akhtar',         Title: 'Audit Associate',                        ReportsTo: 'Ghulam Abbas',          Client: '—',                    Location: 'KSA' },

  // ═══ PRODUCT DEVELOPMENT ═══
  { Name: 'Jawad Sharif',          Title: 'VP Product Development',                 ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Tahira Parveen',        Title: 'Product Manager — Health Insurance',     ReportsTo: 'Jawad Sharif',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Gulzar Ahmed',          Title: 'Product Manager — Motor Insurance',      ReportsTo: 'Jawad Sharif',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Nazia Hameed',          Title: 'Product Manager — Life Insurance',       ReportsTo: 'Jawad Sharif',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Muneeb Farooqi',        Title: 'Product Analyst — Health',               ReportsTo: 'Tahira Parveen',        Client: '—',                    Location: 'Karachi' },
  { Name: 'Asim Rafiq',            Title: 'Product Analyst — Motor',                ReportsTo: 'Gulzar Ahmed',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Samia Suleman',         Title: 'Product Analyst — Life',                 ReportsTo: 'Nazia Hameed',          Client: '—',                    Location: 'Karachi' },

  // ═══ ADMINISTRATION & FACILITIES ═══
  { Name: 'Shahbaz Gill',          Title: 'Director — Administration',              ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'Karachi' },
  { Name: 'Pervez Elahi',          Title: 'Facilities Manager',                     ReportsTo: 'Shahbaz Gill',          Client: '—',                    Location: 'Karachi' },
  { Name: 'Asifa Bhutto',          Title: 'Office Coordinator — Lahore',            ReportsTo: 'Shahbaz Gill',          Client: '—',                    Location: 'Lahore' },
  { Name: 'Hamid Mir',             Title: 'Procurement Officer',                    ReportsTo: 'Shahbaz Gill',          Client: '—',                    Location: 'Karachi' },

  // ═══ INTERNATIONAL OPERATIONS ═══
  { Name: 'Sultan Al Rashid',      Title: 'Director — KSA Operations',              ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'KSA' },
  { Name: 'Ahmed Al Mansoori',     Title: 'Director — UAE Operations',              ReportsTo: 'Nazia Parveen',         Client: '—',                    Location: 'Dubai' },
  { Name: 'Fahad Al Dosari',       Title: 'Branch Manager — Riyadh',                ReportsTo: 'Sultan Al Rashid',      Client: 'Aramco',               Location: 'KSA' },
  { Name: 'Layla Al Zahrani',      Title: 'Senior Sales Officer — KSA',             ReportsTo: 'Sultan Al Rashid',      Client: 'SABIC',                Location: 'KSA' },
  { Name: 'Yousuf Al Balushi',     Title: 'Claims Officer — KSA',                   ReportsTo: 'Sultan Al Rashid',      Client: 'STC',                  Location: 'KSA' },
  { Name: 'Mariam Al Maktoum',     Title: 'Branch Manager — Dubai',                 ReportsTo: 'Ahmed Al Mansoori',     Client: 'ADNOC',                Location: 'Dubai' },
  { Name: 'Rashid Al Nuaimi',      Title: 'Sales Manager — UAE',                    ReportsTo: 'Ahmed Al Mansoori',     Client: 'Emirates Group',       Location: 'Dubai' },
  { Name: 'Sara Al Hammadi',       Title: 'Claims Officer — UAE',                   ReportsTo: 'Ahmed Al Mansoori',     Client: 'Emaar',                Location: 'Dubai' },
];

console.log(`Total employees: ${employees.length}`);

const ws = XLSX.utils.json_to_sheet(employees);

// Auto-size columns
const colWidths = Object.keys(employees[0]).map(key => {
  const maxLen = Math.max(key.length, ...employees.map(e => (e[key] || '').length));
  return { wch: maxLen + 2 };
});
ws['!cols'] = colWidths;

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Employees');
XLSX.writeFile(wb, 'SecureLife_Insurance_OrgData.xlsx');
console.log('File saved: SecureLife_Insurance_OrgData.xlsx');
