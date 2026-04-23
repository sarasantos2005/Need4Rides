const VEICULOS = {
    "marcas": [
      {
        "id": "peugeot",
        "nome": "Peugeot",
        "modelos": [
          "108", "208", "2008", "301", "308", "3008", "5008", "508",
          "Rifter", "Partner", "Expert", "Traveller", "Boxer",
          "e-208", "e-2008", "e-308", "e-Expert",
          "104", "203", "204", "205", "206", "207", "207 CC",
          "305", "306", "307", "309", "405", "406", "407",
          "504", "505", "604", "605", "607", "806", "807",
          "1007", "4007", "4008", "RCZ", "Bipper", "iOn",
          "205 GTI", "206 GTI", "207 GTI", "208 GTI",
          "306 GTI", "308 GTI", "RCZ R",
          "508 PSE", "3008 GT", "5008 GT",
          "J5", "J7", "J9", "D3", "D4"
        ]
      },
      {
        "id": "volkswagen",
        "nome": "Volkswagen",
        "modelos": [
          "Golf", "Polo", "Passat", "Arteon", "T-Roc", "Tiguan",
          "ID.3", "ID.4", "ID.5", "T-Cross", "Taigo", "Touran",
          "Caddy", "Sharan", "Up!", "Amarok", "California",
          "Beetle", "Bora", "Corrado", "Derby", "Eos", "Fox",
          "Gol", "Jetta", "Karmann Ghia", "Lupo", "Phaeton",
          "Scirocco", "Type 3", "Vento", "Golf GTI", "Golf R",
          "Polo GTI", "Scirocco R", "Corrado VR6", "Golf VR6",
          "Caravelle", "Kombi", "Multivan", "Transporter"
        ]
      },
      {
        "id": "renault",
        "nome": "Renault",
        "modelos": [
          "Clio", "Megane", "Captur", "Kadjar", "Zoe", "Twingo",
          "Scénic", "Kangoo", "Talisman", "Arkana", "Austral",
          "4", "5", "6", "9", "11", "12", "14", "16", "18",
          "19", "21", "25", "30", "Fuego", "Laguna", "Safrane",
          "Vel Satis", "5 Turbo", "Clio RS", "Megane RS",
          "Alpine A110", "Sport Spider", "Express", "Master", "Trafic"
        ]
      },
      {
        "id": "citroen",
        "nome": "Citroën",
        "modelos": [
          "C3", "C4", "C5 Aircross", "Berlingo", "C3 Aircross",
          "C4 Cactus", "C5 X", "Spacetourer", "Jumpy", "ë-C4",
          "2CV", "AX", "BX", "CX", "DS", "Dyane", "Evasion",
          "GS", "Saxo", "SM", "Visa", "XM", "Xantia", "ZX",
          "BX GTI", "Saxo VTS", "DS3 Racing", "C15", "C25", "H Van"
        ]
      },
      {
        "id": "bmw",
        "nome": "BMW",
        "modelos": [
          "Série 1", "Série 2", "Série 3", "Série 4", "Série 5",
          "Série 7", "Série 8", "X1", "X2", "X3", "X4", "X5",
          "X6", "X7", "Z4", "i3", "i4", "i7", "iX", "iX3",
          "1500", "2000", "2500", "3.0 CS", "501", "507", "E9",
          "Isetta", "M1", "M2", "M3", "M4", "M5", "M6", "M8",
          "X3 M", "X4 M", "X5 M", "X6 M", "M535i", "M635CSi"
        ]
      },
      {
        "id": "mercedes",
        "nome": "Mercedes-Benz",
        "modelos": [
          "Classe A", "Classe B", "Classe C", "Classe E", "Classe S",
          "CLA", "CLB", "CLC", "CLK", "CLS", "GLA", "GLB", "GLC",
          "GLE", "GLK", "GLS", "G-Class", "SL", "SLC", "SLK", "SLR",
          "SLS", "AMG GT", "170", "190", "220", "280", "300", "450",
          "500", "600", "W123", "W124", "W201", "Sprinter", "Vito"
        ]
      },
      {
        "id": "audi",
        "nome": "Audi",
        "modelos": [
          "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
          "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron", "e-tron GT",
          "TT", "R8", "RS2", "RS3", "RS4", "RS5", "RS6", "RS7",
          "S3", "S4", "S5", "S6", "S8", "SQ5", "SQ7", "SQ8",
          "50", "80", "90", "100", "200", "V8", "Quattro"
        ]
      },
      {
        "id": "ford",
        "nome": "Ford",
        "modelos": [
          "Fiesta", "Focus", "Mondeo", "Puma", "Kuga", "Ecosport",
          "S-Max", "Galaxy", "Tourneo", "Ranger", "Mustang", "Transit",
          "Anglia", "Capri", "Consul", "Cortina", "Escort", "Granada",
          "Orion", "Probe", "Scorpio", "Sierra", "Taunus", "Fiesta ST",
          "Focus ST", "Puma ST", "Mustang GT", "GT40", "RS200", "Thunderbird"
        ]
      },
      {
        "id": "opel",
        "nome": "Opel",
        "modelos": [
          "Adam", "Ampera", "Astra", "Corsa", "Crossland", "Grandland",
          "Insignia", "Karl", "Mokka", "Vivaro", "Zafira", "Ascona",
          "Commodore", "Diplomat", "Kadett", "Monza", "Olympia", "Rekord",
          "Senator", "Signum", "Speedster", "Tigra", "Vectra", "Astra GTE",
          "Corsa GSi", "Insignia OPC", "Manta", "GT", "Monterey", "Frontera"
        ]
      },
      {
        "id": "fiat",
        "nome": "Fiat",
        "modelos": [
          "500", "Panda", "Tipo", "Punto", "Qubo", "Doblò", "500X",
          "500L", "124 Spider", "Brava", "Bravo", "Cinquecento", "Croma",
          "Marea", "Multipla", "Palio", "Ritmo", "Sedici", "Seicento",
          "Stilo", "Tempra", "Uno", "X1/9", "Barchetta", "Coupe", "124 Sport",
          "131", "132", "Argenta", "Regata", "Talento", "Ducato"
        ]
      },
      {
        "id": "alfa-romeo",
        "nome": "Alfa Romeo",
        "modelos": [
          "Giulia", "Stelvio", "Tonale", "4C", "8C", "Brera", "GT",
          "Spider", "145", "146", "147", "155", "156", "159", "164",
          "166", "33", "75", "90", "Alfasud", "Alfetta", "Arna",
          "GTV", "Junior", "Montreal", "RZ", "SZ", "6C", "1900", "2000"
        ]
      },
      {
        "id": "toyota",
        "nome": "Toyota",
        "modelos": [
          "Aygo", "Yaris", "Corolla", "Camry", "RAV4", "C-HR", "Prius",
          "bZ4X", "Hilux", "Land Cruiser", "Proace", "Mirai", "Auris",
          "Avensis", "Celica", "MR2", "Paseo", "Previa", "Starlet",
          "Supra", "GT86", "GR Yaris", "GR Supra", "GR86", "Carina", "Corona"
        ]
      },
      {
        "id": "nissan",
        "nome": "Nissan",
        "modelos": [
          "Micra", "Leaf", "Juke", "Qashqai", "X-Trail", "Ariya", "Navara",
          "Patrol", "NV200", "Almera", "Bluebird", "Cherry", "Figaro",
          "Laurel", "Maxima", "NX", "Pixo", "Prairie", "Primera", "Pulsar",
          "Silvia", "Skyline", "Sunny", "Terrano", "Vanette", "300ZX", "Z"
        ]
      },
      {
        "id": "honda",
        "nome": "Honda",
        "modelos": [
          "Jazz", "Civic", "Accord", "CR-V", "HR-V", "e", "NSX", "S2000",
          "Concerto", "Legend", "Prelude", "Quintet", "Shuttle", "Stream",
          "CR-X", "CR-Z", "Integra", "Logo", "Orthia", "Today", "Zest",
          "Acty", "Beat", "Capa", "City", "FR-V", "Insight", "Life"
        ]
      },
      {
        "id": "mazda",
        "nome": "Mazda",
        "modelos": [
          "2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-80", "MX-5",
          "MX-30", "121", "323", "626", "929", "Atenza", "Axela", "Demio",
          "Eunos", "Premacy", "Protege", "RX-7", "RX-8", "Xedos", "Bongo",
          "Carol", "Cosmo", "Lantis", "Luce", "Millenia", "MPV", "Roadster"
        ]
      },
      {
        "id": "volvo",
        "nome": "Volvo",
        "modelos": [
          "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40", "EX30",
          "240", "340", "360", "440", "460", "480", "740", "760", "780", "850",
          "940", "960", "C30", "C70", "S40", "S70", "S80", "V40", "V50", "V70",
          "P1800", "Amazon", "Duett", "PV", "66", "140", "164", "262C", "P210"
        ]
      },
      {
        "id": "skoda",
        "nome": "Škoda",
        "modelos": [
          "Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq",
          "Enyaq", "Citigo", "Rapid", "100", "105", "110", "120", "130", "135",
          "136", "Favorit", "Felicia", "Forman", "Popular", "Praktik", "Roomster",
          "Tudor", "1000 MB", "1101", "440", "445", "Octavia RS", "Superb Sportline"
        ]
      },
      {
        "id": "seat",
        "nome": "SEAT",
        "modelos": [
          "Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Mii", "Alhambra",
          "133", "Fura", "Malaga", "Marbella", "Ronda", "Toledo", "600",
          "850", "1200", "1430", "1500", "124", "127", "128", "131", "132",
          "Cordoba", "Inca", "Vario", "Arosa", "Exeo", "Mii Electric"
        ]
      },
      {
        "id": "cupra",
        "nome": "Cupra",
        "modelos": [
          "Leon", "Ateca", "Formentor", "Born", "Tavascan", "Terramar",
          "Leon Competición", "TCR", "e-Racer", "UrbanRebel"
        ]
      },
      {
        "id": "ds",
        "nome": "DS Automobiles",
        "modelos": [
          "DS 3", "DS 4", "DS 7", "DS 9", "DS 3 Crossback", "DS 7 Crossback",
          "DS 4 Crossback", "DS 5", "DS 21", "DS 23"
        ]
      },
      {
        "id": "tesla",
        "nome": "Tesla",
        "modelos": [
          "Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster",
          "Semi", "Model 3 Performance", "Model S Plaid", "Model X Plaid"
        ]
      },
      {
        "id": "jaguar",
        "nome": "Jaguar",
        "modelos": [
          "XE", "XF", "XJ", "E-Pace", "F-Pace", "I-Pace", "F-Type", "XK",
          "S-Type", "X-Type", "Mark 2", "XJS", "XJ6", "XJ8", "XJR", "XK8",
          "XKR", "SS", "420", "E-Type", "D-Type", "C-Type", "Mark IV"
        ]
      },
      {
        "id": "landrover",
        "nome": "Land Rover",
        "modelos": [
          "Defender", "Discovery", "Discovery Sport", "Range Rover",
          "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque",
          "Freelander", "Series I", "Series II", "Series III", "101 Forward Control",
          "Range Rover Classic", "Range Rover P38", "Discovery 1", "Discovery 2"
        ]
      },
      {
        "id": "porsche",
        "nome": "Porsche",
        "modelos": [
          "911", "Taycan", "Panamera", "Macan", "Cayenne", "Boxster", "Cayman",
          "356", "550", "912", "914", "924", "928", "944", "959", "968",
          "911 GT1", "911 GT2", "911 GT3", "Carrera GT", "918 Spyder", "Mission X"
        ]
      },
      {
        "id": "lexus",
        "nome": "Lexus",
        "modelos": [
          "CT", "IS", "ES", "LS", "UX", "NX", "RX", "RC", "LC", "GX", "LX",
          "GS", "HS", "SC", "LFA", "IS F", "RC F", "GS F", "LS 400", "LS 430"
        ]
      },
      {
        "id": "suzuki",
        "nome": "Suzuki",
        "modelos": [
          "Swift", "Ignis", "Baleno", "Celerio", "Swace", "Across", "Vitara",
          "S-Cross", "Jimny", "Alto", "Cappuccino", "Carry", "Equator", "Esteem",
          "Kizashi", "Liana", "Samurai", "Sidekick", "SJ", "SX4", "Wagon R", "X-90"
        ]
      },
      {
        "id": "mitsubishi",
        "nome": "Mitsubishi",
        "modelos": [
          "ASX", "Eclipse Cross", "Outlander", "Space Star", "L200", "i-MiEV",
          "3000GT", "Carisma", "Colt", "Cordia", "Diamante", "FTO", "Galant",
          "Grandis", "Lancer", "Mirage", "Montero", "Pajero", "Sapporo", "Sigma",
          "Space Gear", "Space Wagon", "Starion", "Tredia"
        ]
      },
      {
        "id": "subaru",
        "nome": "Subaru",
        "modelos": [
          "Impreza", "Legacy", "Outback", "Forester", "XV", "BRZ", "WRX", "Levorg",
          "360", "Alcyone", "Baja", "Domingo", "Exiga", "Justy", "Leone", "Libero",
          "Rex", "SVX", "Traviq", "Tribeca", "Vivio", "XT", "Forester STI", "Legacy B4"
        ]
      },
      {
        "id": "dacia",
        "nome": "Dacia",
        "modelos": [
          "Sandero", "Logan", "Duster", "Jogger", "Spring", "Lodgy", "Dokker",
          "1300", "1310", "1320", "1410", "500", "Lăstun", "Solenza", "Supernova"
        ]
      },
      {
        "id": "lancia",
        "nome": "Lancia",
        "modelos": [
          "Ypsilon", "Delta", "Thema", "Flavia", "Voyager", "Appia", "Aurelia",
          "Beta", "Dedra", "Fulvia", "Gamma", "Kappa", "Lybra", "Monte Carlo",
          "Prisma", "Stratos", "Trevi", "Zeta", "037", "Delta Integrale", "Flaminia"
        ]
      },
      {
        "id": "maserati",
        "nome": "Maserati",
        "modelos": [
          "Ghibli", "Quattroporte", "Levante", "GranTurismo", "MC20", "GranCabrio",
          "3200 GT", "4200 GT", "Biturbo", "Bora", "Indy", "Khamsin", "Kyalami",
          "Merak", "Mexico", "Shamal", "Spyder", "GranSport", "Coupe", "Barchetta"
        ]
      },
      {
        "id": "ferrari",
        "nome": "Ferrari",
        "modelos": [
          "296 GTB", "Portofino", "Roma", "SF90", "F8 Tributo", "812 Superfast",
          "Daytona SP3", "250 GTO", "275", "288 GTO", "308", "328", "348", "355",
          "360", "365", "400", "412", "456", "458", "488", "512", "550", "575M",
          "599", "612", "California", "Dino", "Enzo", "F12", "F40", "F50", "FF",
          "GTO", "LaFerrari", "Mondial", "Testarossa"
        ]
      },
      {
        "id": "lamborghini",
        "nome": "Lamborghini",
        "modelos": [
          "Aventador", "Huracán", "Urus", "Countach", "Revuelto", "Gallardo",
          "Murciélago", "350 GT", "400 GT", "Miura", "Espada", "Islero", "Jarama",
          "Jalpa", "LM002", "Diablo", "Reventón", "Sesto Elemento", "Veneno",
          "Centenario", "Sián", "Terzo Millennio"
        ]
      },
      {
        "id": "bentley",
        "nome": "Bentley",
        "modelos": [
          "Continental GT", "Bentayga", "Flying Spur", "Mulsanne", "Azure",
          "Brooklands", "Arnage", "Turbo R", "Eight", "Mark VI", "R Type",
          "S1", "S2", "S3", "T1", "T2", "Corniche", "Continental", "Speed Six"
        ]
      },
      {
        "id": "rollsroyce",
        "nome": "Rolls-Royce",
        "modelos": [
          "Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Spectre",
          "Silver Cloud", "Silver Shadow", "Silver Spirit", "Silver Seraph",
          "Corniche", "Camargue", "Park Ward", "Tourer", "20/25", "Wraith",
          "Dawn", "Silver Ghost", "Phantom I", "Phantom II", "Phantom III"
        ]
      },
      {
        "id": "astonmartin",
        "nome": "Aston Martin",
        "modelos": [
          "DB11", "DB12", "DBS", "Rapide", "Vantage", "Valhalla", "Valkyrie",
          "Vanquish", "DB5", "DB6", "DB7", "DB9", "DBS V12", "One-77", "Cygnet",
          "Lagonda", "V8", "V12 Zagato", "Virage", "Bulldog", "DBR1", "DBR2"
        ]
      },
      {
        "id": "mclaren",
        "nome": "McLaren",
        "modelos": [
          "540C", "570S", "600LT", "620R", "720S", "765LT", "Artura", "P1",
          "Senna", "Elva", "F1", "MP4-12C", "650S", "675LT", "GT", "Speedtail",
          "Sabre", "Solus GT", "X-1", "M6GT", "M8B", "M20"
        ]
      },
      {
        "id": "bugatti",
        "nome": "Bugatti",
        "modelos": [
          "Chiron", "Veyron", "Divo", "Centodieci", "Bolide", "EB110",
          "Type 35", "Type 41", "Type 57", "Type 101", "Type 251", "Atlantic",
          "Galibier", "Vision GT", "La Voiture Noire", "W16 Mistral"
        ]
      },
      {
        "id": "mini",
        "nome": "MINI",
        "modelos": [
          "Cooper", "Clubman", "Countryman", "Paceman", "Coupe", "Roadster",
          "Electric", "Cooper S", "John Cooper Works", "GP", "Vision", "Aceman",
          "Mini", "Mini Moke", "1275GT", "Cooper SE", "Clubvan", "Rocketman"
        ]
      },
      {
        "id": "smart",
        "nome": "smart",
        "modelos": [
          "fortwo", "forfour", "EQ fortwo", "EQ forfour", "#1", "#3",
          "Crossblade", "Roadster", "City Coupe", "K", "MHD", "BRABUS",
          "Speedster", "Ultimate 112", "ebike", "edrive", "vision EQ"
        ]
      },
      {
        "id": "ssangyong",
        "nome": "SsangYong",
        "modelos": [
          "Tivoli", "Korando", "Rexton", "Musso", "Rodius", "Actyon",
          "Chairman", "Stavic", "Kyron", "Korando Sports", "Rexton Sports",
          "XLV", "Turismo", "Family", "Korando Turismo", "Istana", "Nomad"
        ]
      },
      {
        "id": "alpine",
        "nome": "Alpine",
        "modelos": [
          "A110", "A310", "A610", "GTA", "V6", "A108", "A210", "A440",
          "A441", "A442", "A443", "A450", "A460", "A470", "A480", "A521"
        ]
      }
    ]
  };

export default VEICULOS;
