document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - using SCRIPT WITH DETAILED CSV MAPPING/PARSING (vMay16_FullScriptDebug).");

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
            // Ensure PapaParse uses headers and skips empty lines. dynamicTyping: false is safer for manual parsing.
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: false });
            
            if (parsedData.errors && parsedData.errors.length > 0) {
                console.error("DEBUG SCRIPT: PapaParse errors:", parsedData.errors);
                parsedData.errors.forEach(err => console.error(`PapaParse Error: Type=${err.type}, Code=${err.code}, Message='${err.message}', Row=${err.row}`));
                throw new Error("Error parsing CSV data. Check console for details. Some rows might be malformed.");
            }
            database = parsedData.data;

            // Correctly map CSV headers to the properties the script expects, and parse numbers
            database = database.map((row, index) => { // Added index for logging
                const safeParseFloat = (val) => {
                    if (typeof val === 'string') {
                        val = val.replace(/\$|,/g, ''); // Remove $ and commas that might interfere with parseFloat
                    }
                    const num = parseFloat(val);
                    return isNaN(num) ? NaN : num;
                };
                
                const newRow = {}; 
                // Copy all original properties from the CSV row first
                // This ensures any columns not explicitly parsed/mapped are still available if needed elsewhere
                // And helps in debugging by comparing original vs parsed.
                for (const key in row) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        newRow[key] = row[key]; // This carries over original string values for original keys
                    }
                }

                // --- BEGIN CRITICAL MAPPING AND PARSING ---
                // The key for newRow (e.g., "Type") is what the rest of the script will use.
                // The key for row (e.g., row["Filter Type"]) MUST match your CSV header EXACTLY.

                // Type Mapping
                const csvFilterType = row["Filter Type"]; // Read from CSV (assuming this is the header)
                newRow["Type"] = csvFilterType;          // Assign to script's expected 'Type' property
                if (index === 0) console.log(`MAP_DEBUG Row 0: Original CSV 'Filter Type'='${csvFilterType}', Mapped to newRow['Type']='${newRow["Type"]}'`);

                // Min Recirc Rate
                const csvMinRecirc = row["Min Recirc Rate (gpm)"]; // Read from CSV (assuming lowercase gpm based on logs)
                newRow["Min Recirc Rate (GPM)"] = safeParseFloat(csvMinRecirc); // Assign to script's 'Min Recirc Rate (GPM)' (uppercase GPM)
                if (index === 0) console.log(`MAP_DEBUG Row 0: Original CSV 'Min Recirc Rate (gpm)'='${csvMinRecirc}' (type: ${typeof csvMinRecirc}), Parsed to newRow['Min Recirc Rate (GPM)']=${newRow["Min Recirc Rate (GPM)"]} (type: ${typeof newRow["Min Recirc Rate (GPM)"]})`);

                // Max Recirc Rate
                const csvMaxRecirc = row["Max Recirc Rate (gpm)"]; // Read from CSV (assuming lowercase gpm)
                newRow["Max Recirc Rate (GPM)"] = safeParseFloat(csvMaxRecirc);
                if (index === 0) console.log(`MAP_DEBUG Row 0: Original CSV 'Max Recirc Rate (gpm)'='${csvMaxRecirc}' (type: ${typeof csvMaxRecirc}), Parsed to newRow['Max Recirc Rate (GPM)']=${newRow["Max Recirc Rate (GPM)"]} (type: ${typeof newRow["Max Recirc Rate (GPM)"]})`);

                // Tonnage Min - **VERIFY CSV HEADER NAME FOR "Tonnage Min"**
                const csvTonnageMin = row["Tonnage Min"]; // Example: Assumes CSV header is "Tonnage Min"
                newRow["Tonnage Min"] = safeParseFloat(csvTonnageMin);
                if (index === 0) console.log(`MAP_DEBUG Row 0: Original CSV 'Tonnage Min'='${csvTonnageMin}' (type: ${typeof csvTonnageMin}), Parsed to newRow['Tonnage Min']=${newRow["Tonnage Min"]} (type: ${typeof newRow["Tonnage Min"]})`);
                
                // Tonnage Max - **VERIFY CSV HEADER NAME FOR "Tonnage Max"**
                const csvTonnageMax = row["Tonnage Max"]; // Example: Assumes CSV header is "Tonnage Max"
                newRow["Tonnage Max"] = safeParseFloat(csvTonnageMax);

                // Loop Min (gal) - **VERIFY CSV HEADER NAME FOR "Loop Min (gal)"**
                const csvLoopMin = row["Loop Min (gal)"]; // Example: Assumes CSV header is "Loop Min (gal)"
                newRow["Loop Min (gal)"] = safeParseFloat(csvLoopMin);

                // Loop Max (gal) - **VERIFY CSV HEADER NAME FOR "Loop Max (gal)"**
                const csvLoopMax = row["Loop Max (gal)"]; // Example: Assumes CSV header is "Loop Max (gal)"
                newRow["Loop Max (gal)"] = safeParseFloat(csvLoopMax);

                // Electrical Usage (kWh) - **VERIFY CSV HEADER NAME FOR "Electrical Usage (kWh)"**
                const csvElecUsage = row["Electrical Usage (kWh)"]; // Example: Assumes CSV header is "Electrical Usage (kWh)"
                newRow["Electrical Usage (kWh)"] = safeParseFloat(csvElecUsage);

                // Flowrate (GPM) for display - **VERIFY CSV HEADER NAME (e.g., "Flow Rate")**
                const csvFlowRate = row["Flow Rate"]; // Read from CSV (assuming "Flow Rate" based on logs)
                newRow["Flowrate (GPM)"] = safeParseFloat(csvFlowRate); // Assign to script's 'Flowrate (GPM)'
                if (index === 0) console.log(`MAP_DEBUG Row 0: Original CSV 'Flow Rate'='${csvFlowRate}' (type: ${typeof csvFlowRate}), Parsed to newRow['Flowrate (GPM)']=${newRow["Flowrate (GPM)"]} (type: ${typeof newRow["Flowrate (GPM)"]})`);
                
                // --- END CRITICAL MAPPING AND PARSING ---

                return newRow;
            });

            console.log("DEBUG SCRIPT: Database mapping and parsing complete. Number of rows:", database.length);
            if (database.length > 0) {
                console.log("First row (object structure after .map operation):", database[0]);
                // Detailed check of specifically parsed numeric fields for the first row:
                console.log(`  VERIFY PARSED - First row's "Min Recirc Rate (GPM)": type=${typeof database[0]["Min Recirc Rate (GPM)"]}, value=${database[0]["Min Recirc Rate (GPM)"]}`);
                console.log(`  VERIFY PARSED - First row's "Max Recirc Rate (GPM)": type=${typeof database[0]["Max Recirc Rate (GPM)"]}, value=${database[0]["Max Recirc Rate (GPM)"]}`);
                console.log(`  VERIFY PARSED - First row's "Tonnage Min": type=${typeof database[0]["Tonnage Min"]}, value=${database[0]["Tonnage Min"]}`);
                console.log(`  VERIFY MAPPED - First row's "Type": type=${typeof database[0]["Type"]}, value=${database[0]["Type"]}`);
            }

            if (database.length === 0 && parsedData.meta && parsedData.meta.aborted) {
                 console.warn("DEBUG SCRIPT: Database loading aborted by PapaParse.");
                 if(noResultsMessage) { noResultsMessage.textContent = "Warning: Filtration database loading was aborted during parsing."; noResultsMessage.classList.remove('hidden'); }
            } else if (database.length === 0) {
                console.warn("DEBUG SCRIPT: Database loaded but is empty or parsing resulted in no data.");
                 if(noResultsMessage) { noResultsMessage.textContent = "Warning: Filtration database loaded but appears empty or could not be fully parsed."; noResultsMessage.classList.remove('hidden'); }
            }
        } catch (error) {
            console.error("DEBUG SCRIPT: Failed to load or parse database:", error);
            if(noResultsMessage) { noResultsMessage.textContent = `Error: Could not load or parse filtration database. ${error.message}`; noResultsMessage.classList.remove('hidden'); }
            if(resultsSection) resultsSection.classList.add('hidden');
            if(calculateButton) { calculateButton.disabled = true; calculateButton.textContent = "DB Load Error"; }
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
                if(noResultsMessage) { noResultsMessage.textContent = "Database is not loaded or is empty. Please wait or check console for errors."; noResultsMessage.classList.remove('hidden'); }
                if(resultsSection) resultsSection.classList.add('hidden');
                return;
            }
            if (!electricalCostInput || !radioOpen || !radioClosed) { alert("Critical error: UI elements for calculation are missing."); return; }

            const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
            const electricalCost = parseFloat(electricalCostInput.value);

            if (!systemType) { alert("Please select a system type (Open or Closed)."); return; }
            if (isNaN(electricalCost) || electricalCost < 0) { alert("Please enter a valid Electrical Cost (must be a non-negative number)."); return; }

            let recircRateVal = NaN;
            let tonnageVal = NaN; 
            let closedSystemVolumeVal = NaN;

            if (systemType === 'open') {
                if (!recircRateInput || !tonnageInput) { alert("Critical error: Open system input fields are missing."); return; }
                recircRateVal = parseFloat(recircRateInput.value);
                tonnageVal = parseFloat(tonnageInput.value); 
                if (isNaN(recircRateVal) && isNaN(tonnageVal)) { alert("For Open systems, please enter either Recirculation Rate or Tonnage."); return; }
                if (!isNaN(recircRateVal) && recircRateVal <= 0) { alert("Recirculation Rate must be a positive number if entered."); return; }
                if (!isNaN(tonnageVal) && tonnageVal <= 0) { alert("Tonnage must be a positive number if entered."); return; }
            } else { 
                if (!closedSystemVolumeInput) { alert("Critical error: Closed system input field is missing."); return; }
                closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
                if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) { alert("For Closed systems, please enter a valid, positive System Volume."); return; }
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
            console.log(`LOOPING: Processing Model: ${row ? row.Model : 'NO MODEL'}, Script's 'Type': ${row ? row["Type"] : 'NO TYPE'}, Parsed MinRecirc: ${row && row["Min Recirc Rate (GPM)"] !== undefined ? row["Min Recirc Rate (GPM)"] : 'NOT PARSED/MISSING'}`);
            
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
        if (!resultsSection || !noResultsMessage) { console.error("DEBUG SCRIPT in displayResults: resultsSection or noResultsMessage element not found."); return; }
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        let anyModelFound = false;

        function updateColumn(typeKey, modelData) {
            const modelEl = document.getElementById(`${typeKey}Model`);
            const flowrateEl = document.getElementById(`${typeKey}Flowrate`);
            const descriptionEl = document.getElementById(`${typeKey}Description`);
            const opCostEl = document.getElementById(`${typeKey}OpCost`);

            if (!modelEl || !flowrateEl || !descriptionEl || !opCostEl) { console.error(`DEBUG SCRIPT in displayResults: One or more display elements for type '${typeKey}' not found.`); return false; }

            if (modelData) {
                modelEl.textContent = modelData["Model"] || 'N/A';
                flowrateEl.textContent = modelData["Flowrate (GPM)"] != null && !isNaN(modelData["Flowrate (GPM)"]) ? modelData["Flowrate (GPM)"] : 'N/A';
                descriptionEl.textContent = modelData["Description"] || 'N/A';
                const usage = modelData["Electrical Usage (kWh)"];
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
            if (noResultsMessage) { noResultsMessage.textContent = "No suitable models found for the given criteria across all categories."; noResultsMessage.classList.remove('hidden');}
        }
    }

    if (typeof toggleInputs === "function") {
        toggleInputs();
        console.log("DEBUG SCRIPT: Initial toggleInputs call performed.");
    } else {
        console.error("DEBUG SCRIPT: toggleInputs function is not defined at the time of initial call.");
    }
});