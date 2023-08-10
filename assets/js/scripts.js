$(function () {
    const cardsPorPagina = 50;
    let paginaAtual = 1;
    let dadosOriginais = [];
    let dadosFiltrados = [];

    $.getJSON("assets/data/json/open_jobs.json", (data) => {
        dadosOriginais = data.map((item, index) => {
            item.id = index + 1;
            return item;
        });

        dadosFiltrados = [...dadosOriginais];

        const cardsContainer = $("#cards-container");

        const exibirCards = (pagina) => {
            cardsContainer.empty();

            const start = (pagina - 1) * cardsPorPagina;
            const end = start + cardsPorPagina;

            dadosFiltrados.slice(start, end).forEach((item) => {
                const isCardClicked = localStorage.getItem('card_' + item.id) === 'true';

                const formatarData = (data) => {
                    const [ano, mes, dia] = data.split('-');
                    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                }

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
            });


            cardsContainer.find('.col-span-1').click(function () {
                var card = $(this);

                card.addClass('card-clicked');
                var itemId = card.find('a').data('item-id');
                localStorage.setItem('card_' + itemId, 'true');
                atualizarExibicao()
            });
        }

        function createFilterContainers(dadosOriginais, filterProperties, filterNames) {
            var filterData = {};

            function filtrarDados() {
                var filteredData = dadosOriginais.slice();

                for (var property in filterData) {
                    var selectedValues = filterData[property];
                    if (selectedValues && selectedValues.length > 0) {
                        filteredData = filteredData.filter(function (item) {
                            return selectedValues.includes(item[property]);
                        });
                    }
                }

                dadosFiltrados = filteredData;
                totalLinks = Math.ceil(dadosFiltrados.length / cardsPorPagina);
                paginaAtual = 1;

                var totalVagas = dadosOriginais.length;
                var vagasFiltradas = dadosFiltrados.length;


                document.getElementById('filteredValue').textContent = 'Quantidade de Vagas: ' + vagasFiltradas + '/' + totalVagas;
                atualizarExibicao();

            }
            filtrarDados();

            function updateFilters() {
                filterProperties.forEach(function (property) {
                    var filterSelect = document.getElementById(property + 'Filter');
                    var selectedValues = Array.from(filterSelect.selectedOptions, option => option.value);

                    if (selectedValues.includes('__select_all__')) {
                        selectedValues = filterData[property] = Array.from(filterSelect.options).map(function (option) {
                            return option.value;
                        });
                        filterSelect.querySelector('option[value="__select_all__"]').selected = true;
                    } else {
                        if (filterData[property] && filterData[property].includes('__select_all__')) {
                            Array.from(filterSelect.options).forEach(function (option) {
                                option.selected = option.value === '__select_all__';
                            });
                        }
                        filterData[property] = selectedValues.length > 0 ? selectedValues : null;
                    }
                });

                filtrarDados();
            }

            function limparTodosOsFiltros() {
                filterProperties.forEach(function (property) {
                    var filterSelect = document.getElementById(property + 'Filter');
                    Array.from(filterSelect.options).forEach(function (option) {
                        option.selected = false;
                    });
                    filterData[property] = null;
                });

                filtrarDados();
            }

            filterProperties.forEach(function (property, index) {
                var filterValues = dadosOriginais.map(function (item) {
                    return item[property];
                }).filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                });

                filterValues.sort(function (a, b) {
                    return a.localeCompare(b);
                });

                var filterContainer = document.getElementById('filterContainer');

                var label = document.createElement('label');
                label.setAttribute('for', property + 'Filter');
                label.textContent = filterNames[index] + ': ';
                filterContainer.appendChild(label);

                var filterMenuHTML = '<div class="relative w-full">';
                filterMenuHTML += '<select id="' + property + 'Filter" multiple class="form-multiselect w-full bg-gray-700 text-white p-2 rounded-lg focus:border-gray-500">';
                for (var i = 0; i < filterValues.length; i++) {
                    filterMenuHTML += '<option value="' + filterValues[i] + '">' + filterValues[i] + '</option>';
                }
                filterMenuHTML += '</select>';
                filterMenuHTML += '</div>';
                filterMenuHTML += '</div>';

                filterData[property] = null;

                filterContainer.innerHTML += filterMenuHTML;
            });

            var clearFiltersButton = document.createElement('button');
            clearFiltersButton.textContent = 'Limpar Todos os Filtros';
            clearFiltersButton.classList.add('mt-4', 'py-2', 'px-4', 'bg-red-500', 'text-white', 'rounded', 'hover:bg-red-600', 'cursor-pointer', 'w-full');
            clearFiltersButton.addEventListener('click', function () {
                limparTodosOsFiltros();
            });
            filterContainer.prepend(clearFiltersButton);

            // Adicionar um elemento <br> após o botão para pular uma linha
            var breakElement = document.createElement('br');
            filterContainer.insertBefore(breakElement, clearFiltersButton.nextSibling);


            filterProperties.forEach(function (property) {
                var filterSelect = document.getElementById(property + 'Filter');
                filterSelect.addEventListener('change', function (event) {
                    updateFilters();
                });
            });
        }

        function atualizarExibicao() {
            exibirCards(paginaAtual);
        }

        createFilterContainers(
            dadosOriginais,
            ['company', 'company_type', 'level', 'category', 'remote?', 'affirmative?', 'temporary?'],
            ['Empresa', 'Ramo', 'Nível de Atuação', 'Categoria da Vaga', 'Vaga Remota?', 'Vaga Afirmativa?', 'Vaga Temporária?']
        );

        atualizarExibicao();
    });

    // Função para alternar entre modo claro e escuro
    const toggleTheme = () => {
        if ($('body').hasClass('light-theme')) {
            $('body').removeClass('light-theme');
            $('#toggleThemeBtn i').removeClass('bx-sun').addClass('bx-moon');
        } else {
            $('body').addClass('light-theme');
            $('#toggleThemeBtn i').removeClass('bx-moon').addClass('bx-sun');
        }
    };

    // Event listener para o botão de alternar tema
    $('#toggleThemeBtn').on('click', toggleTheme);
});

const toggleCollapse = (event) => {
    const parentDiv = event.currentTarget.parentElement;

    const collapsedContent = parentDiv.querySelector(".collapsed-content");
    collapsedContent.classList.toggle("hidden");

    const indicatorIcon = parentDiv.querySelector(".indicator i");
    indicatorIcon.classList.toggle("bx-chevron-down");
    indicatorIcon.classList.toggle("bx-chevron-up");
}

const labels = document.querySelectorAll(".cursor-pointer");
labels.forEach(label => {
    label.addEventListener("click", toggleCollapse);
});


async function fetchJSONModificationDate() {
    try {
        const response = await fetch('assets/data/json/open_jobs.json');
        const lastModified = response.headers.get('last-modified');
        const gmtDate = new Date(lastModified);

        const saoPauloDate = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(gmtDate);

        const formatTwoDigits = (value) => value.toString().padStart(2, '0');
        const timeString = `${formatTwoDigits(gmtDate.getHours())}:${formatTwoDigits(gmtDate.getMinutes())}`;

        const modificationDateElement = document.getElementById('modificationDate');
        modificationDateElement.textContent = `${saoPauloDate} ás ${timeString}`;
    } catch (error) {
        console.error('Erro ao buscar a data de modificação:', error);
    }
}

fetchJSONModificationDate();