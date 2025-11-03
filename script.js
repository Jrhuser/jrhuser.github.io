document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - using new dynamic selector logic.");

    // --- Database ---
    let database = [];
    let allModelData = new Map(); // To store model data by unique key for download links

    // --- Element Selection (New) ---
    const equipmentRadios = document.querySelectorAll('input[name="equipmentGrouping"]');
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const circulationRateInput = document.getElementById('circulationRate');
    
    // --- Element Selection (Existing) ---
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsBody = document.getElementById('results-body'); // The new <tbody>

    const downloadsSection = document.getElementById('downloadsSection');
    const specLink = document.getElementById('specLink');
    const cutSheetLink = document.getElementById('cutSheetLink');
    const gaLink = document.getElementById('gaLink');
    const cadLink = document.getElementById('cadLink');
    const learnMoreBtn = document.getElementById('learnMoreBtn');

    // --- Load Database ---
    async function loadDatabase() {
        try {
            const response = await fetch('selection-database.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            database = await response.json();
            console.log("Database successfully loaded.");
        } catch (error) {
            console.error("Failed to load or process database:", error);
            noResultsMessage.textContent = `Error: Could not load filtration database. ${error.message}`;
            noResultsMessage.classList.remove('hidden');
            calculateButton.disabled = true;
        }
    }

    // --- NEW: Toggles secondary dropdowns ---
    function toggleSecondaryOptions() {
        const selectedGroup = document.querySelector('input[name="equipmentGrouping"]:checked').value;

        // Hide all secondary options first
        filterOptions.classList.add('hidden');
        pumpOptions.classList.add('hidden');

        // Show the correct one
        if (selectedGroup === 'Filter') {
            filterOptions.classList.remove('hidden');
        } else if (selectedGroup === 'Pump') {
            pumpOptions.classList.remove('hidden');
        }
    }

    // --- Add Listeners to Main Radio Buttons ---
    equipmentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            toggleSecondaryOptions();
            // Clear old results when changing primary type
            resultsSection.classList.add('hidden');
            downloadsSection.classList.add('hidden');
            learnMoreBtn.classList.add('hidden');
            noResultsMessage.classList.add('hidden');
            resultsBody.innerHTML = '';
        });
    });

    // --- Calculate Button Listener (New Logic) ---
    calculateButton.addEventListener('click', () => {
        allModelData.clear(); // Clear old model data
        resultsBody.innerHTML = ''; // Clear old results
        resultsSection.classList.add('hidden');
        downloadsSection.classList.add('hidden');
        learnMoreBtn.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        
        // 1. Get all inputs
        const selectedGroup = document.querySelector('input[name="equipmentGrouping"]:checked').value;
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a valid, positive Circulation Rate (GPM).");
            return;
        }

        // 2. Start filtering
        let matchingModels = database.filter(item => item.Grouping === selectedGroup);

        // 3. Conditional Filtering
        if (selectedGroup === 'Filter') {
            const filterType = document.getElementById('filterType').value;
            matchingModels = matchingModels.filter(item => item["Equipment Type"] === filterType);
        } else if (selectedGroup === 'Pump') {
            const pumpVoltage = document.getElementById('pumpVoltage').value;
            matchingModels = matchingModels.filter(item => item.Power === pumpVoltage);
        }

        // 4. Flow Rate Filtering (The main logic)
        matchingModels = matchingModels.filter(item => {
            const min = parseFloat(item["Min Flow"]);
            const max = parseFloat(item["Max Flow"]);
            
            // Check if circRate is within bounds
            const isMinMatch = circRate >= min;
            // If Max Flow is not a number (NaN), it means no upper limit (e.g., last item in range)
            const isMaxMatch = isNaN(max) ? true : circRate <= max; 
            
            return isMinMatch && isMaxMatch;
        });

        // 5. Display results
        displayResults(matchingModels);
    });

    // --- NEW: Dynamically builds the results table ---
    function displayResults(models) {
        if (models.length === 0) {
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');

        models.forEach((model, index) => {
            // Create a unique key for this model to retrieve its data later
            const modelKey = `model-${index}`;
            allModelData.set(modelKey, model);

            const tr = document.createElement('tr');
            
            const flowMin = model["Min Flow"];
            const flowMax = isNaN(parseFloat(model["Max Flow"])) ? " +" : ` - ${model["Max Flow"]}`;
            const flowRange = `${flowMin}${flowMax}`;
            const hp = model.HP || 'N/A';
            
            tr.innerHTML = `
                <td class="select-column" data-label="Select">
                    <input type="radio" name="selectedModel" id="${modelKey}" value="${modelKey}">
                </td>
                <td data-label="Equipment Type">${model["Equipment Type"] || 'N/A'}</td>
                <td data-label="Model">${model.Model || model["Part Number"] || 'N/A'}</td>
                <td data-label="Flowrate Range (GPM)">${flowRange}</td>
                <td data-label="HP">${hp}</td>
                <td data-label="Details">${model.Description || 'See Spec Sheet'}</td>
            `;
            
            resultsBody.appendChild(tr);
        });

        // Add event listeners to the new radio buttons
        document.querySelectorAll('input[name="selectedModel"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const selectedKey = e.target.value;
                const selectedModelData = allModelData.get(selectedKey);
                updateDownloads(selectedModelData);
            });
        });
    }

    // --- REUSED: This function works as-is, just needs to be called by the new radio buttons ---
    function updateDownloads(modelData) {
        const setupLink = (linkElement, filename) => {
            if (filename) {
                // Assuming files are in a 'product' folder like your old script
                linkElement.href = `product/${filename}`; 
                linkElement.classList.remove('hidden');
                return true;
            } else {
                linkElement.classList.add('hidden');
                return false;
            }
        };

        if (modelData) {
            const hasSpec = setupLink(specLink, modelData['Written Specification']);
            const hasCut = setupLink(cutSheetLink, modelData['Cut Sheet']);
            const hasGa = setupLink(gaLink, modelData['GA']);
            const hasCad = setupLink(cadLink, modelData['CAD']);
            
            if (hasSpec || hasCut || hasGa || hasCad) {
                downloadsSection.classList.remove('hidden');
                learnMoreBtn.classList.remove('hidden');
                const subject = `Inquiry about ${modelData.Model || modelData["Part Number"]}`;
                learnMoreBtn.href = `mailto:James.Huser@Xylem.com?subject=${encodeURIComponent(subject)}`;
            } else {
                downloadsSection.classList.add('hidden');
                learnMoreBtn.classList.add('hidden');
            }
        } else {
            downloadsSection.classList.add('hidden');
            learnMoreBtn.classList.add('hidden');
        }
    }

    // --- Initialize ---
    loadDatabase();
    toggleSecondaryOptions(); // Run on load to set the initial state
});
