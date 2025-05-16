document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - using SCRIPT WITH ENHANCED DEBUGGING.");

    // --- Element Selection ---
    const radioOpen = document.getElementById('radioOpen');
    const radioClosed = document.getElementById('radioClosed');
    const openSystemInputs = document.getElementById('openSystemInputs');
    const closedSystemInputs = document.getElementById('closedSystemInputs');
    const electricalCostSection = document.getElementById('electricalCostSection');
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');

    const recircRateInput = document.getElementById('recircRate');
    const tonnageInput = document.getElementById('tonnage'); // For "Open" system Tonnage
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    // --- Initial Element Checks (for debugging) ---
    if (!radioOpen) console.error("DEBUG SCRIPT: Element with ID 'radioOpen' not found in HTML!");
    if (!radioClosed) console.error("DEBUG SCRIPT: Element with ID 'radioClosed' not found in HTML!");
    if (!openSystemInputs) console.error("DEBUG SCRIPT: Element with ID 'openSystemInputs' not found in HTML!");
    if (!tonnageInput) console.error("DEBUG SCRIPT: Element with ID 'tonnage' (for tonnageInput) not found in HTML!");
    if (!closedSystemInputs) console.error("DEBUG SCRIPT: Element with ID 'closedSystemInputs' not found in HTML!");
    if (!electricalCostSection) console.error("DEBUG SCRIPT: Element with ID 'electricalCostSection' not found in HTML!");
    if (!calculateButton) console.error("DEBUG SCRIPT: Element with ID 'calculateButton' not found in HTML!");
    if (!resultsSection) console.error("DEBUG SCRIPT: Element with ID 'resultsSection' not found in HTML!");
    if (!noResultsMessage) console.error("DEBUG SCRIPT: Element with ID 'noResultsMessage' not found in HTML!");
    if (!recircRateInput) console.error("DEBUG SCRIPT: Element with ID 'recircRate' (for recircRateInput) not found in HTML!");
    if (!closedSystemVolumeInput) console.error("DEBUG SCRIPT: Element with ID 'closedSystemVolume' (for closedSystemVolumeInput) not found in HTML!");
    if (!electricalCostInput) console.error("DEBUG SCRIPT: Element with ID 'electricalCost' (for electricalCostInput) not found in HTML!");


    const dbUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    async function loadDatabase() {
        if (typeof Papa === 'undefined') {
            console.error("DEBUG SCRIPT: PapaParse library is NOT LOADED. Please include it in your HTML before script.js.");
            if(noResultsMessage) {
                noResultsMessage.textContent = "Critical Error: CSV parsing library (PapaParse) not found. Application cannot function.";
                noResultsMessage.classList.remove('hidden');
                if(resultsSection) resultsSection.classList.add('hidden');
            }
            if(calculateButton) {
                 calculateButton.disabled = true;
                 calculateButton.textContent = "Setup Error";
            }
            return;
        }

        try {
            const response = await fetch(dbUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: false });
            
            if (parsedData.errors && parsedData.errors.length > 0) {
                console.error("DEBUG SCRIPT: PapaParse errors:", parsedData.errors);
                parsedData.errors.forEach(err => console.error(`PapaParse Error: ${err.message}, Row: ${err.row}`));
                throw new Error("Error parsing CSV data. Check console for details. Some rows might be malformed.");
            }
            database = parsedData.data;

            database = database.map(row => {
                const safeParseFloat = (val) => {
                    const num = parseFloat(val);
                    return isNaN(num) ? NaN : num;
                };
                return {
                    ...row,
                    "Min Recirc Rate (GPM)": safeParseFloat(row["Min Recirc Rate (GPM)"]),
                    "Max Recirc Rate (GPM)": safeParseFloat(row["Max Recirc Rate (GPM)"]),
                    "Tonnage Min": safeParseFloat(row["Tonnage Min"]),
                    "Tonnage Max": safeParseFloat(row["Tonnage Max"]),
                    "Loop Min (gal)": safeParseFloat(row["Loop Min (gal)"]),
                    "Loop Max (gal)": safeParseFloat(row["Loop Max (gal)"]),
                    "Electrical Usage (kWh)": safeParseFloat(row["Electrical Usage (kWh)"]),
                    "Flowrate (GPM)": safeParseFloat(row["Flowrate (GPM)"])
                };
            });
            console.log("DEBUG SCRIPT: Database loaded and parsed successfully. Number of rows:", database.length);
            if (database.length > 0) console.log("First row (parsed with safeParseFloat applied to specific columns):", database[0]);

            if (database.length === 0 && parsedData.meta && parsedData.meta.aborted) {
                 console.warn("DEBUG SCRIPT: Database loading aborted by PapaParse.");
                 if(noResultsMessage) {
                    noResultsMessage.textContent = "Warning: Filtration database loading was aborted during parsing.";
                    noResultsMessage.classList.remove('hidden');
                 }
            } else if (database.length === 0) {
                console.warn("DEBUG SCRIPT: Database loaded but is empty or parsing resulted in no data.");
                 if(noResultsMessage) {
                    noResultsMessage.textContent = "Warning: Filtration database loaded but appears empty or could not be fully parsed.";
                    noResultsMessage.classList.remove('hidden');
                 }
            }
        } catch (error) {
            console.error("DEBUG SCRIPT: Failed to load or parse database:", error);
            if(noResultsMessage) {
                noResultsMessage.textContent = `Error: Could not load or parse filtration database. ${error.message}`;
                noResultsMessage.classList.remove('hidden');
            }
            if(resultsSection) resultsSection.classList.add('hidden');
            if(calculateButton) {
                calculateButton.disabled = true;
                calculateButton.textContent = "DB Load Error";
            }
        }
    }

    loadDatabase();

    function toggleInputs() {
        if (!radioOpen || !radioClosed || !openSystemInputs || !closedSystemInputs || !electricalCostSection || !resultsSection || !noResultsMessage) {
            console.error("DEBUG SCRIPT in toggleInputs: One or more critical UI elements are missing. Check initial logs.");
            return;
        }

        openSystemInputs.classList.add('hidden');
        closedSystemInputs.classList.add('hidden');
        electricalCostSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');

        if (radioOpen.checked) {
            openSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        } else if (radioClosed.checked) {
            closedSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        }
    }

    if (radioOpen && radioClosed) {
        radioOpen.addEventListener('change', toggleInputs);
        radioClosed.addEventListener('change', toggleInputs);
    } else {
        console.error("DEBUG SCRIPT: Could not add event listeners to radio buttons - elements not found.");
    }

    if (calculateButton) {
        calculateButton.addEventListener('click', () => {
            if (!database || database.length === 0) {
                if(noResultsMessage) {
                    noResultsMessage.textContent = "Database is not loaded or is empty. Please wait or check console for errors.";
                    noResultsMessage.classList.remove('hidden');
                }
                if(resultsSection) resultsSection.classList.add('hidden');
                return;
            }

            if (!electricalCostInput || !radioOpen || !radioClosed) {
                 alert("Critical error: UI elements for calculation are missing.");
                 return;
            }

            const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
            const electricalCost = parseFloat(electricalCostInput.value);

            if (!systemType) {
                alert("Please select a system type (Open or Closed).");
                return;
            }
            if (isNaN(electricalCost) || electricalCost < 0) {
                alert("Please enter a valid Electrical Cost (must be a non-negative number).");
                return;
            }

            let recircRateVal = NaN;
            let tonnageVal = NaN; 
            let closedSystemVolumeVal = NaN;

            if (systemType === 'open') {
                if (!recircRateInput || !tonnageInput) { 
                    alert("Critical error: Open system input fields are missing.");
                    return;
                }
                recircRateVal = parseFloat(recircRateInput.value);
                tonnageVal = parseFloat(tonnageInput.value); 

                if (isNaN(recircRateVal) && isNaN(tonnageVal)) { 
                    alert("For Open systems, please enter either Recirculation Rate or Tonnage.");
                    return;
                }
                if (!isNaN(recircRateVal) && recircRateVal <= 0) {
                    alert("Recirculation Rate must be a positive number if entered.");
                    return;
                }
                if (!isNaN(tonnageVal) && tonnageVal <= 0) { 
                    alert("Tonnage must be a positive number if entered.");
                    return;
                }
            } else { // closed system
                if (!closedSystemVolumeInput) {
                     alert("Critical error: Closed system input field is missing.");
                     return;
                }
                closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
                if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) {
                    alert("For Closed systems, please enter a valid, positive System Volume.");
                    return;
                }
            }
            findAndDisplayModels(systemType, recircRateVal, tonnageVal, closedSystemVolumeVal, electricalCost);
        });
    } else {
        console.error("DEBUG SCRIPT: Calculate button not found. Cannot add event listener.");
    }

    function findAndDisplayModels(systemType, recircRate, tonnage, closedVolume, elecCost) {
        let separatorModel = null;
        let vafModel = null;
        let vortisandModel = null;

        console.log(`---- FINDANDDISPLAYMODELS START ----`);
        console.log(`INPUTS: Type=${systemType}, Recirc=${recircRate} (Type: ${typeof recircRate}), Tonnage=${tonnage} (Type: ${typeof tonnage}), ClosedVol=${closedVolume} (Type: ${typeof closedVolume})`);

        for (const row of database) {
            if (!row || !row.Model) { 
                // console.log("Skipping empty or invalid row:", row);
                continue;
            }
            let match = false;
            // console.log(`--- Checking Row: Model=${row.Model}, Type Column='${row.Type}'`); // Basic row info

            if (systemType === 'open') {
                const useRecirc = !isNaN(recircRate) && recircRate > 0;
                const useTonnageInput = !isNaN(tonnage) && tonnage > 0;

                const rowMinRecirc = row["Min Recirc Rate (GPM)"];
                const rowMaxRecirc = row["Max Recirc Rate (GPM)"];
                const rowTonnageMin = row["Tonnage Min"];
                const rowTonnageMax = row["Tonnage Max"];

                // Uncomment the block below for very verbose per-row, pre-condition logging
                /* console.log(`OPEN SYSTEM CHECK FOR MODEL: ${row.Model}`);
                console.log(`  User Recirc Rate: ${recircRate} (Use: ${useRecirc})`);
                console.log(`  DB Min Recirc: ${rowMinRecirc} (Type: ${typeof rowMinRecirc})`);
                console.log(`  DB Max Recirc: ${rowMaxRecirc} (Type: ${typeof rowMaxRecirc})`);
                console.log(`  User Tonnage: ${tonnage} (Use: ${useTonnageInput})`);
                console.log(`  DB Min Tonnage: ${rowTonnageMin} (Type: ${typeof rowTonnageMin})`);
                console.log(`  DB Max Tonnage: ${rowTonnageMax} (Type: ${typeof rowTonnageMax})`);
                */

                if (useRecirc) {
                    if (typeof rowMinRecirc === 'number' && typeof rowMaxRecirc === 'number' &&
                        recircRate >= rowMinRecirc && recircRate <= rowMaxRecirc) {
                        match = true;
                        console.log(`  MATCHED (Recirc) for ${row.Model}: User ${recircRate} is between DB ${rowMinRecirc}-${rowMaxRecirc}`);
                    } else if (typeof rowMinRecirc !== 'number' || typeof rowMaxRecirc !== 'number') {
                        // Log only if this model was relevant and types were an issue
                        if (row.Model === 'CTS2300' || row.Model === 'CTF1000' || row.Model === 'VC100') { // Example target models
                           console.warn(`  WARNING (Recirc) for ${row.Model}: DB Recirc rates are not numbers. Min: ${rowMinRecirc} (Type: ${typeof rowMinRecirc}), Max: ${rowMaxRecirc} (Type: ${typeof rowMaxRecirc})`);
                        }
                    }
                }

                if (!match && useTonnageInput) {
                    if (typeof rowTonnageMin === 'number' && typeof rowTonnageMax === 'number' &&
                        tonnage >= rowTonnageMin && tonnage <= rowTonnageMax) {
                        match = true;
                        console.log(`  MATCHED (Tonnage) for ${row.Model}: User ${tonnage} is between DB ${rowTonnageMin}-${rowTonnageMax}`);
                    } else if (typeof rowTonnageMin !== 'number' || typeof rowTonnageMax !== 'number') {
                         if (row.Model === 'CTS2300' || row.Model === 'CTF1000' || row.Model === 'VC100') { // Example target models
                            console.warn(`  WARNING (Tonnage) for ${row.Model}: DB Tonnage limits are not numbers. Min: ${rowTonnageMin} (Type: ${typeof rowTonnageMin}), Max: ${rowTonnageMax} (Type: ${typeof rowTonnageMax})`);
                         }
                    }
                }
            } else { // systemType === 'closed'
                const useClosedVolume = !isNaN(closedVolume) && closedVolume > 0;
                const rowLoopMin = row["Loop Min (gal)"];
                const rowLoopMax = row["Loop Max (gal)"];
                
                // Uncomment for verbose closed system checks
                /*
                console.log(`CLOSED SYSTEM CHECK FOR MODEL: ${row.Model}`);
                console.log(`  User System Volume: ${closedVolume} (Use: ${useClosedVolume})`);
                console.log(`  DB Loop Min: ${rowLoopMin} (Type: ${typeof rowLoopMin})`);
                console.log(`  DB Loop Max: ${rowLoopMax} (Type: ${typeof rowLoopMax})`);
                */

                if (useClosedVolume) {
                    if (typeof rowLoopMin === 'number' && typeof rowLoopMax === 'number' &&
                        closedVolume >= rowLoopMin && closedVolume <= rowLoopMax) {
                        match = true;
                        console.log(`  MATCHED (LoopVol) for ${row.Model}: User ${closedVolume} is between DB ${rowLoopMin}-${rowLoopMax}`);
                    } else if (typeof rowLoopMin !== 'number' || typeof rowLoopMax !== 'number') {
                         console.warn(`  WARNING (LoopVol) for ${row.Model}: DB Loop volumes are not numbers. Min: ${rowLoopMin} (Type: ${typeof rowLoopMin}), Max: ${rowLoopMax} (Type: ${typeof rowLoopMax})`);
                    }
                }
            }

            if (match) {
                // console.log(`--- Row ${row.Model} MATCHED overall criteria.`); // Basic match confirmation
                const typeFromRow = row["Type"] ? String(row["Type"]).toLowerCase().trim() : '';
                // console.log(`  Type from DB for ${row.Model}: '${typeFromRow}'`); // Log type string from CSV
                if (typeFromRow.includes('separator') && !separatorModel) {
                    separatorModel = row;
                    console.log(`  ASSIGNED Separator: ${separatorModel.Model}`);
                } else if (typeFromRow.includes('vaf') && !vafModel) {
                    vafModel = row;
                    console.log(`  ASSIGNED VAF: ${vafModel.Model}`);
                } else if (typeFromRow.includes('vortisand') && !vortisandModel) {
                    vortisandModel = row;
                    console.log(`  ASSIGNED Vortisand: ${vortisandModel.Model}`);
                }
            }
        }
        console.log(`---- FINDANDDISPLAYMODELS END ----`);
        displayResults(separatorModel, vafModel, vortisandModel, elecCost);
    }


    function displayResults(separator, vaf, vortisand, elecCost) {
        if (!resultsSection || !noResultsMessage) {
            console.error("DEBUG SCRIPT in displayResults: resultsSection or noResultsMessage element not found.");
            return;
        }
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        let anyModelFound = false;

        function updateColumn(typeKey, modelData) {
            const modelEl = document.getElementById(`${typeKey}Model`);
            const flowrateEl = document.getElementById(`${typeKey}Flowrate`);
            const descriptionEl = document.getElementById(`${typeKey}Description`);
            const opCostEl = document.getElementById(`${typeKey}OpCost`);

            if (!modelEl || !flowrateEl || !descriptionEl || !opCostEl) {
                console.error(`DEBUG SCRIPT in displayResults: One or more display elements for type '${typeKey}' not found.`);
                return false;
            }

            if (modelData) {
                modelEl.textContent = modelData["Model"] || 'N/A';
                flowrateEl.textContent = modelData["Flowrate (GPM)"] != null && !isNaN(modelData["Flowrate (GPM)"]) ? modelData["Flowrate (GPM)"] : 'N/A';
                descriptionEl.textContent = modelData["Description"] || 'N/A';
                const usage = modelData["Electrical Usage (kWh)"]; // This should be a number from parsing
                const cost = !isNaN(usage) && !isNaN(elecCost) ? (usage * elecCost).toFixed(2) : 'N/A';
                opCostEl.textContent = cost;
                return true;
            } else {
                modelEl.textContent = '-';
                flowrateEl.textContent = '-';
                descriptionEl.textContent = 'No suitable model found';
                opCostEl.textContent = '-';
                return false;
            }
        }

        if (updateColumn('separator', separator)) anyModelFound = true;
        if (updateColumn('vaf', vaf)) anyModelFound = true;
        if (updateColumn('vortisand', vortisand)) anyModelFound = true;

        if (!anyModelFound) {
            if (noResultsMessage) {
                noResultsMessage.textContent = "No suitable models found for the given criteria across all categories.";
                noResultsMessage.classList.remove('hidden');
            }
        }
    }

    if (typeof toggleInputs === "function") {
        toggleInputs();
        console.log("DEBUG SCRIPT: Initial toggleInputs call performed.");
    } else {
        console.error("DEBUG SCRIPT: toggleInputs function is not defined at the time of initial call. This shouldn't happen if script is intact.");
    }
});