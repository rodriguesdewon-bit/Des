"""Static reference data: Brazilian vehicle catalog, maintenance schedules, state fuel prices."""

from datetime import date

# (model, avg km/L, fuel) — fuel: flex | gasolina | diesel
CATALOG: dict[str, dict[str, list[tuple[str, float, str]]]] = {
    "moto": {
        "Honda": [("CG 160 Start", 43, "flex"), ("CG 160 Fan", 42, "flex"), ("CG 160 Titan", 41, "flex"),
                  ("Biz 125", 45, "flex"), ("Pop 110i", 50, "gasolina"), ("Bros 160", 38, "flex"),
                  ("XRE 190", 34, "flex"), ("XRE 300", 28, "flex"), ("CB 300F Twister", 30, "flex"),
                  ("CB 500F", 24, "gasolina"), ("PCX 160", 40, "gasolina"), ("Elite 125", 45, "gasolina")],
        "Yamaha": [("Factor 150", 40, "flex"), ("Fazer FZ15", 38, "flex"), ("Fazer FZ25", 31, "flex"),
                   ("Crosser 150", 37, "flex"), ("Lander 250", 30, "flex"), ("NMax 160", 38, "gasolina"),
                   ("Fluo 125", 44, "gasolina"), ("MT-03", 25, "gasolina")],
        "Dafra": [("Apache 200", 35, "gasolina"), ("Citycom 300", 28, "gasolina")],
        "Suzuki": [("Intruder 125", 38, "gasolina"), ("Yes 125", 38, "gasolina"), ("V-Strom 650", 20, "gasolina")],
        "Kawasaki": [("Ninja 400", 24, "gasolina"), ("Z400", 24, "gasolina"), ("Versys 300", 25, "gasolina")],
        "BMW": [("G 310 R", 28, "gasolina"), ("G 310 GS", 27, "gasolina"), ("F 850 GS", 20, "gasolina")],
        "Shineray": [("Jet 50", 45, "gasolina"), ("XY 150", 35, "gasolina"), ("Worker 125", 38, "gasolina")],
        "Haojue": [("DK 150", 40, "gasolina"), ("Chopper Road 150", 38, "gasolina"), ("NK 150", 40, "gasolina")],
        "Royal Enfield": [("Meteor 350", 30, "gasolina"), ("Hunter 350", 32, "gasolina"), ("Himalayan", 25, "gasolina")],
    },
    "carro": {
        "Chevrolet": [("Onix 1.0", 13.5, "flex"), ("Onix Plus 1.0 Turbo", 13.0, "flex"), ("Tracker 1.0 Turbo", 11.8, "flex"),
                      ("Spin 1.8", 9.8, "flex"), ("Montana 1.2 Turbo", 12.0, "flex"), ("S10 2.8 Diesel", 10.5, "diesel"),
                      ("Prisma 1.4", 11.5, "flex"), ("Celta 1.0", 12.5, "flex")],
        "Volkswagen": [("Gol 1.0", 12.8, "flex"), ("Polo 1.0", 13.2, "flex"), ("Virtus 1.0 TSI", 13.0, "flex"),
                       ("T-Cross 1.0 TSI", 12.0, "flex"), ("Nivus 1.0 TSI", 12.3, "flex"), ("Saveiro 1.6", 11.0, "flex"),
                       ("Voyage 1.6", 11.5, "flex"), ("Amarok 3.0 V6", 9.0, "diesel"), ("Fox 1.6", 11.2, "flex")],
        "Fiat": [("Argo 1.0", 13.4, "flex"), ("Mobi 1.0", 13.8, "flex"), ("Strada 1.3", 12.0, "flex"),
                 ("Cronos 1.3", 12.4, "flex"), ("Pulse 1.0 Turbo", 12.5, "flex"), ("Fastback 1.0 Turbo", 12.3, "flex"),
                 ("Toro 2.0 Diesel", 10.6, "diesel"), ("Uno 1.0", 13.0, "flex"), ("Palio 1.0", 12.6, "flex")],
        "Hyundai": [("HB20 1.0", 13.0, "flex"), ("HB20S 1.0 Turbo", 12.8, "flex"), ("Creta 1.0 Turbo", 11.8, "flex"),
                    ("Tucson 1.6 Turbo", 10.0, "gasolina")],
        "Toyota": [("Corolla 2.0", 11.6, "flex"), ("Corolla Cross 2.0", 11.0, "flex"), ("Yaris 1.5", 12.4, "flex"),
                   ("Etios 1.5", 12.6, "flex"), ("Hilux 2.8 Diesel", 10.2, "diesel"), ("SW4 2.8 Diesel", 9.5, "diesel")],
        "Renault": [("Kwid 1.0", 14.6, "flex"), ("Sandero 1.0", 12.8, "flex"), ("Logan 1.6", 11.5, "flex"),
                    ("Duster 1.6", 10.4, "flex"), ("Oroch 1.6", 10.2, "flex")],
        "Jeep": [("Renegade 1.3 Turbo", 11.0, "flex"), ("Compass 1.3 Turbo", 10.6, "flex"), ("Commander 2.0 Diesel", 10.0, "diesel")],
        "Honda": [("City 1.5", 12.8, "flex"), ("Civic 2.0", 11.2, "flex"), ("HR-V 1.5", 11.6, "flex"), ("Fit 1.5", 12.4, "flex")],
        "Nissan": [("Kicks 1.6", 11.8, "flex"), ("Versa 1.6", 12.4, "flex"), ("Frontier 2.3 Diesel", 10.4, "diesel")],
        "Ford": [("Ka 1.0", 13.2, "flex"), ("EcoSport 1.5", 11.2, "flex"), ("Ranger 3.2 Diesel", 9.6, "diesel")],
        "Peugeot": [("208 1.0", 13.6, "flex"), ("2008 1.0 Turbo", 12.0, "flex")],
        "Citroën": [("C3 1.0", 13.4, "flex"), ("C4 Cactus 1.6", 11.0, "flex")],
        "BYD": [("Dolphin Mini (híbrido)", 25.0, "gasolina"), ("Song Plus DM-i", 22.0, "gasolina")],
    },
    "caminhao": {
        "Mercedes-Benz": [("Accelo 1016", 6.0, "diesel"), ("Atego 2426", 3.8, "diesel"), ("Axor 2544", 2.6, "diesel"),
                          ("Actros 2651", 2.4, "diesel")],
        "Volvo": [("VM 270", 3.6, "diesel"), ("FH 460", 2.5, "diesel"), ("FH 540", 2.3, "diesel")],
        "Scania": [("P 320", 3.2, "diesel"), ("R 450", 2.5, "diesel"), ("R 540", 2.3, "diesel")],
        "Volkswagen": [("Delivery 9.170", 6.5, "diesel"), ("Constellation 24.280", 3.4, "diesel"), ("Meteor 28.460", 2.5, "diesel")],
        "Iveco": [("Daily 35-160", 8.0, "diesel"), ("Tector 240E30", 3.4, "diesel"), ("S-Way 480", 2.5, "diesel")],
        "DAF": [("XF 480", 2.5, "diesel"), ("CF 410", 2.8, "diesel")],
        "Ford": [("Cargo 816", 6.2, "diesel"), ("Cargo 2429", 3.5, "diesel")],
    },
}

