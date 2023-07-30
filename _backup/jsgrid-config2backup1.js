$(function () {
    var cardsPorPagina = 20;
    var paginaAtual = 1;
    var dadosOriginais = [];

    $.getJSON("assets/data/json/open_jobs.json", function (data) {
        // Adicione o atributo id aos itens do JSON
        for (var i = 0; i < data.length; i++) {
            data[i].id = i + 1; // Pode usar o índice do loop como identificador neste exemplo
        }
        dadosOriginais = data;

        var cardsContainer = $("#cards-container");
        var linksPorGrupo = 10; // Número de links de página exibidos por vez
        var totalLinks = Math.ceil(dadosOriginais.length / cardsPorPagina); // Total de links de página
        var dadosFiltrados = dadosOriginais.slice(); // Initialize dadosFiltrados with dadosOriginais data

        // Função para formatar a data no formato dd/mm/yyyy
        function formatarData(data) {
            const [ano, mes, dia] = data.split('-');
            return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }

        // Função para exibir os cards
        function exibirCards(pagina) {
            cardsContainer.empty();

            var startIndex = (pagina - 1) * cardsPorPagina;
            var endIndex = startIndex + cardsPorPagina;

            for (var i = startIndex; i < endIndex; i++) {
                if (i >= dadosFiltrados.length) {
                    break;
                }

                var item = dadosFiltrados[i];

                // Verifica se o card já foi clicado antes
                var isCardClicked = localStorage.getItem('card_' + item.id) === 'true';

                var cardHTML =
                    `<div class="col-span-1 ${isCardClicked ? 'card-clicked' : ''}">
                        <a href="${item.url}" target="_blank" data-item-id="${item.id}">
                            <div class="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full relative">
                                <h2 class="text-2xl font-semibold mb-4">
                                    ${item['remote?'] === '01 - Sim' ? '<i class="bx bx-home mr-1"></i>' : ''}
                                    ${item['remote?'] === '02 - Não' ? '<i class="bx bx-buildings mr-1"></i>' : ''}
                                    ${item.title}
                                </h2>
                                <div class="flex-grow mb-6">
                                    <div class="flex"><p class="font-semibold">Nível: <span class="font-normal">${item.level}</span></p></div>
                                    <div class="flex"><p class="font-semibold">Empresa: <span class="font-normal">${item.company}</span></p></div>
                                    <div class="flex"><p class="font-semibold">Categoria: <span class="font-normal">${item.category}</span></p></div>
                                </div>
                                <div class="mt-auto pt-4 pb-2 border-t border-gray-700">
                                    <p class="text-xs text-gray-400">Data: ${formatarData(item.inserted_date)}</p>
                                    <p class="text-xs text-gray-400">Localidade: ${item.location}</p>
                                </div>
                            </div>
                        </a>
                    </div>`;

                cardsContainer.append(cardHTML);
            }

            // Adicionar evento de clique nos cards
            cardsContainer.find('.col-span-1').click(function () {
                var card = $(this);
                var url = card.find('a').attr('href');
                abrirURL(url);

                // Marcar o card como clicado no localStorage
                card.addClass('card-clicked');
                var itemId = card.find('a').data('item-id');
                localStorage.setItem('card_' + itemId, 'true');
            });
        }

        // Função para atualizar a exibição dos cards e dos links de página
        function atualizarExibicao() {
            exibirCards(paginaAtual);
            exibirLinksPagina();
        }

        // Obtendo todas as categorias distintas
        var categories = dadosOriginais.map(function (item) {
            return item.category;
        }).filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });

        // Criando o menu de filtro com as categorias
        var filterMenuHTML = '<div class="filter-container" style="height: 50px; overflow-y: auto;"><select id="categoryFilter"><option value="">Todos</option>';
        for (var i = 0; i < categories.length; i++) {
            filterMenuHTML += '<option value="' + categories[i] + '">' + categories[i] + '</option>';
        }
        filterMenuHTML += '</select></div>';

        // Adicionando o menu de filtro no início da página
        var filterContainer = document.getElementById('filterContainer');
        filterContainer.innerHTML = filterMenuHTML;

        // Função para filtrar os cards com base nas categorias selecionadas
        function filtrarCards() {
            var selectedCategory = categoryFilterSelect.value;
            var selectedLevel = levelFilterSelect.value;

            dadosFiltrados = dadosOriginais.filter(function (item) {
                if (selectedCategory !== '' && selectedLevel !== '') {
                    return item.category === selectedCategory && item.level === selectedLevel;
                } else if (selectedCategory !== '') {
                    return item.category === selectedCategory;
                } else if (selectedLevel !== '') {
                    return item.level === selectedLevel;
                } else {
                    return true;
                }
            });

            totalLinks = Math.ceil(dadosFiltrados.length / cardsPorPagina);
            paginaAtual = 1;

            // Atualizando a exibição
            atualizarExibicao();
        }

        // Obtendo uma referência ao elemento do filtro no HTML para a propriedade category
        var categoryFilterSelect = document.getElementById('categoryFilter');

        // Adicionando um ouvinte de evento para capturar a seleção do usuário para a propriedade category
        categoryFilterSelect.addEventListener('change', filtrarCards);

        // Obtendo todos os níveis distintos
        var levels = dadosOriginais.map(function (item) {
            return item.level;
        }).filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });

        // Criando o menu de filtro com os níveis
        var levelFilterMenuHTML = '<div class="filter-container" style="height: 50px; overflow-y: auto;"><select id="levelFilter"><option value="">Todos</option>';
        for (var i = 0; i < levels.length; i++) {
            levelFilterMenuHTML += '<option value="' + levels[i] + '">' + levels[i] + '</option>';
        }
        levelFilterMenuHTML += '</select></div>';

        // Adicionando o menu de filtro no início da página
        filterContainer.innerHTML += levelFilterMenuHTML;

        // Obtendo uma referência ao elemento do filtro no HTML para a propriedade level
        var levelFilterSelect = document.getElementById('levelFilter');

        // Adicionando um ouvinte de evento para capturar a seleção do usuário para a propriedade level
        levelFilterSelect.addEventListener('change', filtrarCards);

        // Função para abrir o URL do card quando clicado
        function abrirURL(url) {
            window.open(url, '_blank');
        }

        // Evento de clique no botão de aplicar
        $("#cards-container").on("click", ".apply-button", function () {
            var card = $(this).closest('.card');
            var url = card.data('url');
            abrirURL(url);
        });

        // Inicializando a exibição
        atualizarExibicao();
    });
});