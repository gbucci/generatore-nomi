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

    // Gestione del box di stato per i tentativi
    let statusBox = document.getElementById('status-box');
    if (!statusBox) {
        statusBox = document.createElement('div');
        statusBox.id = 'status-box';
        statusBox.style.margin = '10px 0';
        statusBox.style.fontStyle = 'italic';
        statusBox.style.color = '#555';
        resultListDiv.parentNode.insertBefore(statusBox, resultListDiv);
    }

    // Mostriamo subito il messaggio iniziale per confermare che la ricerca è partita
    statusBox.innerText = "Inizializzazione ricerca...";

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

        // Aggiorniamo il contatore ogni 100 tentativi per una fluidità visiva costante
        if (tentativiFatti % 100 === 0) {
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

    if (resultsFound > 0) {
        statusBox.innerText = `Ricerca completata in ${tentativiFatti} tentativi. Trovati ${resultsFound} risultati.`;
    } else {
        statusBox.innerText = "";
        resultListDiv.innerHTML = `<p style='color: orange;'>Nessun nome trovato dopo ${tentativiFatti} tentativi. Prova ad aumentare i Jolly o a cambiare input!</p>`;
    }
}