# key, interval_km, interval_months, default cost (BRL)
MAINTENANCE_TEMPLATES: dict[str, list[tuple[str, int, int, float]]] = {
    "moto": [("oil", 3000, 6, 75.0), ("tires", 15000, 36, 480.0), ("brakes", 10000, 24, 95.0), ("transmission", 20000, 36, 290.0)],
    "carro": [("oil", 10000, 12, 290.0), ("tires", 40000, 60, 1800.0), ("brakes", 30000, 36, 380.0), ("transmission", 60000, 60, 950.0)],
    "caminhao": [("oil", 20000, 12, 1600.0), ("tires", 80000, 60, 14000.0), ("brakes", 50000, 36, 2600.0), ("transmission", 100000, 60, 2400.0)],
}

# UF: name, gasolina, etanol, diesel (R$/L — médias aproximadas ANP, referência 2025), capital lat, lon
FUEL_PRICES: dict[str, tuple[str, float, float, float, float, float]] = {
    "AC": ("Acre", 7.45, 5.39, 7.55, -9.97, -67.81),
    "AL": ("Alagoas", 6.39, 4.69, 6.25, -9.65, -35.73),
    "AP": ("Amapá", 6.69, 5.49, 6.85, 0.03, -51.07),
    "AM": ("Amazonas", 6.99, 5.09, 7.05, -3.12, -60.02),
    "BA": ("Bahia", 6.49, 4.59, 6.19, -12.97, -38.50),
    "CE": ("Ceará", 6.45, 4.89, 6.29, -3.73, -38.52),
    "DF": ("Distrito Federal", 6.39, 4.49, 6.25, -15.79, -47.88),
    "ES": ("Espírito Santo", 6.55, 4.79, 6.29, -20.32, -40.34),
    "GO": ("Goiás", 6.39, 4.19, 6.19, -16.68, -49.25),
    "MA": ("Maranhão", 6.29, 4.79, 6.15, -2.53, -44.30),
    "MT": ("Mato Grosso", 6.59, 4.19, 6.45, -15.60, -56.10),
    "MS": ("Mato Grosso do Sul", 6.35, 4.49, 6.29, -20.44, -54.65),
    "MG": ("Minas Gerais", 6.35, 4.19, 6.15, -19.92, -43.94),
    "PA": ("Pará", 6.49, 5.09, 6.45, -1.46, -48.50),
    "PB": ("Paraíba", 6.29, 4.69, 6.15, -7.12, -34.86),
    "PR": ("Paraná", 6.45, 4.29, 6.19, -25.43, -49.27),
    "PE": ("Pernambuco", 6.49, 4.69, 6.19, -8.05, -34.88),
    "PI": ("Piauí", 6.25, 4.59, 6.19, -5.09, -42.80),
    "RJ": ("Rio de Janeiro", 6.45, 4.89, 6.25, -22.91, -43.17),
    "RN": ("Rio Grande do Norte", 6.69, 4.89, 6.35, -5.79, -35.21),
    "RS": ("Rio Grande do Sul", 6.45, 5.09, 6.25, -30.03, -51.23),
    "RO": ("Rondônia", 7.09, 5.19, 6.95, -8.76, -63.90),
    "RR": ("Roraima", 6.79, 5.29, 6.95, 2.82, -60.67),
    "SC": ("Santa Catarina", 6.49, 4.99, 6.19, -27.60, -48.55),
    "SP": ("São Paulo", 6.19, 4.09, 6.09, -23.55, -46.63),
    "SE": ("Sergipe", 6.55, 4.89, 6.29, -10.91, -37.07),
    "TO": ("Tocantins", 6.69, 4.79, 6.55, -10.18, -48.33),
}


def years() -> list[int]:
    current = date.today().year
    return list(range(current + 1, 1989, -1))


def nearest_state(lat: float, lon: float) -> str:
    return min(FUEL_PRICES, key=lambda uf: (FUEL_PRICES[uf][4] - lat) ** 2 + (FUEL_PRICES[uf][5] - lon) ** 2)


def fuel_price(uf: str, fuel: str) -> float:
    row = FUEL_PRICES.get(uf, FUEL_PRICES["SP"])
    return {"gasolina": row[1], "flex": row[1], "etanol": row[2], "diesel": row[3]}.get(fuel, row[1])
