document.addEventListener('DOMContentLoaded', () => {
    let database = { "product-DB": [] };

    // Selectors
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    const uvCheckbox = document.getElementById('radioUV');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const uvOptions = document.getElementById('uvOptions');
    
    const poolVolumeInput = document.getElementById('poolVolume');
    const turnoverMinutesInput = document.getElementById('turnoverMinutes');
    const circulationRateInput = document.getElementById('circulationRate');
    
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    
    // Table Selectors
    const tables = {
        Filter: { section: document.getElementById('filterTableSection'), body: document.getElementById('filter-results-body') },
        Pump: { section: document.getElementById('pumpTableSection'), body: document.getElementById('pump-results-body') },
        UV: { section: document.getElementById('uvTableSection'), body: document.getElementById('uv-results-body') }
    };

    const addToCartButton = document.getElementById('addToCartButton');

    // Load Database
    async function loadDatabase() {
        try {
            const response = await fetch('product.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            database = await response.json();
        } catch (error) {
            console.error("Database error:", error);
        }
    }

    // Live Calculation
    [poolVolumeInput, turnoverMinutesInput].forEach(input => {
        input.addEventListener('input', () => {
            const volume = parseFloat(poolVolumeInput.value);
            const minutes = parseFloat(turnoverMinutesInput.value);
            if (volume > 0 && minutes > 0) {
                circulationRateInput.value = Math.ceil(volume / minutes);
            } else {
                circulationRateInput.value = '';
            }
        });
    });

    function toggleSecondaryOptions() {
        filterOptions.classList.toggle('hidden', !filterCheckbox.checked);
        pumpOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        uvOptions.classList.toggle('hidden', !uvCheckbox.checked);
    }

    resetButton.addEventListener('click', () => {
        equipmentCheckboxes.forEach(cb => cb.checked = false);
        [poolVolumeInput, turnoverMinutesInput, circulationRateInput].forEach(i => i.value = '');
        resultsSection.classList.add('hidden');
        Object.values(tables).forEach(t => {
            t.body.innerHTML = '';
            t.section.classList.add('hidden');
        });
        toggleSecondaryOptions();
    });

    calculateButton.addEventListener('click', () => {
        // Clear all previous results
        Object.values(tables).forEach(t => {
            t.body.innerHTML = '';
            t.section.classList.add('hidden');
        });

        const circRate = parseFloat(circulationRateInput.value);
        if (isNaN(circRate) || circRate <= 0) {
            alert("Please calculate a Flow Rate first.");
            return;
        }

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        let allMatchingModels = [];
        const products = database["product-DB"] || [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = products.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                groupModels = groupModels.filter(item => item["Equipment Type"] === document.getElementById('filterType').value);
            } else if (selectedGroup === 'Pump') {
                const volt = document.getElementById('pumpVoltage').value;
                groupModels = groupModels.filter(item => String(item.Power) === volt);
            } else if (selectedGroup === 'UV') {
                const nema = document.getElementById('nemaRating').value;
                groupModels = groupModels.filter(item => item["Nema Rating"] === nema);
            }

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
            alert("No matching equipment found.");
            return;
        }
        resultsSection.classList.remove('hidden');

        models.forEach(model => {
            const group = model.Grouping;
            if (!tables[group]) return;

            tables[group].section.classList.remove('hidden');
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';

            tr.innerHTML = `
                <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                <td>${partNum}</td>
                <td>${model.Model || 'N/A'}</td>
                <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                <td>${buildLink(model['Product Sheet'], 'Docs')}</td>
            `;
            tables[group].body.appendChild(tr);
        });
    }

    addToCartButton.addEventListener('click', () => {
        const checkedItems = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => {
            return `- ${cb.getAttribute('data-model')} (Part #: ${cb.value})`;
        });

        if (checkedItems.length === 0) return alert('Select items first.');

        const emailBody = `Quote Request Details:
- Volume: ${poolVolumeInput.value} Gal
- Turnover: ${turnoverMinutesInput.value} Min
- Flow: ${circulationRateInput.value} GPM

Products:
${checkedItems.join('\n')}`;

        window.location.href = `mailto:kenneth.roche@xylem.com?subject=Quote Request&body=${encodeURIComponent(emailBody)}`;
    });

    loadDatabase();
    equipmentCheckboxes.forEach(checkbox => checkbox.addEventListener('change', toggleSecondaryOptions));
});
