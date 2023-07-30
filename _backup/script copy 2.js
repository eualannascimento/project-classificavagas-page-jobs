$(function () {
    const cardsPorPagina = 100;
    let paginaAtual = 1;
    let dadosOriginais = [];
    let dadosFiltrados = [];

    $.getJSON("assets/data/json/open_jobs.json", (data) => {
        dadosOriginais = data.map((item, index) => {
            item.id = index + 1;
            return item;
        });

        dadosFiltrados = [...dadosOriginais]; // Inicialize dadosFiltrados com os dados originais

        const cardsContainer = $("#cards-container");

        // Altere sua função exibirCards para parecer com isso:
        const exibirCards = (pagina, append = false) => {
            const start = (pagina - 1) * cardsPorPagina;
            const end = start + cardsPorPagina;

            const slicedData = dadosFiltrados.slice(start, end);

            if (slicedData.length === 0) {
                if (!append) cardsContainer.empty();
                cardsContainer.append('<p>Sem novos cards</p>');
                return;
            }

            if (!append) cardsContainer.empty();


            slicedData.forEach((item) => {
                // Verifica se o card já foi clicado antes
                const isCardClicked = localStorage.getItem('card_' + item.id) === 'true';

                // Função para formatar a data no formato dd/mm/yyyy
                const formatarData = (data) => {
                    const [ano, mes, dia] = data.split('-');
                    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                }


                if (document.body.classList.contains('dark-theme')) {
                    const cardHTML =
                        `<div class="col-span-1 ${isCardClicked ? 'card-clicked' : ''}">
                    <a href="${item.url}" target="_blank" data-item-id="${item.id}">
                        <div class="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full relative">
                            <div class="text-xl font-semibold mb-3">
                                ${item['remote?'] === '01 - Sim' ? '<span class="mr-1">🏠</span>' : ''}
                                ${item['remote?'] === '02 - Não' ? '<span class="mr-1">🏢</span>' : ''}
                                ${item.title}
                            </div>
                            <div class="flex-grow mb-5">
                                <div class="flex"><p class="font-semibold">Ramo: <span class="font-normal">${item.company_type}</span></p></div>
                                <div class="flex"><p class="font-semibold">Empresa: <span class="font-normal">${item.company}</span></p></div>
                                <div class="flex"><p class="font-semibold">Nível: <span class="font-normal">${item.level}</span></p></div>
                                <div class="flex"><p class="font-semibold">Categoria: <span class="font-normal">${item.category}</span></p></div>
                            </div>
                            <div class="mt-auto pt-4 pb-2 border-t border-gray-700">
                                <p class="text-xs text-gray-400">Data: ${formatarData(item.inserted_date)}</p>
                                <p class="text-xs text-gray-400">Local da Vaga: ${item.location}</p>
                            </div>
                        </div>
                    </a>
                </div>`;
                    cardsContainer.append(cardHTML);
                } else {
                    const cardHTML =
                        `<div class="col-span-1 ${isCardClicked ? 'card-clicked' : ''}">
                            <a href="${item.url}" target="_blank" data-item-id="${item.id}">
                                <div class="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full relative">
                                    <div class="text-xl font-semibold text-gray-800 mb-3">
                                        ${item['remote?'] === '01 - Sim' ? '<span class="mr-1">🏠</span>' : ''}
                                        ${item['remote?'] === '02 - Não' ? '<span class="mr-1">🏢</span>' : ''}
                                        ${item.title}
                                    </div>
                                    <div class="flex-grow mb-5">
                                        <div class="flex"><p class="font-semibold text-gray-800">Ramo: <span class="font-normal">${item.company_type}</span></p></div>
                                        <div class="flex"><p class="font-semibold text-gray-800">Empresa: <span class="font-normal">${item.company}</span></p></div>
                                        <div class="flex"><p class="font-semibold text-gray-800">Nível: <span class="font-normal">${item.level}</span></p></div>
                                        <div class="flex"><p class="font-semibold text-gray-800">Categoria: <span class="font-normal">${item.category}</span></p></div>
                                    </div>
                                    <div class="mt-auto pt-4 pb-2 border-t border-gray-300">
                                        <p class="text-xs text-gray-600">Data: ${formatarData(item.inserted_date)}</p>
                                        <p class="text-xs text-gray-600">Local da Vaga: ${item.location}</p>
                                    </div>
                                </div>
                            </a>
                        </div>`;
                    cardsContainer.append(cardHTML);
                }

            });


            // Adicionar evento de clique nos cards
            cardsContainer.find('.col-span-1').click(function () {
                var card = $(this);

                // Marcar o card como clicado no localStorage
                card.addClass('card-clicked');
                var itemId = card.find('a').data('item-id');
                localStorage.setItem('card_' + itemId, 'true');
                atualizarExibicao()
            });

        }


        // Função para carregar mais cartões quando o usuário rola para o final da página
        $(window).scroll(function () {
            if ($(window).scrollTop() + $(window).height() == $(document).height()) {
                paginaAtual += 1;
                exibirCards(paginaAtual, true);
            }
        });


        // Função para abrir o URL do card quando clicado
        const abrirURL = (url) => {
            window.open(url, '_blank');
        }

        // Evento de clique no botão de aplicar
        $("#cards-container").on("click", ".apply-button", function () {
            const card = $(this).closest('.card');
            const url = card.data('url');
            abrirURL(url);
        });



        function createFilterContainers(dadosOriginais, filterProperties, filterNames) {
            const filterData = {};

            function filtrarDados() {
                const filteredData = dadosOriginais.filter(item => {
                    for (const property in filterData) {
                        const selectedValues = filterData[property];
                        if (selectedValues && selectedValues.length > 0 && !selectedValues.includes(item[property])) {
                            return false;
                        }
                    }
                    return true;
                });

                dadosFiltrados = filteredData;
                totalLinks = Math.ceil(dadosFiltrados.length / cardsPorPagina);
                paginaAtual = 1;

                // Atualizar a quantidade de vagas filtradas e total
                const totalVagas = dadosOriginais.length;
                const vagasFiltradas = dadosFiltrados.length;

                // Atualizar o conteúdo da div "filteredValue"
                document.getElementById('filteredValue').textContent = `Quantidade de Vagas: ${vagasFiltradas}/${totalVagas}`;

                atualizarExibicao();
                exibirFiltrosHabilitados();
            }

            function updateFilters() {
                filterProperties.forEach(property => {
                    const filterSelect = document.getElementById(property + 'Filter');
                    const selectedValues = Array.from(filterSelect.selectedOptions, option => option.value);

                    // Check if "Select All" was selected
                    if (selectedValues.includes('__select_all__')) {
                        // Set all filter values as selected
                        filterData[property] = Array.from(filterSelect.options).map(option => option.value);
                        // Select the "Select All" option
                        filterSelect.querySelector('option[value="__select_all__"]').selected = true;
                    } else {
                        // If the special option "Select All" was previously selected
                        if (filterData[property] && filterData[property].includes('__select_all__')) {
                            // Unselect all options except for the "Select All" option
                            Array.from(filterSelect.options).forEach(option => {
                                option.selected = option.value === '__select_all__';
                            });
                        }
                        filterData[property] = selectedValues.length > 0 ? selectedValues : null;
                    }
                });

                exibirFiltrosHabilitados();
                filtrarDados();
            }

            function limparTodosOsFiltros() {
                filterProperties.forEach(property => {
                    const filterSelect = document.getElementById(property + 'Filter');
                    Array.from(filterSelect.options).forEach(option => {
                        option.selected = false;
                    });
                    filterData[property] = null;
                });

                filtrarDados();
            }

            function exibirFiltrosHabilitados() {
                /*
                var filtersSelectedDiv = document.getElementById('filtersSelected2');
                filtersSelectedDiv.innerHTML = ''; // Limpa o conteúdo da div antes de adicionar o novo conteúdo
        
                var selectedFilters = filterProperties.filter(function (property) {
                    return filterData[property] && filterData[property].length > 0;
                });
        
                if (selectedFilters.length > 0) {
                    var filtersLabel = document.createElement('span');
                    filtersLabel.textContent = 'Filtros Habilitados: ';
                    filtersSelectedDiv.appendChild(filtersLabel);
        
                    var filtersList = document.createElement('ul');
                    selectedFilters.forEach(function (property) {
                        var filterValueNames = filterData[property].map(function (value) {
                            return value === '' ? 'Todos' : value;
                        });
                        var filterItem = document.createElement('li');
                        filterItem.textContent = filterNames[filterProperties.indexOf(property)] + ': ' + filterValueNames.join(', ');
                        filtersList.appendChild(filterItem);
                    });
        
                    filtersSelectedDiv.appendChild(filtersList);
                } else {
                    filtersSelectedDiv.textContent = 'Nenhum filtro selecionado';
                }
                */
            }

            filterProperties.forEach((property, index) => {
                const filterValues = dadosOriginais.map(item => item[property]).filter((value, index, self) => self.indexOf(value) === index);
                filterValues.sort((a, b) => a.localeCompare(b));

                const filterContainer = document.getElementById('filterContainer');

                // Add label to identify the multiselect with the custom name
                const label = document.createElement('label');
                label.setAttribute('for', property + 'Filter');
                label.textContent = filterNames[index] + ': '; // Use the custom filter name
                filterContainer.appendChild(label);

                const filterMenuHTML = `
                    <div class="relative w-full">
                        <select id="${property}Filter" multiple class="form-multiselect w-full bg-gray-700 text-white p-2 rounded-lg focus:border-gray-500">
                            ${filterValues.map(value => `<option value="${value}">${value}</option>`).join('')}
                        </select>
                    </div>`;
                filterData[property] = null;
                filterContainer.innerHTML += filterMenuHTML;
            });

            const clearFiltersButton = document.createElement('button');
            clearFiltersButton.textContent = 'Limpar Todos os Filtros';
            clearFiltersButton.classList.add('mt-4', 'py-2', 'px-4', 'bg-red-500', 'text-white', 'rounded', 'hover:bg-red-600', 'cursor-pointer');
            clearFiltersButton.addEventListener('click', () => {
                limparTodosOsFiltros();
                exibirFiltrosHabilitados();
            });
            filterContainer.appendChild(clearFiltersButton);

            // Add 'change' event outside the loop
            filterProperties.forEach(property => {
                const filterSelect = document.getElementById(property + 'Filter');
                filterSelect.addEventListener('change', () => {
                    updateFilters();
                });
            });

            exibirFiltrosHabilitados(); // Call the function initially to display enabled filters
        }


        // Função para atualizar a exibição dos cards e dos links de página
        function atualizarExibicao() {
            exibirCards(paginaAtual);
        }

        // Exemplo de uso:
        createFilterContainers(
            dadosOriginais,
            ['company', 'company_type', 'level', 'category', 'remote?', 'affirmative?', 'temporary?'],
            ['Empresa', 'Ramo', 'Nível de Atuação', 'Categoria da Vaga', 'Vaga Remota?', 'Vaga Afirmativa?', 'Vaga Temporária?']
        );


        // Inicializando a exibição
        atualizarExibicao();

    });
});


