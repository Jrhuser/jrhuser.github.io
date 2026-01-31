document.addEventListener('DOMContentLoaded', () => {
    let database = { "product-DB": [] };

    // Selectors
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    const uvCheckbox = document.getElementById('radioUV');
    
    const filterOptions = document.getElementById('filterOptions');
    const ceilingHeightOptions = document.getElementById('ceilingHeightOptions');
    const filterTypeSelect = document.getElementById('filterType');
    const pumpOptions = document.getElementById('pumpOptions');
    const driveOptions = document.getElementById('driveOptions');
    const driveTypeSelect = document.getElementById('driveType');
    const uvOptions = document.getElementById('uvOptions');
    
    const poolVolumeInput = document.getElementById('poolVolume');
    const turnoverValueInput = document.getElementById('turnoverValue');
    const turnoverUnitSelect = document.getElementById('turnoverUnit');
    const circulationRateInput = document.getElementById('circulationRate');
    
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    
    const tables = {
        Filter: { section: document.getElementById('filterTableSection'), body: document.getElementById('filter-results-body'), head: document.querySelector('#filterTableSection thead tr') },
        Pump: { section: document.getElementById('pumpTableSection'), body: document.getElementById('pump-results-body') },
        UV: { section: document.getElementById('uvTableSection'), body: document.getElementById('uv-results-body') }
    };

    const addToCartButton = document.getElementById('addToCartButton');
    const downloadAllButton = document.getElementById('downloadAllButton');

    async function loadDatabase() {
        try {
            const response = await fetch('product.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            database = await response.json();
        } catch (error) {
            console.error("Database error:", error);
        }
    }

    let lastEdited = null;

    function toMinutes(val, unit) {
        if (unit === 'hours') return val * 60;
        if (unit === 'perday') return (24 * 60) / val;
        return val;
    }

    function fromMinutes(minutes, unit) {
        if (unit === 'hours') return minutes / 60;
        if (unit === 'perday') return (24 * 60) / minutes;
        return minutes;
    }

    function calcFlowRate() {
        const volume = parseFloat(poolVolumeInput.value);
        const turnoverVal = parseFloat(turnoverValueInput.value);
        if (volume > 0 && turnoverVal > 0) {
            const minutes = toMinutes(turnoverVal, turnoverUnitSelect.value);
            circulationRateInput.value = Math.ceil(volume / minutes);
        } else {
            circulationRateInput.value = '';
        }
    }

    function calcTurnover() {
        const volume = parseFloat(poolVolumeInput.value);
        const flowRate = parseFloat(circulationRateInput.value);
        if (volume > 0 && flowRate > 0) {
            const minutes = volume / flowRate;
            const converted = fromMinutes(minutes, turnoverUnitSelect.value);
            turnoverValueInput.value = Math.round(converted * 100) / 100;
        } else {
            turnoverValueInput.value = '';
        }
    }

    turnoverValueInput.addEventListener('input', () => { lastEdited = 'turnover'; calcFlowRate(); });
    circulationRateInput.addEventListener('input', () => { lastEdited = 'flowRate'; calcTurnover(); });
    poolVolumeInput.addEventListener('input', () => {
        if (lastEdited === 'flowRate') calcTurnover();
        else calcFlowRate();
    });
    turnoverUnitSelect.addEventListener('change', () => {
        if (lastEdited === 'flowRate') calcTurnover();
        else calcFlowRate();
    });

    function handleEquipmentToggle() {
        toggleSecondaryOptions();
        resultsSection.classList.add('hidden'); 
    }

    function toggleSecondaryOptions() {
        filterOptions.classList.toggle('hidden', !filterCheckbox.checked);
        ceilingHeightOptions.classList.toggle('hidden', !(filterCheckbox.checked && filterTypeSelect.value === 'RMF'));
        pumpOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        driveOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        uvOptions.classList.toggle('hidden', !uvCheckbox.checked);
    }

    resetButton.addEventListener('click', () => {
        equipmentCheckboxes.forEach(cb => cb.checked = false);
        [poolVolumeInput, turnoverValueInput, circulationRateInput].forEach(i => i.value = '');
        turnoverUnitSelect.value = 'minutes';
        resultsSection.classList.add('hidden');
        Object.values(tables).forEach(t => {
            t.body.innerHTML = '';
            t.section.classList.add('hidden');
        });
        toggleSecondaryOptions();
    });

    calculateButton.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        Object.values(tables).forEach(t => {
            t.body.innerHTML = '';
            t.section.classList.add('hidden');
        });

        const circRate = parseFloat(circulationRateInput.value);
        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a Design Flow Rate.");
            return;
        }

        const checkedGroups = Array.from(equipmentCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (checkedGroups.length === 0) {
            alert("Please select at least one equipment group.");
            return;
        }

        const products = database["product-DB"] || [];

        checkedGroups.forEach(selectedGroup => {
            let groupModels = products.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                const filterType = document.getElementById('filterType').value;
                groupModels = groupModels.filter(item => item["Equipment Type"] === filterType);
                if (filterType === 'RMF') {
                    const ceilingVal = document.getElementById('ceilingHeight').value;
                    const heightLimit = ceilingVal === '8' ? 81 : ceilingVal === '9' ? 93 : ceilingVal === '10' ? 107 : null;
                    if (heightLimit) {
                        groupModels = groupModels.filter(item => {
                            const footprint = item["Footprint LxWxH (Inches)"];
                            if (!footprint) return false;
                            const height = parseFloat(footprint.split('x').pop());
                            return !isNaN(height) && height < heightLimit;
                        });
                    }
                }
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

            if (flowMatched.length > 0) {
                resultsSection.classList.remove('hidden');
                displayResults(flowMatched, selectedGroup, circRate);
            }
        });
    });

    function displayResults(models, group, circRate) {
        tables[group].section.classList.remove('hidden');

        if (group === 'Filter') {
            const isRMF = filterTypeSelect.value === 'RMF';
            if (isRMF) {
                tables.Filter.head.innerHTML = `
                    <th style="width: 40px;">Select</th>
                    <th>Model Name</th>
                    <th>Flow Range (GPM)</th>
                    <th>NSF 2.0 Flux</th>
                    <th>NSF 3.0 Flux</th>
                    <th>Footprint</th>
                    <th>Technical Docs</th>`;
            } else {
                tables.Filter.head.innerHTML = `
                    <th style="width: 40px;">Select</th>
                    <th>Model Name</th>
                    <th>Flow Range (GPM)</th>
                    <th>Footprint</th>
                    <th>Technical Docs</th>`;
            }
        }

        models.forEach(model => {
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';
            const secondaryDocLabel = (group === 'Pump') ? 'Pump Curve' : 'Additional Info';

            const linksHtml = [
                buildLink(model['Product Sheet'], 'Product Sheet'),
                buildLink(model['Additional Info/Pump Curve'], secondaryDocLabel),
                buildLink(model['Written Specification'], 'Spec')
            ].filter(l => l).join(' ');

            if (group === 'Pump') {
                const driveValue = driveTypeSelect.value;
                const vfdLink = buildLink('VFD-GreenDrive.pdf', 'VFD');
                const pumpLinksHtml = [linksHtml, vfdLink].filter(l => l).join(' ');
                tr.innerHTML = `
                    <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                    <td>${model.Model || 'N/A'}</td>
                    <td>${driveValue}</td>
                    <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                    <td>${model["Best Efficiency Flow (gpm)"] || 'N/A'}</td>
                    <td>${model["TDH @ Best Efficieny"] || 'N/A'}</td>
                    <td>${pumpLinksHtml || 'N/A'}</td>
                `;
            } else if (group === 'Filter') {
                const isRMF = filterTypeSelect.value === 'RMF';
                if (isRMF) {
                    const nsf2Area = parseFloat(model["NSF 2.0 Filter Area (sq ft)"]);
                    const nsf3Area = parseFloat(model["NSF 3.0 Filter Area (sq ft)"]);
                    const nsf2Flux = (nsf2Area > 0 && circRate > 0) ? (nsf2Area / circRate).toFixed(2) : 'N/A';
                    const nsf3Flux = (nsf3Area > 0 && circRate > 0) ? (nsf3Area / circRate).toFixed(2) : 'N/A';
                    tr.innerHTML = `
                        <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                        <td>${model.Model || 'N/A'}</td>
                        <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                        <td>${nsf2Flux}</td>
                        <td>${nsf3Flux}</td>
                        <td>${model["Footprint LxWxH (Inches)"] || 'N/A'}</td>
                        <td>${linksHtml || 'N/A'}</td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                        <td>${model.Model || 'N/A'}</td>
                        <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                        <td>${model["Footprint LxWxH (Inches)"] || 'N/A'}</td>
                        <td>${linksHtml || 'N/A'}</td>
                    `;
                }
            } else {
                tr.innerHTML = `
                    <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                    <td>${model.Model || 'N/A'}</td>
                    <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                    <td>${linksHtml || 'N/A'}</td>
                `;
            }
            tables[group].body.appendChild(tr);
        });
    }

    downloadAllButton.addEventListener('click', async () => {
        const checkedBoxes = Array.from(document.querySelectorAll('.bom-checkbox:checked'));
        if (checkedBoxes.length === 0) return alert('Select items first.');

        const products = database["product-DB"] || [];
        const docFields = ['Product Sheet', 'Additional Info/Pump Curve', 'Written Specification'];
        const files = new Set();

        checkedBoxes.forEach(cb => {
            const partNum = cb.value;
            const product = products.find(p => p["Part Number"] === partNum);
            if (product) {
                docFields.forEach(field => {
                    if (product[field]) files.add(product[field]);
                });
                if (product.Grouping === 'Pump') files.add('VFD-GreenDrive.pdf');
            }
        });

        if (files.size === 0) return alert('No documents found for selected products.');

        const zip = new JSZip();
        const fetchPromises = Array.from(files).map(async filename => {
            try {
                const response = await fetch(`product/${filename}`);
                if (response.ok) {
                    const blob = await response.blob();
                    zip.file(filename, blob);
                }
            } catch (e) {
                console.error(`Failed to fetch ${filename}:`, e);
            }
        });

        await Promise.all(fetchPromises);
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'Pump_Room_Technical_Docs.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    });

    addToCartButton.addEventListener('click', () => {
        const checkedItems = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => {
            return `- ${cb.getAttribute('data-model')} (Part #: ${cb.value})`;
        });

        if (checkedItems.length === 0) return alert('Select items first.');

        const emailBody = `Quote Request Details:
- Volume: ${poolVolumeInput.value} Gal
- Turnover: ${turnoverValueInput.value} ${turnoverUnitSelect.options[turnoverUnitSelect.selectedIndex].text}
- Flow: ${circulationRateInput.value} GPM

Products:
${checkedItems.join('\n')}`;

        window.location.href = `mailto:kenneth.roche@xylem.com?subject=Pump Room - Quote Request&body=${encodeURIComponent(emailBody)}`;
    });

    loadDatabase();
    equipmentCheckboxes.forEach(checkbox => checkbox.addEventListener('change', handleEquipmentToggle));
    filterTypeSelect.addEventListener('change', toggleSecondaryOptions);
});
