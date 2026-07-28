let database = {
    it: { nomi: [], cognomi: [] },
    en: { nomi: [], cognomi: [] }
};

// Caricamento asincrono multiplo dei file JSON
async function loadDatabase() {
    const btn = document.getElementById('searchBtn');
    const resultListDiv = document.getElementById('result-list');

    try {
        let [resIt, resEn] = await Promise.all([
            fetch('nomi_it.json'),
            fetch('nomi_en.json')
        ]);

        if (!resIt.ok || !resEn.ok) {
            throw new Error(`Errore HTTP! File non trovati (Status: ${resIt.status} / ${resEn.status})`);
        }

        database.it = await resIt.json();
        database.en = await resEn.json();

        btn.innerText = "Cerca Nomi";
        btn.disabled = false;
        resultListDiv.innerHTML = `<p style="color: #777;"><em>Database caricato con successo! Inserisci le lettere.</em></p>`;

    } catch (error) {
        console.error("Errore di caricamento del database:", error);
        btn.innerText = "Errore di caricamento DB";
        btn.disabled = true;
        resultListDiv.innerHTML = `
            <div style="color: red; background: #ffe6e6; padding: 15px; border-radius: 5px;">
                <b>Errore critico di caricamento:</b><br>
                Impossibile trovare o leggere i file <code>nomi_it.json</code> o <code>nomi_en.json</code> nella cartella principale.
            </div>
        `;
    }
}

window.onload = loadDatabase;

function getLetterFrequencies(str) {
    let freq = {};
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

function calcolaDifferenze(inputFreq, targetStr) {
    let targetFreq = getLetterFrequencies(targetStr);
    let lettereDaAggiungere = 0;
    let lettereDaTogliere = 0;

    for (let char in targetFreq) {
        let necessarie = targetFreq[char];
        let disponibili = inputFreq[char] || 0;
        if (necessarie > disponibili) {
            lettereDaAggiungere += (necessarie - disponibili);
        }
    }

    for (let char in inputFreq) {
        let disponibili = inputFreq[char];
        let necessarie = targetFreq[char] || 0;
        if (disponibili > necessarie) {
            lettereDaTogliere += (disponibili - necessarie);
        }
    }

    return lettereDaAggiungere + lettereDaTogliere;
}

// Funzione resa asincrona per permettere l'aggiornamento grafico in tempo reale
async function findRealNames() {
    if (!database || database.it.nomi.length === 0) {
        alert("Il database non è pronto o non è stato caricato correttamente!");
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

    // Creiamo o recuperiamo un elemento visivo dedicato per mostrare i tentativi in tempo reale
    let statusBox = document.getElementById('status-box');
    if (!statusBox) {
        statusBox = document.createElement('div');
        statusBox.id = 'status-box';
        statusBox.style.margin = '10px 0';
        statusBox.style.fontStyle = 'italic';
        statusBox.style.color = '#555';
        resultListDiv.parentNode.insertBefore(statusBox, resultListDiv);
    }

    let listNomi = [];
    let listCognomi = [];
    
    if (lang === "mix") {
        listNomi = database.it.nomi.concat(database.en.nomi);
        listCognomi = database.it.cognomi.concat(database.en.cognomi);
    } else {
        listNomi = database[lang].nomi;
        listCognomi = database[lang].cognomi;
    }

    let inputFreq = getLetterFrequencies(rawInput);
    let inputLength = rawInput.length;

    let nomiFiltrati = listNomi.filter(n => Math.abs(n.length - (inputLength / 2)) <= maxJolly + 6);
    let cognomiFiltrati = listCognomi.filter(c => Math.abs(c.length - (inputLength / 2)) <= maxJolly + 6);

    if (nomiFiltrati.length === 0) nomiFiltrati = listNomi;
    if (cognomiFiltrati.length === 0) cognomiFiltrati = listCognomi;

    let resultsFound = 0;
    let tentativiFatti = 0;
    let massimoTentativi = 25000;
    let coppieTrovateSet = new Set();

    while (resultsFound < numResults && tentativiFatti < massimoTentativi) {
        tentativiFatti++;

        // Ogni 300 tentativi aggiorniamo la schermata e cediamo il controllo al browser
        if (tentativiFatti % 300 === 0) {
            statusBox.innerText = `Tentativi in corso: ${tentativiFatti} / ${massimoTentativi}...`;
            await new Promise(resolve => setTimeout(resolve, 0));
        }

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

    // Aggiorniamo lo stato finale dell'operazione
    if (resultsFound > 0) {
        statusBox.innerText = `Ricerca completata in ${tentativiFatti} tentativi. Trovati ${resultsFound} risultati.`;
    } else {
        statusBox.innerText = "";
        resultListDiv.innerHTML = `<p style='color: orange;'>Nessun nome trovato dopo ${tentativiFatti} tentativi. Prova ad aumentare i Jolly o a cambiare input!</p>`;
    }
}