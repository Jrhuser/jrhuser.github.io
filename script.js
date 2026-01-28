document.addEventListener('DOMContentLoaded', () => {
    let database = [];

    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    const uvCheckbox = document.getElementById('radioUV');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const uvOptions = document.getElementById('uvOptions');
    
    const poolVolumeInput = document.getElementById('poolVolume');
    const circulationRateInput = document.getElementById('circulationRate');
    const turnoverResultSection = document.getElementById('turnoverResultSection');
    const turnoverResultText = document.getElementById('turnoverResultText');
    
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsBody = document.getElementById('results-body');
    const addToCartButton = document.getElementById('addToCartButton');
    const selectAllBOM = document.getElementById('selectAllBOM');

    async function loadDatabase() {
        try {
            const response = await fetch('selection-database (2).json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            database = await response.json();
        } catch (error) {
            console.error("Failed to load database:", error);
        }
    }

    function toggleSecondaryOptions() {
        filterOptions.classList.toggle('hidden', !filterCheckbox.checked);
        pumpOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        uvOptions.classList.toggle('hidden', !uvCheckbox.checked);
    }

    // Reset Logic
    resetButton.addEventListener('click', () => {
        equipmentCheckboxes.forEach(cb => cb.checked = false);
        poolVolumeInput.value = '';
        circulationRateInput.value = '';
        selectAllBOM.checked = false;
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        turnoverResultSection.classList.add('hidden');
        addToCartButton.classList.add('hidden');
        resultsBody.innerHTML = '';
        toggleSecondaryOptions();
    });

    // Bulk Select Logic
    selectAllBOM.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.bom-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });

    equipmentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            toggleSecondaryOptions();
            resultsSection.classList.add('hidden');
            noResultsMessage.classList.add('hidden');
            turnoverResultSection.classList.add('hidden');
            addToCartButton.classList.add('hidden');
            resultsBody.innerHTML = '';
            selectAllBOM.checked = false;
        });
    });

    calculateButton.addEventListener('click', () => {
        resultsBody.innerHTML = ''; 
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        selectAllBOM.checked = false;
        
        const poolVolume = parseFloat(poolVolumeInput.value);
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(poolVolume) || isNaN(circRate)) return alert("Please enter valid parameters.");

        turnoverResultText.textContent = `${(poolVolume / circRate).toFixed(2)} minutes`;
        turnoverResultSection.classList.remove('hidden');

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (checkedGroups.length === 0) return;

        let allMatchingModels = [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = database.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                groupModels = groupModels.filter(item => item["Equipment Type"] === document.getElementById('filterType').value);
            } else if (selectedGroup === 'Pump') {
                groupModels = groupModels.filter(item => item.Power === document.getElementById('pumpVoltage').value);
            } else if (selectedGroup === 'UV') {
                groupModels = groupModels.filter(item => item["Equipment Type"] === document.getElementById('uvType').value);
            }

            const flowMatched = groupModels.filter(item => {
                const min = parseFloat(item["Min Flow"]);
                const max = parseFloat(item["Max Flow"]);
                return circRate >= min && (isNaN(max) || circRate <= max);
            });
            allMatchingModels = allMatchingModels.concat(flowMatched);
        }

        displayResults(allMatchingModels);
    });

    function displayResults(models) {
        if (models.length === 0) {
            noResultsMessage.classList.remove('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');
        addToCartButton.classList.remove('hidden');

        models.sort((a, b) => a.Grouping.localeCompare(b.Grouping)).forEach((model) => {
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const footprint = model["Footprint"] || 'N/A';
            const desc = model["Nema Rating"] ? `${model["Equipment Type"]} (${model["Nema Rating"]})` : (model["Equipment Type"] || 'N/A');

            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';
            const links = [
                buildLink(model['Written Specification'], 'Spec'),
                buildLink(model['Cut Sheet'], 'Cut Sheet'),
                buildLink(model['GA'], 'GA'),
                buildLink(model['CAD'], 'CAD')
            ].filter(l => l).join(' ');

            tr.innerHTML = `
                <td class="select-column"><input type="checkbox" class="bom-checkbox" value="${partNum}"></td>
                <td data-label="Description">${desc}</td>
                <td data-label="Part Number">${partNum}</td>
                <td data-label="Model">${model.Model || 'N/A'}</td>
                <td data-label="Flowrate">${model["Min Flow"]} - ${model["Max Flow"] || '+'}</td>
                <td data-label="Footprint">${footprint}</td>
                <td class="downloads-cell">${links || 'N/A'}</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    addToCartButton.addEventListener('click', () => {
        const checked = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => cb.value).filter(v => v !== 'N/A');
        if (checked.length === 0) return alert('Please select items with part numbers.');
        alert(`Adding the following parts to cart:\n${checked.join('\n')}`);
    });

    loadDatabase();
    toggleSecondaryOptions();
});