// Função para toggle do conteúdo colapsado
const toggleCollapse = (event) => {
    const collapsedContent = event.currentTarget.querySelector(".collapsed-content");
    collapsedContent.classList.toggle("hidden");
    const indicatorIcon = event.currentTarget.querySelector(".indicator i");
    indicatorIcon.classList.toggle("bx-chevron-down");
    indicatorIcon.classList.toggle("bx-chevron-up");
}

const collapsedDiv = document.querySelector(".p-4.bg-gray-800.rounded-lg.mb-4.cursor-pointer");
collapsedDiv.addEventListener("click", toggleCollapse);

// Add event listeners to the labels to toggle the collapsed content
const labels = document.querySelectorAll(".cursor-pointer");
labels.forEach(label => {
    label.addEventListener("click", toggleCollapse);
});


// Inicialmente, defina o tema com base na preferência armazenada, se houver
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.classList.add(savedTheme);
} else {
    // Caso contrário, defina o tema escuro como padrão
    document.body.classList.add('dark-theme');
}

// Adicionar evento de clique ao botão de tema
document.getElementById('theme-button').addEventListener('click', function () {
    // Se o tema atual for escuro, mude para claro e vice-versa
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('theme', 'light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark-theme');
    }

    // Aplicar o novo tema e atualizar os cards na página
    atualizarExibicao();
});