document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

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
    const openSystemVolumeInput = document.getElementById('openSystemVolume');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    // --- Initial Element Checks (for debugging) ---
    if (!radioOpen) console.error("SCRIPT ERROR: Element with ID 'radioOpen' not found in HTML!");
    if (!radioClosed) console.error("SCRIPT ERROR: Element with ID 'radioClosed' not found in HTML!");
    if (!openSystemInputs) console.error("SCRIPT ERROR: Element with ID 'openSystemInputs' not found in HTML!");
    if (!closedSystemInputs) console.error("SCRIPT ERROR: Element with ID 'closedSystemInputs' not found in HTML!");
    if (!electricalCostSection) console.error("SCRIPT ERROR: Element with ID 'electricalCostSection' not found in HTML!");
    if (!calculateButton) console.error("SCRIPT ERROR: Element with ID 'calculateButton' not found in HTML!");
    if (!resultsSection) console.error("SCRIPT ERROR: Element with ID 'resultsSection' not found in HTML!");
    if (!noResultsMessage) console.error("SCRIPT ERROR: Element with ID 'noResultsMessage' not found in HTML!");
    if (!recircRateInput) console.error("SCRIPT ERROR: Element with ID 'recircRateInput' not found in HTML (meant 'recircRate')!"); // Corrected ID
    if (!openSystemVolumeInput) console.error("SCRIPT ERROR: Element with ID 'openSystemVolumeInput' not found in HTML (meant 'openSystemVolume')!"); // Corrected ID
    if (!closedSystemVolumeInput) console.error("SCRIPT ERROR: Element with ID 'closedSystemVolumeInput' not found in HTML (meant 'closedSystemVolume')!"); // Corrected ID
    if (!electricalCostInput) console.error("SCRIPT ERROR: Element with ID 'electricalCostInput' not found in HTML (meant 'electricalCost')!"); // Corrected ID


    const dbUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    // --- Fetch and parse CSV data ---
    async function loadDatabase() {
        if (typeof Papa === 'undefined') {
            console.error("PapaParse library is NOT LOADED. Please include it in your HTML before script.js.");
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
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: false }); // dynamicTyping false to handle all as strings first
            
            if (parsedData.errors && parsedData.errors.length > 0) {
                console.error("PapaParse errors:", parsedData.errors);
                parsedData.errors.forEach(err => console.error(`PapaParse Error: ${err.message}, Row: ${err.row}`));
                throw new Error("Error parsing CSV data. Check console for details. Some rows might be malformed.");
            }
            database = parsedData.data;

            database = database.map(row => {
                // Helper to safely parse float, return NaN if problematic
                const safeParseFloat = (val) => {
                    const num = parseFloat(val);
                    return isNaN(num) ? NaN : num;
                };

                return {
                    ...row, // Keep original string values for display if needed
                    "Min Recirc Rate (GPM)": safeParseFloat(row["Min Recirc Rate (GPM)"]),
                    "Max Recirc Rate (GPM)": safeParseFloat(row["Max Recirc Rate (GPM)"]),
                    "Tonnage Min": safeParseFloat(row["Tonnage Min"]),
                    "Tonnage Max": safeParseFloat(row["Tonnage Max"]),
                    "Loop Min (gal)": safeParseFloat(row["Loop Min (gal)"]),
                    "Loop Max (gal)": safeParseFloat(row["Loop Max (gal)"]),
                    "Electrical Usage (kWh)": safeParseFloat(row["Electrical Usage (kWh)"]),
                    "Flowrate (GPM)": safeParseFloat(row["Flowrate (GPM)"]) // General flowrate for display
                };
            });
            console.log("Database loaded and parsed successfully. Number of rows:", database.length);
            if (database.length > 0) console.log("First row (parsed):", database[0]);


            if (database.length === 0 && parsedData.meta && parsedData.meta.aborted) {
                 console.warn("Database loading aborted by PapaParse.");
                 if(noResultsMessage) {
                    noResultsMessage.textContent = "Warning: Filtration database loading was aborted during parsing.";
                    noResultsMessage.classList.remove('hidden');
                 }
            } else if (database.length === 0) {
                console.warn("Database loaded but is empty or parsing resulted in no data.");
                 if(noResultsMessage) {
                    noResultsMessage.textContent = "Warning: Filtration database loaded but appears empty or could not be fully parsed.";
                    noResultsMessage.classList.remove('hidden');
                 }
            }


        } catch (error) {
            console.error("Failed to load or parse database:", error);
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

    // --- UI Logic ---
    function toggleInputs() {
        if (!radioOpen || !radioClosed || !openSystemInputs || !closedSystemInputs || !electricalCostSection || !resultsSection || !noResultsMessage) {
            console.error("SCRIPT ERROR in toggleInputs: One or more critical UI elements are missing. Check initial logs.");
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
        console.error("SCRIPT ERROR: Could not add event listeners to radio buttons - elements not found.");
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

            if (!electricalCostInput || (!radioOpen && !radioClosed)) { // Check core elements
                 alert("Critical error: UI elements for calculation are missing.");
                 return;
            }

            const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
            const electricalCost = parseFloat(electricalCostInput.value);

            if (!systemType) {
                alert("Please select a system type (Open or Closed).");
                return;
            }
            if (isNaN(electricalCost) || electricalCost < 0) { // Allow 0 cost
                alert("Please enter a valid Electrical Cost (must be a non-negative number).");
                return;
            }

            let recircRateVal = NaN;
            let openSystemVolumeVal = NaN;
            let closedSystemVolumeVal = NaN;

            if (systemType === 'open') {
                if (!recircRateInput || !openSystemVolumeInput) { // Check specific inputs
                    alert("Critical error: Open system input fields are missing.");
                    return;
                }
                recircRateVal = parseFloat(recircRateInput.value);
                openSystemVolumeVal = parseFloat(openSystemVolumeInput.value);

                if (isNaN(recircRateVal) && isNaN(openSystemVolumeVal)) {
                    alert("For Open systems, please enter either Recirculation Rate or System Volume for Tonnage.");
                    return;
                }
                if (!isNaN(recircRateVal) && recircRateVal <= 0) {
                    alert("Recirculation Rate must be a positive number if entered.");
                    return;
                }
                if (!isNaN(openSystemVolumeVal) && openSystemVolumeVal <= 0) {
                    alert("System Volume for Tonnage must be a positive number if entered.");
                    return;
                }
            } else { // closed system
                if (!closedSystemVolumeInput) { // Check specific input
                     alert("Critical error: Closed system input field is missing.");
                     return;
                }
                closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
                if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) {
                    alert("For Closed systems, please enter a valid, positive System Volume.");
                    return;
                }
            }
            findAndDisplayModels(systemType, recircRateVal, openSystemVolumeVal, closedSystemVolumeVal, electricalCost);
        });
    } else {
        console.error("SCRIPT ERROR: Calculate button not found. Cannot add event listener.");
    }


    function findAndDisplayModels(systemType, recircRate, openVolume, closedVolume, elecCost) {
        let separatorModel = null;
        let vafModel = null;
        let vortisandModel = null;

        console.log(`Searching models. Type: ${systemType}, Recirc: ${recircRate}, OpenVol: ${openVolume}, ClosedVol: ${closedVolume}`);


        for (const row of database) {
            if (!row) continue;
            let match = false;

            if (systemType === 'open') {
                const useRecirc = !isNaN(recircRate) && recircRate > 0; // Ensure it's a positive value if used
                const useTonnage = !isNaN(openVolume) && openVolume > 0; // Ensure it's a positive value if used

                // Debugging individual row checks for "open"
                // console.log(`Checking Open Row: Recirc Input=${recircRate}, Tonnage Input=${openVolume}`);
                // console.log(`Row Data: MinRecirc=${row["Min Recirc Rate (GPM)"]}, MaxRecirc=${row["Max Recirc Rate (GPM)"]}, MinTon=${row["Tonnage Min"]}, MaxTon=${row["Tonnage Max"]}`);

                if (useRecirc && recircRate >= row["Min Recirc Rate (GPM)"] && recircRate <= row["Max Recirc Rate (GPM)"]) {
                    match = true;
                    // console.log("Match on Recirc Rate for row:", row.Model);
                } else if (useTonnage && openVolume >= row["Tonnage Min"] && openVolume <= row["Tonnage Max"]) {
                    match = true;
                    // console.log("Match on Tonnage for row:", row.Model);
                }
            } else { // closed system
                 // Debugging individual row checks for "closed"
                // console.log(`Checking Closed Row: ClosedVol Input=${closedVolume}`);
                // console.log(`Row Data: LoopMin=${row["Loop Min (gal)"]}, LoopMax=${row["Loop Max (gal)"]}`);
                if (!isNaN(closedVolume) && closedVolume > 0 && closedVolume >= row["Loop Min (gal)"] && closedVolume <= row["Loop Max (gal)"]) {
                    match = true;
                    // console.log("Match on Loop Volume for row:", row.Model);
                }
            }

            if (match) {
                const typeFromRow = row["Type"] ? String(row["Type"]).toLowerCase().trim() : '';
                // console.log(`Potential match for type: '${typeFromRow}' with model: ${row.Model}`);
                if (typeFromRow.includes('separator') && !separatorModel) {
                    separatorModel = row;
                    // console.log("Separator model found:", separatorModel.Model);
                } else if (typeFromRow.includes('vaf') && !vafModel) {
                    vafModel = row;
                    // console.log("VAF model found:", vafModel.Model);
                } else if (typeFromRow.includes('vortisand') && !vortisandModel) {
                    vortisandModel = row;
                    // console.log("Vortisand model found:", vortisandModel.Model);
                }
            }
        }
        displayResults(separatorModel, vafModel, vortisandModel, elecCost);
    }

    function displayResults(separator, vaf, vortisand, elecCost) {
        if (!resultsSection || !noResultsMessage) {
            console.error("SCRIPT ERROR in displayResults: resultsSection or noResultsMessage element not found.");
            return;
        }
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden'); // Hide initially, show if no models found
        let anyModelFound = false;

        function updateColumn(typeKey, modelData) {
            const modelEl = document.getElementById(`${typeKey}Model`);
            const flowrateEl = document.getElementById(`${typeKey}Flowrate`);
            const descriptionEl = document.getElementById(`${typeKey}Description`);
            const opCostEl = document.getElementById(`${typeKey}OpCost`);

            if (!modelEl || !flowrateEl || !descriptionEl || !opCostEl) {
                console.error(`SCRIPT ERROR in displayResults: One or more display elements for type '${typeKey}' not found.`);
                return false; // Indicate that this column couldn't be updated
            }

            if (modelData) {
                modelEl.textContent = modelData["Model"] || 'N/A';
                // Use the Flowrate (GPM) column from CSV for display, fallback to N/A
                flowrateEl.textContent = modelData["Flowrate (GPM)"] != null && !isNaN(modelData["Flowrate (GPM)"]) ? modelData["Flowrate (GPM)"] : 'N/A';
                descriptionEl.textContent = modelData["Description"] || 'N/A';
                const usage = modelData["Electrical Usage (kWh)"];
                const cost = !isNaN(usage) && !isNaN(elecCost) ? (usage * elecCost).toFixed(2) : 'N/A';
                opCostEl.textContent = cost; // Removed $/year, user can add if needed based on kWh unit
                return true; // Indicate a model was found and displayed for this column
            } else {
                modelEl.textContent = '-';
                flowrateEl.textContent = '-';
                descriptionEl.textContent = 'No suitable model found';
                opCostEl.textContent = '-';
                return false; // Indicate no model for this column
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
             // Optionally hide the entire grid if no models found at all.
            // if (resultsSection) resultsSection.classList.add('hidden');
        }
    }

    // Initial call to set up the visibility
    if (typeof toggleInputs === "function") { // Ensure function exists before calling
        toggleInputs();
        console.log("Initial toggleInputs call performed.");
    } else {
        console.error("SCRIPT ERROR: toggleInputs function is not defined at the time of initial call.");
    }
});