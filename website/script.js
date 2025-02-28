let currentSort = { field: null, direction: 1 };
let selectedDirectors = new Set();
let selectedCountries = new Set();
let searchTerm = '';
let filmsData; // Global data array

document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('./data/films.json');
    filmsData = await response.json();

    initFilters();

    populateTable(filmsData);
    setupSorting();
    setupSearch();
});

// Initialize filters
function initFilters() {
    const directors = [...new Set(filmsData.flatMap(film => film.director))].sort();
    const countries = [...new Set(filmsData.flatMap(film => film.countries))].sort();

    populateFilter('director-filters', directors);
    populateFilter('country-filters', countries);

    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', updateFilters);
    });
}

// Update selected filters when a checkbox changes
function updateFilters(event) {
    const container = event.target.closest('.filter-section');
    const type = container.querySelector('h3').textContent;

    if (type === 'Directors') {
        selectedDirectors = new Set(
            Array.from(document.querySelectorAll('#director-filters input:checked'))
                .map(input => input.value)
        );
    } else if (type === 'Countries') {
        selectedCountries = new Set(
            Array.from(document.querySelectorAll('#country-filters input:checked'))
                .map(input => input.value)
        );
    }

    // If no checkboxes are selected, clear the corresponding filter
    if (type === 'Directors' && selectedDirectors.size === 0) {
        selectedDirectors.clear();
    }
    if (type === 'Countries' && selectedCountries.size === 0) {
        selectedCountries.clear();
    }

    // Redraw the table
    populateTable(applyAllFilters());
}

// Apply all active filters and return the filtered list
function applyAllFilters() {
    let result = filmsData; // Start with the full list of films

    // Apply search filter
    if (searchTerm) {
        result = result.filter(film => 
            film.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Apply director filter
    if (selectedDirectors.size > 0) {
        result = result.filter(film => 
            film.director.some(director => selectedDirectors.has(director))
        );
    }

    // Apply country filter
    if (selectedCountries.size > 0) {
        result = result.filter(film => 
            film.countries.some(country => selectedCountries.has(country))
        );
    }

    return result;
}

// Setup search functionality
function setupSearch() {
    document.getElementById('search').addEventListener('input', (e) => {
        searchTerm = e.target.value.trim();
        populateTable(applyAllFilters());
    });
}

// Populate the table with the given list of films
function populateTable(films) {
    const tbody = document.querySelector('#filmsTable tbody');
    tbody.innerHTML = films.map(film => `
        <tr>
            <td>${film.title}</td>
            <td>${film.release_year}</td>
            <td>${film.director.join(', ')}</td>
            <td>${film.box_office.toLocaleString()}</td>
            <td>${film.countries.join(', ')}</td>
        </tr>
    `).join('');
}

// Setup sorting functionality
function setupSorting() {
    document.querySelectorAll('th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const field = header.dataset.sort;
            currentSort = {
                field,
                direction: field === currentSort.field ? -currentSort.direction : 1
            };

            updateSortIndicators();
            sortAndDisplay(currentSort);
        });
    });
}

// Update sort indicators (arrows) in the table header
function updateSortIndicators() {
    document.querySelectorAll('th').forEach(header => {
        header.classList.remove('sorted-asc', 'sorted-desc');
        if (header.dataset.sort === currentSort.field) {
            header.classList.add(currentSort.direction === 1 ? 'sorted-asc' : 'sorted-desc');
        }
    });
}

// Sort and display the filtered data
function sortAndDisplay(sortConfig) {
    let dataToSort = applyAllFilters(); // Get the filtered data

    dataToSort.sort((a, b) => {
        let aVal, bVal;

        if (sortConfig.field === 'release_year' || sortConfig.field === 'box_office') {
            aVal = a[sortConfig.field];
            bVal = b[sortConfig.field];
        } else {
            aVal = getSortValue(a[sortConfig.field]);
            bVal = getSortValue(b[sortConfig.field]);
        }

        return (aVal > bVal ? 1 : -1) * sortConfig.direction;
    });

    populateTable(dataToSort);
}

// Get a normalized value for sorting
function getSortValue(field) {
    if (typeof field === 'string') return field.toLowerCase();
    if (typeof field === 'number') return field;
    return field;
}

// Populate filter sections with unique items
function populateFilter(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'filter-checkbox';
        div.innerHTML = `
            <label>
                <input type="checkbox" value="${item}"> ${item}
            </label>
        `;
        container.appendChild(div);
    });
}

// Reset all filters and show all films
function resetFilters() {
    selectedDirectors.clear();
    selectedCountries.clear();
    searchTerm = '';

    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
        checkbox.checked = false;
    });

    document.getElementById('search').value = '';

    populateTable(filmsData);
}