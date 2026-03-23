// Bangladesh Districts and Upazillas / Thanas
export const BD_LOCATIONS: Record<string, string[]> = {
  // Dhaka Division
  "Dhaka": ["Adabor", "Badda", "Bangshal", "Bimanbandar", "Cantonment", "Chokbazar", "Dakshinkhan", "Demra", "Dhamrai", "Dhanmondi", "Dohar", "Gendaria", "Gulshan", "Hazaribagh", "Jatrabari", "Kafrul", "Kadamtali", "Kalabagan", "Keraniganj", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur", "Mohammadpur", "Motijheel", "Mugda Para", "Nawabganj", "Pallabi", "Paltan", "Ramna", "Rayer Bazar", "Sabujbagh", "Savar", "Shah Ali", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", "Turag", "Uttara", "Uttarkhan", "Wari"],
  "Faridpur": ["Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
  "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur", "Tongi"],
  "Gopalganj": ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
  "Kishoreganj": ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  "Madaripur": ["Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar"],
  "Manikganj": ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"],
  "Munshiganj": ["Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"],
  "Narayanganj": ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"],
  "Narsingdi": ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura", "Shibpur"],
  "Rajbari": ["Baliakandi", "Goalanda", "Kalukhali", "Pangsha", "Rajbari Sadar"],
  "Shariatpur": ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zanjira"],
  "Tangail": ["Basail", "Bhuapur", "Delduar", "Dhanbari", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Tangail Sadar"],
  
  // Chittagong Division
  "Bandarban": ["Alikadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
  "Brahmanbaria": ["Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"],
  "Chandpur": ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
  "Chattogram": ["Anwara", "Banshkhali", "Bayazid", "Boalkhali", "Chandanaish", "Chandgaon", "Chattogram Sadar", "Doublemooring", "EPZ", "Fatikchhari", "Hathazari", "Karnaphuli", "Khulshi", "Lohagara", "Mirsharai", "Pahartali", "Panchlaish", "Patenga", "Patiya", "Port", "Rangunia", "Raozan", "Sandwip", "Satkania", "Sitakunda"],
  "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"],
  "Cumilla": ["Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Cumilla Adarsha Sadar", "Cumilla Sadar Dakshin", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Meghna", "Monohorgonj", "Muradnagar", "Nangalkot", "Titas"],
  "Feni": ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Fulgazi", "Parshuram", "Sonagazi"],
  "Khagrachhari": ["Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"],
  "Lakshmipur": ["Kamalnagar", "Lakshmipur Sadar", "Rajganj", "Ramganj", "Raipur"],
  "Noakhali": ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirkhat", "Noakhali Sadar", "Senbagh", "Sonaimuri", "Subarnachar"],
  "Rangamati": ["Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kaukhali", "Langadu", "Nannerchar", "Rajasthali", "Rangamati Sadar"],
}

export const BD_DISTRICTS = Object.keys(BD_LOCATIONS).sort()

// Post Office mapping with postal codes for each Upazilla
export const POST_OFFICES: Record<string, Array<{ name: string; code: string }>> = {
  // Dhaka District
  "Adabor": [
    { name: "Adabor PO", code: "1207" },
    { name: "Adabor GPO", code: "1207" }
  ],
  "Badda": [
    { name: "Badda PO", code: "1212" },
    { name: "Gulshan PO", code: "1213" }
  ],
  "Bangshal": [
    { name: "Bangshal PO", code: "1100" },
    { name: "Kotwali PO", code: "1100" }
  ],
  "Bimanbandar": [
    { name: "Bimanbandar PO", code: "1206" }
  ],
  "Cantonment": [
    { name: "Cantonment PO", code: "1206" },
    { name: "Mirpur PO", code: "1216" }
  ],
  "Chokbazar": [
    { name: "Chokbazar PO", code: "1100" }
  ],
  "Dakshinkhan": [
    { name: "Dakshinkhan PO", code: "1230" }
  ],
  "Demra": [
    { name: "Demra PO", code: "1361" }
  ],
  "Dhamrai": [
    { name: "Dhamrai PO", code: "1340" },
    { name: "Dhamrai Sadar PO", code: "1340" }
  ],
  "Dhanmondi": [
    { name: "Dhanmondi PO", code: "1205" },
    { name: "Dhanmondi GPO", code: "1205" }
  ],
  "Dohar": [
    { name: "Dohar PO", code: "1328" },
    { name: "Dohar Sadar PO", code: "1328" }
  ],
  "Gendaria": [
    { name: "Gendaria PO", code: "1204" }
  ],
  "Gulshan": [
    { name: "Gulshan PO", code: "1213" },
    { name: "Baridhara PO", code: "1212" }
  ],
  "Hazaribagh": [
    { name: "Hazaribagh PO", code: "1209" },
    { name: "Kotwali PO", code: "1100" }
  ],
  "Jatrabari": [
    { name: "Jatrabari PO", code: "1204" }
  ],
  "Kafrul": [
    { name: "Kafrul PO", code: "1207" }
  ],
  "Kadamtali": [
    { name: "Kadamtali PO", code: "1235" }
  ],
  "Kalabagan": [
    { name: "Kalabagan PO", code: "1205" }
  ],
  "Keraniganj": [
    { name: "Keraniganj PO", code: "1310" },
    { name: "Keraniganj Sadar PO", code: "1310" }
  ],
  "Khilgaon": [
    { name: "Khilgaon PO", code: "1219" }
  ],
  "Khilkhet": [
    { name: "Khilkhet PO", code: "1219" }
  ],
  "Kotwali": [
    { name: "Kotwali PO", code: "1100" },
    { name: "Old Dhaka PO", code: "1100" }
  ],
  "Lalbagh": [
    { name: "Lalbagh PO", code: "1211" }
  ],
  "Mirpur": [
    { name: "Mirpur PO", code: "1216" },
    { name: "Mirpur-1 PO", code: "1216" }
  ],
  "Mohammadpur": [
    { name: "Mohammadpur PO", code: "1207" }
  ],
  "Motijheel": [
    { name: "Motijheel PO", code: "1213" }
  ],
  "Mugda Para": [
    { name: "Mugda PO", code: "1214" }
  ],
  "Nawabganj": [
    { name: "Nawabganj PO", code: "1211" }
  ],
  "Pallabi": [
    { name: "Pallabi PO", code: "1216" }
  ],
  "Paltan": [
    { name: "Paltan PO", code: "1212" }
  ],
  "Ramna": [
    { name: "Ramna PO", code: "1205" }
  ],
  "Rayer Bazar": [
    { name: "Rayer Bazar PO", code: "1209" }
  ],
  "Sabujbagh": [
    { name: "Sabujbagh PO", code: "1214" }
  ],
  "Savar": [
    { name: "Savar PO", code: "1340" },
    { name: "Savar Upazilla PO", code: "1340" }
  ],
  "Shah Ali": [
    { name: "Shah Ali PO", code: "1206" }
  ],
  "Sher-e-Bangla Nagar": [
    { name: "Agargaon PO", code: "1207" },
    { name: "Sher-e-Bangla PO", code: "1207" }
  ],
  "Shyampur": [
    { name: "Shyampur PO", code: "1328" }
  ],
  "Sutrapur": [
    { name: "Sutrapur PO", code: "1204" }
  ],
  "Tejgaon": [
    { name: "Tejgaon PO", code: "1208" }
  ],
  "Turag": [
    { name: "Turag PO", code: "1230" }
  ],
  "Uttara": [
    { name: "Uttara PO", code: "1230" },
    { name: "Uttara GPO", code: "1230" }
  ],
  "Uttarkhan": [
    { name: "Uttarkhan PO", code: "1219" }
  ],
  "Wari": [
    { name: "Wari PO", code: "1202" }
  ],

  // Faridpur District
  "Alfadanga": [
    { name: "Alfadanga PO", code: "7800" }
  ],
  "Bhanga": [
    { name: "Bhanga PO", code: "7810" }
  ],
  "Boalmari": [
    { name: "Boalmari PO", code: "7820" }
  ],
  "Charbhadrasan": [
    { name: "Charbhadrasan PO", code: "7830" }
  ],
  "Faridpur Sadar": [
    { name: "Faridpur PO", code: "7800" },
    { name: "Faridpur Sadar PO", code: "7800" }
  ],
  "Madhukhali": [
    { name: "Madhukhali PO", code: "7840" }
  ],
  "Nagarkanda": [
    { name: "Nagarkanda PO", code: "7850" }
  ],
  "Sadarpur": [
    { name: "Sadarpur PO", code: "7860" }
  ],
  "Saltha": [
    { name: "Saltha PO", code: "7870" }
  ],

  // Gazipur District
  "Gazipur Sadar": [
    { name: "Gazipur PO", code: "1700" },
    { name: "Gazipur Sadar PO", code: "1700" }
  ],
  "Kaliakair": [
    { name: "Kaliakair PO", code: "1710" }
  ],
  "Kaliganj": [
    { name: "Kaliganj PO", code: "1720" }
  ],
  "Kapasia": [
    { name: "Kapasia PO", code: "1730" }
  ],
  "Sreepur": [
    { name: "Sreepur PO", code: "1740" }
  ],
  "Tongi": [
    { name: "Tongi PO", code: "1711" }
  ],

  // Gopalganj District
  "Gopalganj Sadar": [
    { name: "Gopalganj PO", code: "8100" }
  ],
  "Kashiani": [
    { name: "Kashiani PO", code: "8110" }
  ],
  "Kotalipara": [
    { name: "Kotalipara PO", code: "8120" }
  ],
  "Muksudpur": [
    { name: "Muksudpur PO", code: "8130" }
  ],
  "Tungipara": [
    { name: "Tungipara PO", code: "8140" }
  ],

  // Kishoreganj District
  "Austagram": [
    { name: "Austagram PO", code: "2300" }
  ],
  "Bajitpur": [
    { name: "Bajitpur PO", code: "2310" }
  ],
  "Bhairab": [
    { name: "Bhairab PO", code: "2320" }
  ],
  "Hossainpur": [
    { name: "Hossainpur PO", code: "2330" }
  ],
  "Itna": [
    { name: "Itna PO", code: "2340" }
  ],
  "Karimganj": [
    { name: "Karimganj PO", code: "2350" }
  ],
  "Katiadi": [
    { name: "Katiadi PO", code: "2360" }
  ],
  "Kishoreganj Sadar": [
    { name: "Kishoreganj PO", code: "2300" }
  ],
  "Kuliarchar": [
    { name: "Kuliarchar PO", code: "2370" }
  ],
  "Mithamain": [
    { name: "Mithamain PO", code: "2380" }
  ],
  "Nikli": [
    { name: "Nikli PO", code: "2390" }
  ],
  "Pakundia": [
    { name: "Pakundia PO", code: "2400" }
  ],
  "Tarail": [
    { name: "Tarail PO", code: "2410" }
  ],

  // Default for missing entries
  "Default": [
    { name: "Main Post Office", code: "0000" }
  ]
}
