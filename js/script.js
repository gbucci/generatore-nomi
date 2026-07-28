let database = {
    it: { nomi: [], cognomi: [] },
    en: { nomi: [], cognomi: [] }
};

// Caricamento asincrono multiplo dei file JSON
async function loadDatabase() {
    const btn = document.getElementById('searchBtn');
    try {
        let [resIt, resEn] = await Promise.all([
            fetch('nomi_it.json'),
            fetch('nomi_en.json')
        ]);

        if (!resIt.ok || !resEn.ok) {
            throw new Error("Impossibile leggere uno o più file JSON.");
        }

        database.it = await resIt.json();
        database.en = await resEn.json();

        btn.innerText = "Cerca Nomi";
        btn.disabled = false;
    } catch (error) {
        console.error("Errore di caricamento:", error);
        btn.innerText = "Errore DB (Vedi Console)";
        document.getElementById('result-list').innerHTML = `<p style="color:red;"><b>Errore critico:</b> Impossibile caricare i file JSON.</p>`;
    }
}

window.onload = loadDatabase;

// Funzione rapida per contare le frequenze delle lettere
function getLetterFrequencies(str) {
    let freq = {};
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

// Calcolo ottimizzato delle differenze
function calcolaDifferenze(inputFreq, targetStr) {
    let targetFreq = getLetterFrequencies(targetStr);
    let lettereDaAggiungere = 0;
    let lettereDaTogliere = 0;

    // Controlliamo le lettere necessarie nel target rispetto all'input
    for (let char in targetFreq) {
        let necessarie = targetFreq[char];
        let disponibili = inputFreq[char] || 0;
        if (necessarie > disponibili) {
            lettereDaAggiungere += (necessarie - disponibili);
        }
    }

    // Controlliamo le lettere in eccesso nell'input rispetto al target
    for (let char in inputFreq) {
        let disponibili = inputFreq[char];
        let necessarie = targetFreq[char] || 0;
        if (disponibili > necessarie) {
            lettereDaTogliere += (disponibili - necessarie);
        }
    }

    return lettereDaAggiungere + lettereDaTogliere;
}

function findRealNames() {
    if (!database) {
        alert("Il database non è ancora pronto!");
        return;
    }

    let rawInput = document.getElementById('inputStr').value.toLowerCase().replace(/\s/g, '');
    let maxJolly = parseInt(document.getElementById('maxJolly').value);
    let lang = document.getElementById('language').value;
    let numResults = parseInt(document.getElementById('numResults').value);
    let resultListDiv = document.getElementById('result-list');

    if (rawInput.length === 0) {
        alert("Inserisci delle lettere per iniziare.");
        return;
    }

    resultListDiv.innerHTML = "";
    let listNomi = [];
    let listCognomi = [];
    
    if (lang === "mix") {
        listNomi = database.it.nomi.concat(database.en.nomi);
        listCognomi = database.it.cognomi.concat(database.en.cognomi);
    } else {
        listNomi = database[lang].nomi;
        listCognomi = database[lang].cognomi;
    }

    if (listNomi.length === 0 || listCognomi.length === 0) {
        resultListDiv.innerHTML = `<p style='color: red;'>Il database è vuoto per la lingua selezionata.</p>`;
        return;
    }

    // Ottimizzazione: pre-calcoliamo la frequenza dell'input una sola volta fuori dal ciclo
    let inputFreq = getLetterFrequencies(rawInput);
    let inputLength = rawInput.length;

    // Filtriamo preventivamente le liste per evitare combinazioni con lunghezze assurde
    // Teniamo solo i nomi/cognomi la cui lunghezza combinata non si discosta troppo dall'input + jolly
    let nomiFiltrati = listNomi.filter(n => Math.abs(n.length - (inputLength / 2)) <= maxJolly + 4);
    let cognomiFiltrati = listCognomi.filter(c => Math.abs(c.length - (inputLength / 2)) <= maxJolly + 4);

    // Se il filtro è stato troppo restrittivo, usiamo le liste originali come fallback
    if (nomiFiltrati.length === 0) nomiFiltrati = listNomi;
    if (cognomiFiltrati.length === 0) cognomiFiltrati = listCognomi;

    let resultsFound = 0;
    let tentativiFatti = 0;
    let massimoTentativi = 4000;
    let coppieTrovateSet = new Set();

    while (resultsFound < numResults && tentativiFatti < massimoTentativi) {
        tentativiFatti++;

        let randomNome = nomiFiltrati[Math.floor(Math.random() * nomiFiltrati.length)];
        let randomCognome = cognomiFiltrati[Math.floor(Math.random() * cognomiFiltrati.length)];
        let stringaUnita = randomNome + randomCognome;

        let chiaveUnica = randomNome + "_" + randomCognome;
        if (coppieTrovateSet.has(chiaveUnica)) continue;

        let totaleDifferenze = calcolaDifferenze(inputFreq, stringaUnita);

        if (totaleDifferenze <= maxJolly) {
            coppieTrovateSet.add(chiaveUnica);
            resultsFound++;

            let finalName = randomNome.charAt(0).toUpperCase() + randomNome.slice(1);
            let finalLastName = randomCognome.charAt(0).toUpperCase() + randomCognome.slice(1);
            
            let nameBox = document.createElement('div');
            nameBox.className = 'generated-name';
            nameBox.innerText = finalName + " " + finalLastName;
            
            let detailsBox = document.createElement('div');
            detailsBox.className = 'match-details';
            detailsBox.innerText = `Jolly usati: ${totaleDifferenze}`;

            resultListDiv.appendChild(nameBox);
            resultListDiv.appendChild(detailsBox);
        }
    }

    if (resultsFound === 0) {
        resultListDiv.innerHTML = `<p style='color: orange;'>Nessun nome trovato con questi parametri. Prova ad aumentare i Jolly o a cambiare input!</p>`;
    }
}
