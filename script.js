let database = null;

async function loadDatabase() {
    const btn = document.getElementById('searchBtn');
    try {
        let response = await fetch('nomi.json');
        if (!response.ok) {
            throw new Error("Impossibile leggere il file JSON.");
        }
        database = await response.json();
        btn.innerText = "Cerca Nomi";
        btn.disabled = false;
    } catch (error) {
        console.error("Errore di caricamento:", error);
        btn.innerText = "Errore DB (Vedi Console)";
        document.getElementById('result-list').innerHTML = `<p style="color:red;"><b>Errore critico:</b> Impossibile caricare <code>nomi.json</code>.</p>`;
    }
}

window.onload = loadDatabase;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getLetterFrequencies(str) {
    let freq = {};
    for (let char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

function calcolaDifferenze(inputStr, targetStr) {
    let inputFreq = getLetterFrequencies(inputStr);
    let targetFreq = getLetterFrequencies(targetStr);
    
    let lettereDaAggiungere = 0;
    let lettereDaTogliere = 0;

    for (let char in targetFreq) {
        let necessarie = targetFreq[char];
        let disponibili = inputFreq[char] || 0;
        if (necessarie > disponibili) lettereDaAggiungere += (necessarie - disponibili);
    }

    for (let char in inputFreq) {
        let disponibili = inputFreq[char];
        let necessarie = targetFreq[char] || 0;
        if (disponibili > necessarie) lettereDaTogliere += (disponibili - necessarie);
    }

    return { aggiunte: lettereDaAggiungere, rimozioni: lettereDaTogliere, totale: lettereDaAggiungere + lettereDaTogliere };
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

    let allCombinations = [];
    for (let n of listNomi) {
        for (let c of listCognomi) {
            allCombinations.push({ nome: n, cognome: c, stringaUnita: n + c });
        }
    }

    shuffleArray(allCombinations);
    let resultsFound = 0;

    for (let combo of allCombinations) {
        if (resultsFound >= numResults) break;

        let differenze = calcolaDifferenze(rawInput, combo.stringaUnita);

        if (differenze.totale <= maxJolly) {
            let finalName = combo.nome.charAt(0).toUpperCase() + combo.nome.slice(1);
            let finalLastName = combo.cognome.charAt(0).toUpperCase() + combo.cognome.slice(1);
            
            let nameBox = document.createElement('div');
            nameBox.className = 'generated-name';
            nameBox.innerText = finalName + " " + finalLastName;
            
            let detailsBox = document.createElement('div');
            detailsBox.className = 'match-details';
            detailsBox.innerText = `Jolly usati: ${differenze.totale} (+${differenze.aggiunte} lettere, -${differenze.rimozioni} lettere)`;

            resultListDiv.appendChild(nameBox);
            resultListDiv.appendChild(detailsBox);

            resultsFound++;
        }
    }

    if (resultsFound === 0) {
        resultListDiv.innerHTML = `<p style='color: orange;'>Nessun nome trovato con questi parametri.</p>`;
    }
}