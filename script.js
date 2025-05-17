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
                newRow["Min Recirc Rate (GPM)"] = safeParseFloat(csvMinRecirc); // Assign to