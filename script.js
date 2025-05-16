document.addEventListener('DOMContentLoaded', () => {
    const radioOpen = document.getElementById('radioOpen');
    const radioClosed = document.getElementById('radioClosed');
    const openSystemInputs = document.getElementById('openSystemInputs');
    const closedSystemInputs = document.getElementById('closedSystemInputs');
    const electricalCostSection = document.getElementById('electricalCostSection');
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');

    const recircRateInput = document.getElementById('recircRate');
    const openSystemVolumeInput = document.getElementById('openSystemVolume'); // For tonnage
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    const dbUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    // Fetch and parse CSV data
    async function loadDatabase() {
        try {
            const response = await fetch(dbUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            database = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
            // Convert relevant numeric fields from string to number
            database = database.map(row => ({
                ...row,
                "Min Recirc Rate (GPM)": parseFloat(row["Min Recirc Rate (GPM)"]),
                "Max Recirc Rate (GPM)": parseFloat(row["Max Recirc Rate (GPM)"]),
                "Tonnage Min": parseFloat(row["Tonnage Min"]),
                "Tonnage Max": parseFloat(row["Tonnage Max"]),
                "Loop Min (gal)": parseFloat(row["Loop Min (gal)"]),
                "Loop Max (gal)": parseFloat(row["Loop Max (gal)"]),
                "Electrical Usage (kWh)": parseFloat(row["Electrical Usage (kWh)"]),
                "Flowrate (GPM)": parseFloat(row["Flowrate (GPM)"]) // Assuming a general flowrate column for display
            }));
            console.log("Database loaded and parsed:", database);
        } catch (error) {
            console.error("Failed to load or parse database:", error);
            resultsSection.classList.remove('hidden');
            noResultsMessage.textContent = "Error: Could not load filtration database.";
            noResultsMessage.classList.remove('hidden');
            // Disable button if DB fails to load
            calculateButton.disabled = true;
            calculateButton.style.backgroundColor = 'grey';

        }
    }
    // Call loadDatabase on script load
    // Need to include PapaParse library for this to work directly in browser
    // For now, assuming PapaParse is loaded (e.g. via CDN in HTML)
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js"></script>
    // Make sure to add the above line in your HTML <head> or before your script.js
    if (typeof Papa === 'undefined') {
        console.error("PapaParse library is not loaded. Please include it in your HTML.");
        alert("Critical error: CSV parsing library not found. The application cannot function.");
        // Display error to user in a more friendly way
        resultsSection.classList.remove('hidden');
        noResultsMessage.textContent = "Critical Error: Application component missing (PapaParse).";
        noResultsMessage.classList.remove('hidden');
        calculateButton.disabled = true;
        calculateButton.style.backgroundColor = 'grey';

    } else {
         loadDatabase();
    }


    function toggleInputs() {
        openSystemInputs.classList.add('hidden');
        closedSystemInputs.classList.add('hidden');
        electricalCostSection.classList.add('hidden');
        resultsSection.classList.add('hidden'); // Hide results when inputs change
        noResultsMessage.classList.add('hidden');


        if (radioOpen.checked) {
            openSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        } else if (radioClosed.checked) {
            closedSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        }
    }

    radioOpen.addEventListener('change', toggleInputs);
    radioClosed.addEventListener('change', toggleInputs);

    calculateButton.addEventListener('click', () => {
        if (database.length === 0) {
            noResultsMessage.textContent = "Database is not loaded. Please try again later or check console for errors.";
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden'); // Ensure results grid is hidden
            return;
        }
        const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
        const electricalCost = parseFloat(electricalCostInput.value);

        if (!systemType) {
            alert("Please select a system type (Open or Closed).");
            return;
        }
        if (isNaN(electricalCost) || electricalCost <= 0) {
            alert("Please enter a valid Electrical Cost (must be a positive number).");
            return;
        }

        let recircRate = NaN;
        let systemVolumeOpen = NaN; // For tonnage comparison
        let systemVolumeClosed = NaN;

        if (systemType === 'open') {
            recircRate = parseFloat(recircRateInput.value);
            systemVolumeOpen = parseFloat(openSystemVolumeInput.value);
            if (isNaN(recircRate) && isNaN(systemVolumeOpen)) {
                alert("For Open systems, please enter either Recirculation Rate or System Volume for Tonnage.");
                return;
            }
             if (!isNaN(recircRate) && recircRate <= 0) {
                alert("Recirculation Rate must be a positive number.");
                return;
            }
            if (!isNaN(systemVolumeOpen) && systemVolumeOpen <= 0) {
                alert("System Volume for Tonnage must be a positive number.");
                return;
            }
        } else { // closed system
            systemVolumeClosed = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(systemVolumeClosed) || systemVolumeClosed <= 0) {
                alert("For Closed systems, please enter a valid System Volume (must be a positive number).");
                return;
            }
        }

        findAndDisplayModels(systemType, recircRate, systemVolumeOpen, systemVolumeClosed, electricalCost);
    });

    function findAndDisplayModels(systemType, recircRate, openVolume, closedVolume, elecCost) {
        let separatorModel = null;
        let vafModel = null;
        let vortisandModel = null;

        for (const row of database) {
            let match = false;
            if (systemType === 'open') {
                // Check Recirc Rate OR Tonnage (using openVolume as proxy for Tonnage input)
                const useRecirc = !isNaN(recircRate);
                const useTonnage = !isNaN(openVolume);

                if (useRecirc && recircRate >= row["Min Recirc Rate (GPM)"] && recircRate <= row["Max Recirc Rate (GPM)"]) {
                    match = true;
                } else if (useTonnage && openVolume >= row["Tonnage Min"] && openVolume <= row["Tonnage Max"]) {
                    match = true;
                }
            } else { // closed system
                if (!isNaN(closedVolume) && closedVolume >= row["Loop Min (gal)"] && closedVolume <= row["Loop Max (gal)"]) {
                    match = true;
                }
            }

            if (match) {
                const type = row["Type"] ? row["Type"].toLowerCase() : '';
                if (type.includes('separator') && !separatorModel) {
                    separatorModel = row;
                } else if (type.includes('vaf') && !vafModel) {
                    vafModel = row;
                } else if (type.includes('vortisand') && !vortisandModel) {
                    vortisandModel = row;
                }
            }
            // If all three types are found, no need to iterate further (optimisation)
            // if (separatorModel && vafModel && vortisandModel) break;
            // Removed break to find potentially different matching models if first ones are not distinct enough.
            // The prompt asks for *a* separator, vaf, and vortisand. The first match of each type will be taken.
        }

        displayResults(separatorModel, vafModel, vortisandModel, elecCost);
    }

    function displayResults(separator, vaf, vortisand, elecCost) {
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        let modelsFound = false;

        // Separator
        if (separator) {
            document.getElementById('separatorModel').textContent = separator["Model"] || 'N/A';
            document.getElementById('separatorFlowrate').textContent = separator["Flowrate (GPM)"] || 'N/A';
            document.getElementById('separatorDescription').textContent = separator["Description"] || 'N/A';
            const opCostSep = !isNaN(separator["Electrical Usage (kWh)"]) && !isNaN(elecCost) ? (separator["Electrical Usage (kWh)"] * elecCost).toFixed(2) : 'N/A';
            document.getElementById('separatorOpCost').textContent = opCostSep + (opCostSep !== 'N/A' ? '/year' : '');
            modelsFound = true;
        } else {
            document.getElementById('separatorModel').textContent = '-';
            document.getElementById('separatorFlowrate').textContent = '-';
            document.getElementById('separatorDescription').textContent = 'No suitable model found';
            document.getElementById('separatorOpCost').textContent = '-';
        }

        // VAF
        if (vaf) {
            document.getElementById('vafModel').textContent = vaf["Model"] || 'N/A';
            document.getElementById('vafFlowrate').textContent = vaf["Flowrate (GPM)"] || 'N/A';
            document.getElementById('vafDescription').textContent = vaf["Description"] || 'N/A';
            const opCostVaf = !isNaN(vaf["Electrical Usage (kWh)"]) && !isNaN(elecCost) ? (vaf["Electrical Usage (kWh)"] * elecCost).toFixed(2) : 'N/A';
            document.getElementById('vafOpCost').textContent = opCostVaf + (opCostVaf !== 'N/A' ? '/year' : '');
            modelsFound = true;
        } else {
            document.getElementById('vafModel').textContent = '-';
            document.getElementById('vafFlowrate').textContent = '-';
            document.getElementById('vafDescription').textContent = 'No suitable model found';
            document.getElementById('vafOpCost').textContent = '-';
        }

        // Vortisand
        if (vortisand) {
            document.getElementById('vortisandModel').textContent = vortisand["Model"] || 'N/A';
            document.getElementById('vortisandFlowrate').textContent = vortisand["Flowrate (GPM)"] || 'N/A';
            document.getElementById('vortisandDescription').textContent = vortisand["Description"] || 'N/A';
            const opCostVor = !isNaN(vortisand["Electrical Usage (kWh)"]) && !isNaN(elecCost) ? (vortisand["Electrical Usage (kWh)"] * elecCost).toFixed(2) : 'N/A';
            document.getElementById('vortisandOpCost').textContent = opCostVor + (opCostVor !== 'N/A' ? '/year' : '');
            modelsFound = true;
        } else {
            document.getElementById('vortisandModel').textContent = '-';
            document.getElementById('vortisandFlowrate').textContent = '-';
            document.getElementById('vortisandDescription').textContent = 'No suitable model found';
            document.getElementById('vortisandOpCost').textContent = '-';
        }
        
        if (!modelsFound) {
            noResultsMessage.classList.remove('hidden');
            // Optionally hide the grid if truly nothing is found for any category
            // resultsSection.classList.add('hidden'); // Or just keep showing the grid with "no model found"
        }
    }
});