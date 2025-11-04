document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - using new logic with Turnover calculation.");

    // --- Database ---
    let database = [];
    let allModelData = new Map();

    // --- Element Selection ---
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    
    // --- NEW Inputs and Outputs ---
    const poolVolumeInput = document.getElementById('poolVolume');
    const circulationRateInput = document.getElementById('circulationRate');
    const turnoverResultSection = document.getElementById('turnoverResultSection');
    const turnoverResultText = document.getElementById('turnoverResultText');
    
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsBody = document.getElementById('results-body');

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
            turnoverResultSection.classList.add('hidden'); // Hide turnover too
            resultsBody.innerHTML = '';
        });
    });

    // --- Calculate Button Listener ---
    calculateButton.addEventListener('click', () => {
        allModelData.clear();
        resultsBody.innerHTML = ''; 
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        turnoverResultSection.classList.add('hidden'); // Hide on new calc
        
        // 1. Get and Validate Inputs
        const poolVolume = parseFloat(poolVolumeInput.value);
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(poolVolume) || poolVolume <= 0) {
            alert("Please enter a valid, positive Pool Volume (Gallons).");
            return;
        }
        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a valid, positive Circulation Rate (GPM).");
            return;
        }

        // 2. Calculate and Display Turnover Time
        const turnoverTime = poolVolume / circRate;
        turnoverResultText.textContent = `${turnoverTime.toFixed(2)} minutes`;
        turnoverResultSection.classList.remove('hidden');

        // 3. Get Checked Equipment
        const checkedGroups = Array.from(equipmentCheckboxes)
                                   .filter(cb => cb.checked)
                                   .map(cb => cb.value);

        if (checkedGroups.length === 0) {
            return; 
        }

        let allMatchingModels = [];

        // 4. Loop through and find equipment
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

        // 5. Display all found results
        displayResults(allMatchingModels);
    });

    // --- Dynamically builds the results table ---
    function displayResults(models) {
        if (models.length === 0 && Array.from(equipmentCheckboxes).some(cb => cb.checked)) {
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');

        const buildLink = (filename, text) => {
            if (filename) {
                return `<a href="product/${filename}" target="_blank" class="download-link">${text}</a>`;
            }
            return '';
        };

        models.sort((a, b) => a.Grouping.localeCompare(b.Grouping));

        models.forEach((model, index) => {
            const modelKey = `model-${index}`;
            allModelData.set(modelKey, model);

            const tr = document.createElement('tr');
            
            const flowMin = model["Min Flow"];
            const flowMax = isNaN(parseFloat(model["Max Flow"])) ? " +" : ` - ${model["Max Flow"]}`;
            const flowRange = `${flowMin}${flowMax}`;
            
            const specLink = buildLink(model['Written Specification'], 'Spec');
            const cutSheetLink = buildLink(model['Cut Sheet'], 'Cut Sheet');
            const gaLink = buildLink(model['GA'], 'GA');
            const cadLink = buildLink(model['CAD'], 'CAD');

            const linksHtml = [specLink, cutSheetLink, gaLink, cadLink].filter(link => link).join(' ');

            // !!! UPDATED THIS LINE !!!
            tr.innerHTML = `
                <td data-label="Description">${model["Equipment Type"] || 'N/A'}</td>
                <td data-label="Part Number">${model["Part Number"] || 'N/A'}</td>
                <td data-label="Model">${model.Model || 'N/A'}</td>
                <td data-label="Flowrate Range (GPM)">${flowRange}</td>
                <td data-label="Downloads" class="downloads-cell">${linksHtml.length > 0 ? linksHtml : 'N/A'}</td>
            `;
            
            resultsBody.appendChild(tr);
        });
    }

    // --- Initialize ---
    loadDatabase();
    toggleSecondaryOptions();
});
