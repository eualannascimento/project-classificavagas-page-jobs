$(function () {
    var cardsPorPagina = 240;
    var paginaAtual = 1;
    var dadosOriginais = [];
    var dadosFiltrados = [];

    $.getJSON("assets/data/json/open_jobs.json", function (data) {
        dadosOriginais = data;
        dadosFiltrados = dadosOriginais;

        var cardsContainer = $("#cards-container");
        var linksPorGrupo = 10; // Número de links de página exibidos por vez
        var totalLinks = Math.ceil(dadosFiltrados.length / cardsPorPagina); // Total de links de página

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
                var cardHTML =
                    '<div class="flex items-start rounded-xl bg-white p-4 outline-solid shadow-lg m-4">' +
                        '<div class="flex items-center justify-center">' +
                        '</div>' +

                        '<div class="ml-4">' +
                            '<h1 class="font-semibold text-5xl">' + item.title + '</h1>' +
                            '<p class="mt-2 text-3xl text-gray-500">' + item.level + '</p>' +
                            '<p class="mt-2 text-3xl text-gray-500">' + item.category + '</p>' +
                        '</div>' +
                    '</div>';

                cardsContainer.append(cardHTML);
            }

            // Adicionar evento de clique nos cards
            cardsContainer.find('.card').click(function () {
                var url = $(this).data('url');
                window.open(url, '_blank');
            });
        }

        exibirCards(paginaAtual);
    });
});


exibirCards(paginaAtual);
