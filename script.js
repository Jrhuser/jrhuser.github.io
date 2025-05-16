document.addEventListener('DOMContentLoaded', () => {
    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');
    const openInputsSection = document.getElementById('openInputs');
    const closedInputsSection = document.getElementById('closedInputs');
    const calculateButton = document.getElementById('calculateButton');
    const outputSection = document.getElementById('outputSection');

    const recircRateInput = document.getElementById('recircRate');
    const openSystemVolumeInput = document.getElementById('openSystemVolume');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    // --- Google Sheet Configuration ---
    // IMPORTANT: Make sure your Google Sheet is published to the web as a CSV.
    // File > Share > Publish to web > Select the relevant sheet > CSV > Publish
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv'; // **REPLACE WITH YOUR PUBLISHED CSV URL**
    let database = [];

    // Function to fetch and parse CSV data
    async function fetchData() {
        try {
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            database = parseCSV(csvText);
            console.log("Database loaded:", database);
        } catch (error) {
            console.error("Error fetching or parsing spreadsheet data:", error);
            alert("Could not load the database. Please check the console for errors and ensure the Google Sheet is published correctly as a CSV.");
        }
    }

    // Function to parse CSV text into an array of objects
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            if (values.length === headers.length) { // Ensure row has same number of columns as headers
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            }
        }
        return data;
    }

    // Event listener for system type change
    openSystemRadio.addEventListener('change', toggleInputSections);
    closedSystemRadio.addEventListener('change', toggleInputSections);

    function toggleInputSections() {
        if (openSystemRadio.checked) {
            openInputsSection.style.display = 'block';
            closedInputsSection.style.display = 'none';
        } else {
            openInputsSection.style.display = 'none';
            closedInputsSection.style.display = 'block';
        }
    }

    // Event listener for the calculate button
    calculateButton.addEventListener('click', () => {
        if (database.length === 0) {
            alert("Database is not loaded yet. Please wait or try refreshing.");
            return;
        }

        const systemType = openSystemRadio.checked ? 'open' : 'closed';
        const electricalCost = parseFloat(electricalCostInput.value);

        if (isNaN(electricalCost) || electricalCost <= 0) {
            alert("Please enter a valid electrical cost.");
            return;
        }

        let inputValue;
        let inputType; // 'recirc' or 'volume'

        if (systemType === 'open') {
            const recircRate = parseFloat(recircRateInput.value);
            const openVolume = parseFloat(openSystemVolumeInput.value);

            if (!isNaN(recircRate) && recircRate > 0) {
                inputValue = recircRate;
                inputType = 'recirc';
            } else if (!isNaN(openVolume) && openVolume > 0) {
                inputValue = openVolume;
                inputType = 'volume';
            } else {
                alert("For Open systems, please enter a valid Recirc Rate or System Volume.");
                return;
            }
        } else { // Closed system
            const closedVolume = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(closedVolume) || closedVolume <= 0) {
                alert("For Closed systems, please enter a valid System Volume.");
                return;
            }
            inputValue = closedVolume;
            inputType = 'volume';
        }

        // Find matching models from the database
        const results = findMatchingModels(systemType, inputType, inputValue, electricalCost);
        displayResults(results);
        outputSection.style.display = 'block';
    });

    function findMatchingModels(systemType, inputType, value, electricalCost) {
        const matchedModels = {
            separator: null,
            vaf: null,
            vortisand: null
        };

        database.forEach(model => {
            const type = model['Type']?.toLowerCase(); // Separator, VAF, Vortisand
            const system = model['System']?.toLowerCase(); // Open or Closed
            const minRecirc = parseFloat(model['Min Recirc (GPM)']);
            const maxRecirc = parseFloat(model['Max Recirc (GPM)']);
            const minVolume = parseFloat(model['Min System Volume (Gal)']);
            const maxVolume = parseFloat(model['Max System Volume (Gal)']);
            const flowrate = parseFloat(model['Flowrate (GPM)']); // Assuming 'Flowrate (GPM)' column exists for output
            const hp = parseFloat(model['HP']); // Horsepower
            const kw = hp * 0.7457; // Convert HP to kW
            const annualHours = 8760; // Hours in a year (can be made an input if needed)

            let isMatch = false;

            if (system === systemType) {
                if (inputType === 'recirc' && systemType === 'open') {
                    if (value >= minRecirc && value <= maxRecirc) {
                        isMatch = true;
                    }
                } else if (inputType === 'volume') {
                    if (value >= minVolume && value <= maxVolume) {
                        isMatch = true;
                    }
                }
            }

            if (isMatch) {
                const annualElectricalCost = kw * annualHours * electricalCost;
                const modelData = {
                    model: model['Model'],
                    flowrate: flowrate || 'N/A', // Use the Flowrate column directly
                    description: model['Description'] || 'No description available.',
                    annualElectricalCost: annualElectricalCost.toFixed(2)
                };

                if (type === 'separator' && !matchedModels.separator) {
                    matchedModels.separator = modelData;
                } else if (type === 'vaf' && !matchedModels.vaf) {
                    matchedModels.vaf = modelData;
                } else if (type === 'vortisand' && !matchedModels.vortisand) {
                    matchedModels.vortisand = modelData;
                }
                // This logic takes the FIRST match. You might need to refine
                // if multiple models of the same type match (e.g., pick the smallest, largest, etc.)
            }
        });
        return matchedModels;
    }

    function displayResults(results) {
        // Separator
        document.getElementById('separatorModel').textContent = results.separator ? results.separator.model : 'N/A';
        document.getElementById('separatorFlowrate').textContent = results.separator ? results.separator.flowrate : 'N/A';
        document.getElementById('separatorDescription').textContent = results.separator ? results.separator.description : 'No matching model found.';
        document.getElementById('separatorAnnualCost').textContent = results.separator ? results.separator.annualElectricalCost : 'N/A';

        // VAF
        document.getElementById('vafModel').textContent = results.vaf ? results.vaf.model : 'N/A';
        document.getElementById('vafFlowrate').textContent = results.vaf ? results.vaf.flowrate : 'N/A';
        document.getElementById('vafDescription').textContent = results.vaf ? results.vaf.description : 'No matching model found.';
        document.getElementById('vafAnnualCost').textContent = results.vaf ? results.vaf.annualElectricalCost : 'N/A';

        // Vortisand
        document.getElementById('vortisandModel').textContent = results.vortisand ? results.vortisand.model : 'N/A';
        document.getElementById('vortisandFlowrate').textContent = results.vortisand ? results.vortisand.flowrate : 'N/A';
        document.getElementById('vortisandDescription').textContent = results.vortisand ? results.vortisand.description : 'No matching model found.';
        document.getElementById('vortisandAnnualCost').textContent = results.vortisand ? results.vortisand.annualElectricalCost : 'N/A';
    }

    // Initial setup
    toggleInputSections(); // Set initial visibility based on default radio button
    fetchData(); // Load data from Google Sheet on page load
});