document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - using new MULTI-SELECT logic with integrated downloads.");

    // --- Database ---
    let database = [];
    let allModelData = new Map(); // To store model data by unique key (still useful for debugging)

    // --- Element Selection (New) ---
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const circulationRateInput = document.getElementById('circulationRate');
    
    // --- Element Selection (Existing) ---
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsBody = document.getElementById('results-body');

    // --- Removed all consts for downloadsSection, links, and learnMoreBtn ---

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

    // --- Toggles secondary dropdowns ---
    function toggleSecondaryOptions() {
        if (filterCheckbox.checked) {
            filterOptions.classList.remove('hidden');
        } else {
            filterOptions.classList.add('hidden');
        }

        if (pumpCheckbox.checked) {
            pumpOptions.classList.remove('hidden');
        } else {
            pumpOptions.classList.add('hidden');
        }
    }

    // --- Add Listeners to ALL Checkboxes ---
    equipmentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            toggleSecondaryOptions();
            // Clear old results when changing selections
            resultsSection.classList.add('hidden');
            noResultsMessage.classList.add('hidden');
            resultsBody.innerHTML = '';
        });
    });

    // --- Calculate Button Listener (New Multi-Select Logic) ---
    calculateButton.addEventListener('click', () => {
        allModelData.clear();
        resultsBody.innerHTML = ''; 
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        
        const checkedGroups = Array.from(equipmentCheckboxes)
                                   .filter(cb => cb.checked)
                                   .map(cb => cb.value);

        if (checkedGroups.length === 0) {
            alert("Please select at least one equipment type.");
            return;
        }

        const circRate = parseFloat(circulationRateInput.value);
        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a valid, positive Circulation Rate (GPM).");
            return;
        }

        let allMatchingModels = [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = database.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                const filterType = document.getElementById('filterType').value;
                groupModels = groupModels.filter(item => item["Equipment Type"] === filterType);
            } else if (selectedGroup === 'Pump') {
                const pumpVoltage = document.getElementById('pumpVoltage').value;
                groupModels = groupModels.filter(item => item.Power === pumpVoltage);
            }

            const flowMatchedModels = groupModels.filter(item => {
                const min = parseFloat(item["Min Flow"]);
                const max = parseFloat(item["Max Flow"]);
                
                const isMinMatch = circRate >= min;
                const isMaxMatch = isNaN(max) ? true : circRate <= max; 
                
                return isMinMatch && isMaxMatch;
            });
            
            allMatchingModels = allMatchingModels.concat(flowMatchedModels);
        }

        displayResults(allMatchingModels);
    });

    // --- Dynamically builds the results table ---
    function displayResults(models) {
        if (models.length === 0) {
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');

        // Helper function to build link HTML
        const buildLink = (filename, text) => {
            if (filename) {
                return `<a href="product/${filename}" target="_blank" class="download-link">${text}</a>`;
            }
            return ''; // Return empty string if no filename
        };

        models.sort((a, b) => a.Grouping.localeCompare(b.Grouping));

        models.forEach((model, index) => {
            const modelKey = `model-${index}`;
            allModelData.set(modelKey, model);

            const tr = document.createElement('tr');
            
            const flowMin = model["Min Flow"];
            const flowMax = isNaN(parseFloat(model["Max Flow"])) ? " +" : ` - ${model["Max Flow"]}`;
            const flowRange = `${flowMin}${flowMax}`;
            const hp = model.HP || 'N/A';
            
            // Build download links HTML
            const specLink = buildLink(model['Written Specification'], 'Spec');
            const cutSheetLink = buildLink(model['Cut Sheet'], 'Cut Sheet');
            const gaLink = buildLink(model['GA'], 'GA');
            const cadLink = buildLink(model['CAD'], 'CAD');

            // Join all non-empty links with a space
            const linksHtml = [specLink, cutSheetLink, gaLink, cadLink].filter(link => link).join(' ');

            tr.innerHTML = `
                <td data-label="Category"><strong>${model.Grouping}</strong></td>
                <td data-label="Part Number">${model["Part Number"] || 'N/A'}</td>
                <td data-label="Model">${model.Model || 'N/A'}</td>
                <td data-label="Flowrate Range (GPM)">${flowRange}</td>
                <td data-label="HP">${hp}</td>
                <td data-label="Downloads" class="downloads-cell">${linksHtml.length > 0 ? linksHtml : 'N/A'}</td>
            `;
            
            resultsBody.appendChild(tr);
        });

        // --- Removed all logic for download radio buttons ---
    }

    // --- Removed the entire updateDownloads function ---

    // --- Initialize ---
    loadDatabase();
    toggleSecondaryOptions(); // Run on load to set the initial state
});
