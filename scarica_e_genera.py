import urllib.request
import json

def scarica_e_genera_json():
    print("Connessione alla fonte pubblica affidabile in corso...")
    
    # URL raw stabile e ufficiale del dataset linguistico open-source FrequencyWords
    url_pubblico = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt"
    
    try:
        with urllib.request.urlopen(url_pubblico) as response:
            contenuto = response.read().decode('utf-8')
            
        parole = []
        for line in contenuto.splitlines():
            parts = line.split()
            if parts:
                parola = parts[0].lower().strip()
                # Selezioniamo solo parole composte da sole lettere e lunghe almeno 3 caratteri
                if parola.isalpha() and len(parola) > 2:
                    parole.append(parola)
                    
        # Estraiamo 5000 parole per i nomi e 5000 per i cognomi
        nomi = parole[:5000]
        cognomi = parole[5000:10000] if len(parole) >= 10000 else parole[:5000]
        
        # Struttura JSON finale pronta per il progetto
        database_finale = {
            "nomi": nomi,
            "cognomi": cognomi
        }
        
        # Salvataggio del file locale
        with open("nomi_it.json", "w", encoding="utf-8") as f:
            json.dump(database_finale, f, ensure_ascii=False, indent=4)
            
        print("Successo! Il file 'nomi_it.json' è stato generato correttamente.")
        print(f"Totale nomi: {len(nomi)} | Totale cognomi: {len(cognomi)}")
        
    except Exception as e:
        print(f"Errore durante il recupero dei dati: {e}")

if __name__ == "__main__":
    scarica_e_genera_json()