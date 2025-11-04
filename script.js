document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - using new logic with Turnover and Cart button.");

    // --- Database ---
    let database = [];
    let allModelData = new Map();

    // --- Element Selection ---
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    
    const poolVolumeInput = document.getElementById('poolVolume');
    const circulationRateInput = document.getElementById('circulationRate');
    const turnoverResultSection = document.getElementById('turnoverResultSection');
    const turnoverResultText = document.getElementById('turnoverResultText');
    
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsBody = document.getElementById('results-body');

    // --- NEW: Add to Cart Button ---
    const addToCartButton = document.getElementById('addToCartButton');

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
            resultsSection.classList.add('hidden');
            noResultsMessage.classList.add('hidden');
            turnoverResultSection.classList.add('hidden');
            addToCartButton.classList.add('hidden'); // Hide cart button
            resultsBody.innerHTML = '';
        });
    });

    // --- Calculate Button Listener ---
    calculateButton.addEventListener('click', () => {
        allModelData.clear();
        resultsBody.innerHTML = ''; 
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');
        turnoverResultSection.classList.add('hidden');
        addToCartButton.classList.add('hidden'); // Hide on new calc
        
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

        const turnoverTime = poolVolume / circRate;
        turnoverResultText.textContent = `${turnoverTime.toFixed(2)} minutes`;
        turnoverResultSection.classList.remove('hidden');

        const checkedGroups = Array.from(equipmentCheckboxes)
                                   .filter(cb => cb.checked)
                                   .map(cb => cb.value);

        if (checkedGroups.length === 0) {
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
        if (models.length === 0 && Array.from(equipmentCheckboxes).some(cb => cb.checked)) {
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');
        addToCartButton.classList.remove('hidden'); // Show cart button

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
            const partNumber = model["Part Number"] || ''; // Get part number
            
            const specLink = buildLink(model['Written Specification'], 'Spec');
            const cutSheetLink = buildLink(model['Cut Sheet'], 'Cut Sheet');
            const gaLink = buildLink(model['GA'], 'GA');
            const cadLink = buildLink(model['CAD'], 'CAD');

            const linksHtml = [specLink, cutSheetLink, gaLink, cadLink].filter(link => link).join(' ');

            // --- !!! NEW <td> ADDED for checkbox !!! ---
            tr.innerHTML = `
                <td class="select-column" data-label="Select">
                    <input type="checkbox" class="bom-checkbox" value="${partNumber}">
                </td>
                <td data-label="Description">${model["Equipment Type"] || 'N/A'}</td>
                <td data-label="Part Number">${partNumber || 'N/A'}</td>
                <td data-label="Model">${model.Model || 'N/A'}</td>
                <td data-label="Flowrate Range (GPM)">${flowRange}</td>
                <td data-label="Downloads" class="downloads-cell">${linksHtml.length > 0 ? linksHtml : 'N/A'}</td>
            `;
            
            resultsBody.appendChild(tr);
        });
    }

    // --- !!! NEW EVENT LISTENER FOR CART BUTTON !!! ---
    addToCartButton.addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('.bom-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            alert('Please select at least one item to add to the cart.');
            return;
        }

        const partNumberList = [];
        checkedBoxes.forEach(box => {
            if (box.value) { // Only add if the part number isn't empty
                partNumberList.push(box.value);
            }
        });

        if (partNumberList.length === 0) {
            alert('The selected items do not have part numbers to add.');
            return;
        }

        // --- This is the "connect to ecommerce" part ---
        // 1. Log for developer
        console.log('Part numbers to add to cart:', partNumberList);

        // 2. Create a hypothetical URL to send to your e-commerce site
        // (Replace 'https://your-ecommerce-site.com/cart/add' with the real URL)
        const baseUrl = 'https://your-ecommerce-site.com/cart/add';
        const partsQuery = partNumberList.join(','); // e.g., "1003-8647,GRDN-3"
        const ecommerceUrl = `${baseUrl}?parts=${encodeURIComponent(partsQuery)}`;

        // 3. Show the user what's happening (for this demo)
        alert(`The following part numbers would be sent to the cart:\n${partNumberList.join('\n')}\n\nRedirecting to:\n${ecommerceUrl}`);
        
        // 4. (Optional) To automatically redirect the user, uncomment the line below:
        // window.location.href = ecommerceUrl; 
    });


    // --- Initialize ---
    loadDatabase();
    toggleSecondaryOptions();
});
