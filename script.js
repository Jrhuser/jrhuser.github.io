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
    
    const projectNameInput = document.getElementById('projectName');
    const projectZipInput = document.getElementById('projectZip');
    const systemNameInput = document.getElementById('systemName');

    // Array to accumulate multiple systems for quote
    const quoteSystems = [];

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

    // Zip/postal code to state/province mapping
    function getStateFromZip(zip) {
        if (!zip) return null;
        const cleanZip = zip.toString().trim().toUpperCase();

        // Canadian postal codes (start with letter)
        const firstChar = cleanZip.charAt(0);
        if (/[A-Za-z]/.test(firstChar)) {
            if (firstChar === 'V') return 'BC';  // British Columbia
            if (firstChar === 'T') return 'AB';  // Alberta
            if (firstChar === 'Y') return 'YT';  // Yukon
            if (firstChar === 'X') return 'NU';  // Nunavut / Northwest Territories
            if (firstChar === 'S') return 'SK';  // Saskatchewan
            if (firstChar === 'R') return 'MB';  // Manitoba
            if ('KLMNP'.includes(firstChar)) return 'ON';  // Ontario
            if ('GHJ'.includes(firstChar)) return 'QC';  // Quebec
            if (firstChar === 'A') return 'NL';  // Newfoundland and Labrador
            if (firstChar === 'E') return 'NB';  // New Brunswick
            if (firstChar === 'B') return 'NS';  // Nova Scotia
            if (firstChar === 'C') return 'PE';  // Prince Edward Island
            return null; // Other postal codes not mapped
        }

        // US zip codes
        const zipNum = parseInt(zip, 10);
        if (isNaN(zipNum)) return null;

        // State zip code ranges
        if (zipNum >= 35000 && zipNum <= 36999) return 'AL';
        if (zipNum >= 99500 && zipNum <= 99999) return 'AK';
        if (zipNum >= 85000 && zipNum <= 86999) return 'AZ';
        if (zipNum >= 71600 && zipNum <= 72999) return 'AR';
        if (zipNum >= 90000 && zipNum <= 96699) return 'CA';
        if (zipNum >= 80000 && zipNum <= 81999) return 'CO';
        if (zipNum >= 6000 && zipNum <= 6999) return 'CT';
        if (zipNum >= 19700 && zipNum <= 19999) return 'DE';
        if (zipNum >= 32000 && zipNum <= 34999) return 'FL';
        if (zipNum >= 30000 && zipNum <= 31999) return 'GA';
        if (zipNum >= 96700 && zipNum <= 96899) return 'HI';
        if (zipNum >= 83200 && zipNum <= 83999) return 'ID';
        if (zipNum >= 60000 && zipNum <= 62999) return 'IL';
        if (zipNum >= 46000 && zipNum <= 47999) return 'IN';
        if (zipNum >= 50000 && zipNum <= 52999) return 'IA';
        if (zipNum >= 66000 && zipNum <= 67999) return 'KS';
        if (zipNum >= 40000 && zipNum <= 42799) return 'KY';
        if (zipNum >= 70000 && zipNum <= 71599) return 'LA';
        if (zipNum >= 3900 && zipNum <= 4999) return 'ME';
        if (zipNum >= 20600 && zipNum <= 21999) return 'MD';
        if (zipNum >= 1000 && zipNum <= 2799) return 'MA';
        if (zipNum >= 48000 && zipNum <= 49999) return 'MI';
        if (zipNum >= 55000 && zipNum <= 56799) return 'MN';
        if (zipNum >= 38600 && zipNum <= 39999) return 'MS';
        if (zipNum >= 63000 && zipNum <= 65999) return 'MO';
        if (zipNum >= 59000 && zipNum <= 59999) return 'MT';
        if (zipNum >= 68000 && zipNum <= 69999) return 'NE';
        if (zipNum >= 88900 && zipNum <= 89999) return 'NV';
        if (zipNum >= 3000 && zipNum <= 3899) return 'NH';
        if (zipNum >= 7000 && zipNum <= 8999) return 'NJ';
        if (zipNum >= 87000 && zipNum <= 88499) return 'NM';
        if (zipNum >= 10000 && zipNum <= 14999) return 'NY';
        if (zipNum >= 27000 && zipNum <= 28999) return 'NC';
        if (zipNum >= 58000 && zipNum <= 58999) return 'ND';
        if (zipNum >= 43000 && zipNum <= 45999) return 'OH';
        if (zipNum >= 73000 && zipNum <= 74999) return 'OK';
        if (zipNum >= 97000 && zipNum <= 97999) return 'OR';
        if (zipNum >= 15000 && zipNum <= 19699) return 'PA';
        if (zipNum >= 2800 && zipNum <= 2999) return 'RI';
        if (zipNum >= 29000 && zipNum <= 29999) return 'SC';
        if (zipNum >= 57000 && zipNum <= 57999) return 'SD';
        if (zipNum >= 37000 && zipNum <= 38599) return 'TN';
        if (zipNum >= 75000 && zipNum <= 79999) return 'TX';
        if (zipNum >= 84000 && zipNum <= 84999) return 'UT';
        if (zipNum >= 5000 && zipNum <= 5999) return 'VT';
        if (zipNum >= 22000 && zipNum <= 24699) return 'VA';
        if (zipNum >= 98000 && zipNum <= 99499) return 'WA';
        if (zipNum >= 24700 && zipNum <= 26999) return 'WV';
        if (zipNum >= 53000 && zipNum <= 54999) return 'WI';
        if (zipNum >= 82000 && zipNum <= 83199) return 'WY';
        if (zipNum >= 20000 && zipNum <= 20599) return 'DC';

        return null;
    }

    // Find sales rep based on state
    function getSalesRepForState(state) {
        if (!state || !database["sales-reps"]) return null;
        return database["sales-reps"].find(rep => rep.states.includes(state));
    }

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
        [projectNameInput, projectZipInput, systemNameInput, poolVolumeInput, turnoverValueInput, circulationRateInput].forEach(i => i.value = '');
        turnoverUnitSelect.value = 'minutes';
        resultsSection.classList.add('hidden');
        Object.values(tables).forEach(t => {
            t.body.innerHTML = '';
            t.section.classList.add('hidden');
        });
        quoteSystems.length = 0; // Clear accumulated systems
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
                    <th>NSF 2.0 Filtration Rate (gpm/sqft)</th>
                    <th>NSF 3.0 Filtration Rate (gpm/sqft)</th>
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
                    <td data-label="Model">${model.Model || 'N/A'}</td>
                    <td data-label="Drive">${driveValue}</td>
                    <td data-label="Flow Range">${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                    <td data-label="Best Efficiency">${model["Best Efficiency Flow (gpm)"] || 'N/A'}</td>
                    <td data-label="TDH @ BEP">${model["TDH @ Best Efficieny"] || 'N/A'}</td>
                    <td data-label="Docs">${pumpLinksHtml || 'N/A'}</td>
                `;
            } else if (group === 'Filter') {
                const isRMF = filterTypeSelect.value === 'RMF';
                if (isRMF) {
                    const nsf2Area = parseFloat(model["NSF 2.0 Filter Area (sq ft)"]);
                    const nsf3Area = parseFloat(model["NSF 3.0 Filter Area (sq ft)"]);
                    const nsf2Flux = (nsf2Area > 0 && circRate > 0) ? (circRate / nsf2Area).toFixed(2) : 'N/A';
                    const nsf3Flux = (nsf3Area > 0 && circRate > 0) ? (circRate / nsf3Area).toFixed(2) : 'N/A';
                    tr.innerHTML = `
                        <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                        <td data-label="Model">${model.Model || 'N/A'}</td>
                        <td data-label="Flow Range">${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                        <td data-label="NSF 2.0 Rate">${nsf2Flux}</td>
                        <td data-label="NSF 3.0 Rate">${nsf3Flux}</td>
                        <td data-label="Footprint">${model["Footprint LxWxH (Inches)"] || 'N/A'}</td>
                        <td data-label="Docs">${linksHtml || 'N/A'}</td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                        <td data-label="Model">${model.Model || 'N/A'}</td>
                        <td data-label="Flow Range">${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                        <td data-label="Footprint">${model["Footprint LxWxH (Inches)"] || 'N/A'}</td>
                        <td data-label="Docs">${linksHtml || 'N/A'}</td>
                    `;
                }
            } else {
                tr.innerHTML = `
                    <td><input type="checkbox" class="bom-checkbox" value="${partNum}" data-model="${model.Model}"></td>
                    <td data-label="Model">${model.Model || 'N/A'}</td>
                    <td data-label="Flow Range">${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                    <td data-label="Docs">${linksHtml || 'N/A'}</td>
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
            const modelName = cb.getAttribute('data-model');
            // Look up by Part Number first, then by Model name as fallback
            let product = products.find(p => p["Part Number"] === partNum);
            if (!product && modelName) {
                product = products.find(p => p.Model === modelName);
            }
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
            const line = `- ${cb.getAttribute('data-model')} (Part #: ${cb.value})`;
            const row = cb.closest('tr');
            const isInPumpTable = row && row.closest('#pumpTableSection');
            if (isInPumpTable && driveTypeSelect.value === 'Green Drive VFD') {
                return line + '\n  - Drive: Green Drive VFD';
            }
            return line;
        });

        if (checkedItems.length === 0) return alert('Select items first.');

        // Build system details
        const systemDetails = [];
        systemDetails.push(`- Volume: ${poolVolumeInput.value} Gal`);
        systemDetails.push(`- Turnover: ${turnoverValueInput.value} ${turnoverUnitSelect.options[turnoverUnitSelect.selectedIndex].text}`);
        systemDetails.push(`- Flow: ${circulationRateInput.value} GPM`);
        if (filterCheckbox.checked) {
            systemDetails.push(`- Filter Technology: ${filterTypeSelect.value}`);
            if (filterTypeSelect.value === 'RMF') {
                const ceilingSelect = document.getElementById('ceilingHeight');
                systemDetails.push(`- Ceiling Height: ${ceilingSelect.options[ceilingSelect.selectedIndex].text}`);
            }
        }
        if (pumpCheckbox.checked) {
            systemDetails.push(`- Pump Voltage: ${document.getElementById('pumpVoltage').value}`);
            systemDetails.push(`- Drive: ${driveTypeSelect.value}`);
        }
        if (uvCheckbox.checked) {
            systemDetails.push(`- Enclosure Rating: ${document.getElementById('nemaRating').options[document.getElementById('nemaRating').selectedIndex].text}`);
        }

        // Add current system to accumulated systems
        const systemName = systemNameInput.value || `System ${quoteSystems.length + 1}`;
        quoteSystems.push({
            name: systemName,
            details: systemDetails,
            products: checkedItems
        });

        // Build email body from all accumulated systems
        const projectDetails = [];
        if (projectNameInput.value) projectDetails.push(`Project Name: ${projectNameInput.value}`);
        if (projectZipInput.value) projectDetails.push(`Project Zip Code: ${projectZipInput.value}`);

        let emailBody = '';
        if (projectDetails.length > 0) {
            emailBody += `${projectDetails.join('\n')}\n\n`;
        }

        quoteSystems.forEach((system, index) => {
            emailBody += `=== ${system.name} ===\n`;
            emailBody += `Details:\n${system.details.join('\n')}\n\n`;
            emailBody += `Products:\n${system.products.join('\n')}`;
            if (index < quoteSystems.length - 1) {
                emailBody += '\n\n';
            }
        });

        if (projectZipInput.value) {
            emailBody += `\n\nPlease include a freight quote to zip code ${projectZipInput.value}.`;
        }

        // Build mailto URL with optional CC for sales rep
        let mailtoUrl = `mailto:kenneth.roche@xylem.com`;
        const ccEmails = [];

        // Check if zip code maps to a state with a sales rep
        if (projectZipInput.value) {
            const state = getStateFromZip(projectZipInput.value);
            const rep = getSalesRepForState(state);
            if (rep && rep.email) {
                ccEmails.push(rep.email);
            }
        }

        mailtoUrl += `?subject=${encodeURIComponent('Pump Room - Quote Request')}`;
        if (ccEmails.length > 0) {
            mailtoUrl += `&cc=${encodeURIComponent(ccEmails.join(','))}`;
        }
        mailtoUrl += `&body=${encodeURIComponent(emailBody)}`;

        const mailLink = document.createElement('a');
        mailLink.href = mailtoUrl;
        mailLink.click();

        // Clear system name for next entry
        systemNameInput.value = '';
    });

    loadDatabase();
    equipmentCheckboxes.forEach(checkbox => checkbox.addEventListener('change', handleEquipmentToggle));
    filterTypeSelect.addEventListener('change', toggleSecondaryOptions);
});

