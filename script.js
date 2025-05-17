document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - using SCRIPT WITH CORRECTED CSV KEY MAPPING (vMay16_KeyFix).");

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
    const tonnageInput = document.getElementById('tonnage'); 
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    // --- Initial Element Checks ---
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

            // Correctly map CSV headers to the properties the script expects, and parse numbers
            database = database.map(row => {
                const safeParseFloat = (val) => {
                    if (typeof val === 'string') {
                        val = val.replace(/\$|,/g, ''); // Remove $ and commas that might interfere with parseFloat
                    }
                    const num = parseFloat(val);
                    return isNaN(num) ? NaN : num;
                };
                
                const newRow = {}; 
                // Copy all original properties from the CSV row
                for (const key in row) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        newRow[key] = row[key];
                    }
                }

                // IMPORTANT: Map CSV's "Filter Type" to what the script expects as "Type"
                // This new "Type" property will be used by findAndDisplayModels
                newRow["Type"] = row["Filter Type"]; 

                // Overwrite specific properties with their parsed numeric versions,
                // using the exact CSV header key (from the original 'row' object) as the source.
                // The destination key (e.g., "Min Recirc Rate (GPM)") is what the rest of the script will use.
                // Based on previous logs, CSV uses "Min Recirc Rate (gpm)" (lowercase gpm) and "Flow Rate"
                newRow["Min Recirc Rate (GPM)"] = safeParseFloat(row["Min Recirc Rate (gpm)"]);
                newRow["Max Recirc Rate (GPM)"] = safeParseFloat(row["Max Recirc Rate (gpm)"]);
                // **YOU MUST VERIFY AND ADJUST THE FOLLOWING KEYS TO MATCH YOUR CSV HEADER EXACTLY**
                newRow["Tonnage Min"] = safeParseFloat(row["Tonnage Min"]); 
                newRow["Tonnage Max"] = safeParseFloat(row["Tonnage Max"]); 
                newRow["Loop Min (gal)"] = safeParseFloat(row["Loop Min (gal)"]);
                newRow["Loop Max (gal)"] = safeParseFloat(row["Loop Max (gal)"]);
                newRow["Electrical Usage (kWh)"] = safeParseFloat(row["Electrical Usage (kWh)"]);
                newRow["Flowrate (GPM)"] = safeParseFloat(row["Flow Rate"]); // For display

                return newRow;
            });

            console.log("DEBUG SCRIPT: Database loaded and parsed. Number of rows:", database.length);
            if (database.length > 0) {
                console.log("First row (after corrected key mapping and parsing):", database[0]);
                // Log the types and values of critical parsed fields for the first row
                console.log(`  First row's "Min Recirc Rate (GPM)" (parsed): type=${typeof database[0]["Min Recirc Rate (GPM)"]}, value=${database[0]["Min Recirc Rate (GPM)"]}`);
                console.log(`  First row's "Max Recirc Rate (GPM)" (parsed): type=${typeof database[0]["Max Recirc Rate (GPM)"]}, value=${database[0]["Max Recirc Rate (GPM)"]}`);
                console.log(`  First row's "Tonnage Min" (parsed): type=${typeof database[0]["Tonnage Min"]}, value=${database[0]["Tonnage Min"]}`);
                console.log(`  First row's "Type" (mapped from "Filter Type"): type=${typeof database[0]["Type"]}, value=${database[0]["Type"]}`);
                console.log(`  First row's original "Min Recirc Rate (gpm)": type=${typeof database[0]["Min Recirc Rate (gpm)"]}, value=${database[0]["Min Recirc Rate (gpm)"]}`); // Log original from CSV
                console.log(`  First row's original "Filter Type": type=${typeof database[0]["Filter Type"]}, value=${database[0]["Filter Type"]}`); // Log original from CSV

            }

            if (database.length === 0 && parsedData.meta && parsedData.meta.aborted) {
                 console.warn("DEBUG SCRIPT: Database loading aborted by PapaParse.");
                 if(noResultsMessage) { /* ... */ }
            } else if (database.length === 0) {
                console.warn("DEBUG SCRIPT: Database loaded but is empty or parsing resulted in no data.");
                 if(noResultsMessage) { /* ... */ }
            }
        } catch (error) {
            console.error("DEBUG SCRIPT: Failed to load or parse database:", error);
            if(noResultsMessage) { /* ... */ }
            if(resultsSection) resultsSection.classList.add('hidden');
            if(calculateButton) { /* ... */ }
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
                if(noResultsMessage) { /* ... */ }
                if(resultsSection) resultsSection.classList.add('hidden');
                return;
            }
            if (!electricalCostInput || !radioOpen || !radioClosed) { /* ... */ return; }

            const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
            const electricalCost = parseFloat(electricalCostInput.value);

            if (!systemType) { /* ... */ return; }
            if (isNaN(electricalCost) || electricalCost < 0) { /* ... */ return; }

            let recircRateVal = NaN;
            let tonnageVal = NaN; 
            let closedSystemVolumeVal = NaN;

            if (systemType === 'open') {
                if (!recircRateInput || !tonnageInput) { /* ... */ return; }
                recircRateVal = parseFloat(recircRateInput.value);
                tonnageVal = parseFloat(tonnageInput.value); 
                if (isNaN(recircRateVal) && isNaN(tonnageVal)) { /* ... */ return; }
                if (!isNaN(recircRateVal) && recircRateVal <= 0) { /* ... */ return; }
                if (!isNaN(tonnageVal) && tonnageVal <= 0) { /* ... */ return; }
            } else { 
                if (!closedSystemVolumeInput) { /* ... */ return; }
                closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
                if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) { /* ... */ return; }
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
        console.log(`Database has ${database.length} rows. Attempting to loop...`);

        for (const row of database) {
            // The 'row' object here should have properties like row["Min Recirc Rate (GPM)"] (as numbers)
            // and row["Type"] (mapped from "Filter Type" in CSV)
            console.log(`LOOPING: Processing Model: ${row ? row.Model : 'NO MODEL'}, Script's 'Type': ${row ? row["Type"] : 'NO TYPE'}, Parsed MinRecirc: ${row ? row["Min Recirc Rate (GPM)"] : 'NO MinRecirc'}`);
            
            if (!row || !row.Model) { 
                console.log("Skipping empty or invalid row (no Model property):", row);
                continue;
            }
            let match = false;
            
            if (systemType === 'open') {
                const useRecirc = !isNaN(recircRate) && recircRate > 0;
                const useTonnageInput = !isNaN(tonnage) && tonnage > 0;

                const rowMinRecirc = row["Min Recirc Rate (GPM)"]; 
                const rowMaxRecirc = row["Max Recirc Rate (GPM)"];
                const rowTonnageMin = row["Tonnage Min"];
                const rowTonnageMax = row["Tonnage Max"];
                
                if (useRecirc) {
                    if (typeof rowMinRecirc === 'number' && typeof rowMaxRecirc === 'number' &&
                        recircRate >= rowMinRecirc && recircRate <= rowMaxRecirc) {
                        match = true;
                        console.log(`  MATCHED (Recirc) for ${row.Model}: User ${recircRate} is between DB ${rowMinRecirc}-${rowMaxRecirc}`);
                    } else if (typeof rowMinRecirc !== 'number' || typeof rowMaxRecirc !== 'number') {
                         if (row.Model && (row.Model.includes('CTS') || row.Model.includes('CTF') || row.Model.includes('VC'))) { 
                           console.warn(`  WARNING (Recirc) for ${row.Model}: DB Recirc rates are not numbers or NaN. Min: ${rowMinRecirc} (Type: ${typeof rowMinRecirc}), Max: ${rowMaxRecirc} (Type: ${typeof rowMaxRecirc})`);
                        }
                    }
                }

                if (!match && useTonnageInput) {
                    if (typeof rowTonnageMin === 'number' && typeof rowTonnageMax === 'number' &&
                        tonnage >= rowTonnageMin && tonnage <= rowTonnageMax) {
                        match = true;
                        console.log(`  MATCHED (Tonnage) for ${row.Model}: User ${tonnage} is between DB ${rowTonnageMin}-${rowTonnageMax}`);
                    } else if (typeof rowTonnageMin !== 'number' || typeof rowTonnageMax !== 'number') {
                         if (row.Model && (row.Model.includes('CTS') || row.Model.includes('CTF') || row.Model.includes('VC'))) { 
                            console.warn(`  WARNING (Tonnage) for ${row.Model}: DB Tonnage limits are not numbers or NaN. Min: ${rowTonnageMin} (Type: ${typeof rowTonnageMin}), Max: ${rowTonnageMax} (Type: ${typeof rowTonnageMax})`);
                         }
                    }
                }
            } else { // systemType === 'closed'
                const useClosedVolume = !isNaN(closedVolume) && closedVolume > 0;
                const rowLoopMin = row["Loop Min (gal)"];
                const rowLoopMax = row["Loop Max (gal)"];

                if (useClosedVolume) {
                    if (typeof rowLoopMin === 'number' && typeof rowLoopMax === 'number' &&
                        closedVolume >= rowLoopMin && closedVolume <= rowLoopMax) {
                        match = true;
                        console.log(`  MATCHED (LoopVol) for ${row.Model}: User ${closedVolume} is between DB ${rowLoopMin}-${rowLoopMax}`);
                    } else if (typeof rowLoopMin !== 'number' || typeof rowLoopMax !== 'number') {
                         console.warn(`  WARNING (LoopVol) for ${row.Model}: DB Loop volumes are not numbers or NaN. Min: ${rowLoopMin} (Type: ${typeof rowLoopMin}), Max: ${rowLoopMax} (Type: ${typeof rowLoopMax})`);
                    }
                }
            }

            if (match) {
                const typeFromRow = row["Type"] ? String(row["Type"]).toLowerCase().trim() : ''; 
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
        if (!resultsSection || !noResultsMessage) { /* ... */ return; }
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        let anyModelFound = false;

        function updateColumn(typeKey, modelData) {
            const modelEl = document.getElementById(`${typeKey}Model`);
            const flowrateEl = document.getElementById(`${typeKey}Flowrate`);
            const descriptionEl = document.getElementById(`${typeKey}Description`);
            const opCostEl = document.getElementById(`${typeKey}OpCost`);

            if (!modelEl || !flowrateEl || !descriptionEl || !opCostEl) { /* ... */ return false; }

            if (modelData) {
                modelEl.textContent = modelData["Model"] || 'N/A';
                flowrateEl.textContent = modelData["Flowrate (GPM)"] != null && !isNaN(modelData["Flowrate (GPM)"]) ? modelData["Flowrate (GPM)"] : 'N/A';
                descriptionEl.textContent = modelData["Description"] || 'N/A';
                const usage = modelData["Electrical Usage (kWh)"];
                const cost = !isNaN(usage) && !isNaN(elecCost) ? (usage * elecCost).toFixed(2) : 'N/A';
                opCostEl.textContent = cost;
                return true;
            } else { /* ... set to '-' ... */ return false; }
        }

        if (updateColumn('separator', separator)) anyModelFound = true;
        if (updateColumn('vaf', vaf)) anyModelFound = true;
        if (updateColumn('vortisand', vortisand)) anyModelFound = true;

        if (!anyModelFound) {
            if (noResultsMessage) { /* ... show no results message ... */ }
        }
    }

    if (typeof toggleInputs === "function") {
        toggleInputs();
        console.log("DEBUG SCRIPT: Initial toggleInputs call performed.");
    } else {
        console.error("DEBUG SCRIPT: toggleInputs function is not defined at the time of initial call.");
    }
});