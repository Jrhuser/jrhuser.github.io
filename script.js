document.addEventListener('DOMContentLoaded', () => {
    let database = { "product-DB": [] };

    // Selectors for Equipment Groups
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    const uvCheckbox = document.getElementById('radioUV');
    
    // Selectors for Secondary Options
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const uvOptions = document.getElementById('uvOptions');
    
    // Selectors for Inputs and Results
    const poolVolumeInput = document.getElementById('poolVolume');
    const circulationRateInput = document.getElementById('circulationRate');
    const turnoverResultSection = document.getElementById('turnoverResultSection');
    const turnoverResultText = document.getElementById('turnoverResultText');
    
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    const resultsBody = document.getElementById('results-body');
    const addToCartButton = document.getElementById('addToCartButton');
    const selectAllBOM = document.getElementById('selectAllBOM');

    // Load Database from product.json
    async function loadDatabase() {
        try {
            const response = await fetch('product.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            database = await response.json();
        } catch (error) {
            console.error("Database error:", error);
        }
    }

    // Toggle dropdowns based on equipment selection
    function toggleSecondaryOptions() {
        filterOptions.classList.toggle('hidden', !filterCheckbox.checked);
        pumpOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        uvOptions.classList.toggle('hidden', !uvCheckbox.checked);
    }

    // Reset all forms and results
    resetButton.addEventListener('click', () => {
        equipmentCheckboxes.forEach(cb => cb.checked = false);
        poolVolumeInput.value = '';
        circulationRateInput.value = '';
        resultsSection.classList.add('hidden');
        turnoverResultSection.classList.add('hidden');
        resultsBody.innerHTML = '';
        if (selectAllBOM) selectAllBOM.checked = false;
        toggleSecondaryOptions();
    });

    // Handle "Select All" checkbox logic
    if (selectAllBOM) {
        selectAllBOM.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.bom-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAllBOM.checked);
        });
    }

    // Main Calculation and Filtering Logic
    calculateButton.addEventListener('click', () => {
        resultsBody.innerHTML = ''; 
        const poolVolume = parseFloat(poolVolumeInput.value);
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(poolVolume) || isNaN(circRate) || poolVolume <= 0) {
            alert("Please enter a valid Volume and Flow Rate.");
            return;
        }

        // Turnover Calculation: (GPM * 1440) / Volume
        const turnoversPerDay = (circRate * 1440) / poolVolume;
        turnoverResultText.textContent = `${turnoversPerDay.toFixed(2)} Turnovers per Day`;
        turnoverResultSection.classList.remove('hidden');

        // Color coding for turnover standards
        if (turnoversPerDay < 4.0) {
            turnoverResultText.style.color = "red";
        } else {
            turnoverResultText.style.color = "#007DA3";
        }

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        let allMatchingModels = [];

        // Access the products array from the JSON root
        const products = database["product-DB"] || [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = products.filter(item => item.Grouping === selectedGroup);

            // Apply Group-Specific Filters
            if (selectedGroup === 'Filter') {
                const type = document.getElementById('filterType').value;
                groupModels = groupModels.filter(item => item["Equipment Type"] === type);
            } else if (selectedGroup === 'Pump') {
                const selectedVoltage = document.getElementById('pumpVoltage').value;
                // Convert to string for comparison as 575 is a number in JSON
                groupModels = groupModels.filter(item => String(item.Power) === selectedVoltage);
            } else if (selectedGroup === 'UV') {
                const nema = document.getElementById('nemaRating').value;
                groupModels = groupModels.filter(item => item["Nema Rating"] === nema);
            }

            // Apply Flow Rate Matching using Min Flow (gpm) and Max Flow keys
            const flowMatched = groupModels.filter(item => {
                const min = parseFloat(item["Min Flow (gpm)"]) || 0;
                const max = parseFloat(item["Max Flow"]);
                return circRate >= min && (isNaN(max) || max === null || circRate <= max);
            });
            allMatchingModels = allMatchingModels.concat(flowMatched);
        }

        displayResults(allMatchingModels);
    });

    function displayResults(models) {
        if (models.length === 0) {
            alert("No matching equipment found for this Flow Rate/Voltage.");
            resultsSection.classList.add('hidden');
            return;
        }
        resultsSection.classList.remove('hidden');

        models.forEach((model) => {
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';

            // Map technical documents
            const linksHtml = [
                buildLink(model['Product Sheet'], 'Product Sheet'),
                buildLink(model['Additional Info/Pump Curve'], 'Additional Info'),
                buildLink(model['Written Specification'], 'Written Specification')
            ].filter(l => l).join(' ');

            tr.innerHTML = `
                <td><input type="checkbox" class="bom-checkbox" value="${partNum}"></td>
                <td>${model["Equipment Type"]}</td>
                <td>${partNum}</td>
                <td data-label="Model Name">${model.Model || 'N/A'}</td>
                <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                <td>${model["Footprint LxWxH (Inches)"] || 'N/A'}</td>
                <td>${linksHtml || 'N/A'}</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    // Handle Email Generation
    addToCartButton.addEventListener('click', () => {
        const checkedRows = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => {
            const row = cb.closest('tr');
            const modelName = row.querySelector('[data-label="Model Name"]').textContent;
            const pNum = cb.value;
            return `Model: ${modelName} (Part #: ${pNum})`;
        });

        if (checkedRows.length === 0) return alert('Select items first.');
        
        const mailtoUrl = `mailto:kenneth.roche@xylem.com?subject=Quote Request&body=${encodeURIComponent("I would like a quote for the following equipment:\n\n" + checkedRows.join('\n'))}`;
        window.location.href = mailtoUrl;
    });

    // Initialization
    loadDatabase();
    equipmentCheckboxes.forEach(checkbox => checkbox.addEventListener('change', toggleSecondaryOptions));
});
