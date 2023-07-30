//----------------------------------------------
// Functions
//----------------------------------------------
function getUniqueItems(jobs, field) {
    let items = [];
    jobs.forEach(function (job) {
        if (!items.includes(job[field])) {
            items.push(job[field]);
        }
    });

    items.sort(function (a, b) {
        return a.localeCompare(b);
    });

    // Add an empty item
    items.unshift("");

    return items.map(function (item) {
        return { Value: item, Name: item };
    });
}


//----------------------------------------------
// Load JSON
//----------------------------------------------
var jobsFile = "assets/data/json/open_jobs.json"
var jobs = (function () {
    var jobs = null;
    var lastModified = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': jobsFile,
        'dataType': "json",
        'success': function (data, textStatus, request) {
            jobs = data;

            lastModified = new Date(request.getResponseHeader("Last-Modified"));
            lastModifiedDate = lastModified.toLocaleDateString('pt-BR');
            lastModifiedHour = lastModified.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false, hour: '2-digit', minute: '2-digit' });

            document.getElementById('lastModified').innerHTML = "Última atualização: " + `${lastModifiedDate} - ${lastModifiedHour}`;
            document.getElementById('jobsCount').innerHTML = "Qtde. de Vagas (+ Filtros): " + jobs.length;
        }
    });

    return jobs;
})();


//----------------------------------------------
// Generate Controller for jsGrid
//----------------------------------------------
var db = {
    loadData: function (filter) {

        return $.grep(jobs, function (group) {

            var newJobs = Object.keys(group).reduce(function (o, k) {
                if (isNaN(group[k])) {
                    o[k] = (group[k] || "").toUpperCase();
                } else {
                    o[k] = group[k]
                }
                return o;
            }, {});


            function verifyIndex(arrayItem, arrayFilter) {
                if (arrayItem === undefined || arrayFilter === undefined || arrayFilter === "" || arrayFilter === "") {
                    return false;
                } else {
                    if (isNaN(arrayItem) || isNaN(arrayFilter)) {
                        var removedAccentArrayItem = arrayItem.normalize('NFD').replace(/\p{Diacritic}/gu, ""); // Old method: .replace(/[\u0300-\u036f]/g, "");
                        var removedAccentArrayFilter = typeof arrayFilter === "string" ? arrayFilter.normalize('NFD').replace(/\p{Diacritic}/gu, "") : "";
                        return removedAccentArrayItem.indexOf((removedAccentArrayFilter || "").toUpperCase());
                    } else {
                        if ((!!arrayItem == arrayFilter)) {
                            return 0;
                        } else {
                            return -1;
                        }
                    }
                }
            }

            return (
                verifyIndex(newJobs.title, filter.title) != -1
                & verifyIndex(newJobs.company, filter.company) != -1
                & verifyIndex(newJobs.company_type, filter.company_type) != -1
                & verifyIndex(newJobs.location, filter.location) != -1
                & verifyIndex(newJobs['remote?'], filter['remote?']) != -1
                & verifyIndex(newJobs['affirmative?'], filter['affirmative?']) != -1
                & verifyIndex(newJobs['temporary?'], filter['temporary?']) != -1
                & verifyIndex(newJobs.category, filter.category) != -1
                & verifyIndex(newJobs.level, filter.level) != -1
                & verifyIndex(newJobs.inserted_date, filter.inserted_date) != -1
            );
        });

    },
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

//----------------------------------------------
// Configure jsGrid
//----------------------------------------------
$("#jsGrid").jsGrid({
    //headerRowClass: "table-success",
    width: "85%",
    height: "45em",
    filtering: true,
    heading: true,
    editing: false,
    inserting: false,
    sorting: true,
    paging: true,
    autoload: false,
    pagerContainer: null,
    pageIndex: 1,
    pageSize: 200,
    pageButtonCount: 5,
    pagerFormat: "Páginas: {first} {prev} {pages} {next} {last} {pageIndex} de {pageCount}",
    pagePrevText: "Anterior",
    pageNextText: "Próxima",
    pageFirstText: "Primeira",
    pageLastText: "Última",
    data: jobs,
    controller: db,

    fields: [
        { name: "title", title: "Título da Vaga", type: "text", width: "30%" }, // Adicionado css: "wrap-text" aqui
        { name: "company", title: "Empresa", type: "text", width: "7%", visible: !isMobileDevice()},
        { name: "company_type", title: "Segmento", type: "text", width: "7%", visible: !isMobileDevice()},
        { name: "location", title: "Localização", type: "text", width: "10%", visible: !isMobileDevice()},
        { name: "remote?", title: "Remota?", type: "select", items: getUniqueItems(jobs, "remote?"), valueField: "Value", textField: "Name", width: "5%", visible: !isMobileDevice()},
        { name: "affirmative?", title: "Afirmativa?", type: "select", items: getUniqueItems(jobs, "affirmative?"), valueField: "Value", textField: "Name", width: "5%", visible: !isMobileDevice()},
        { name: "temporary?", title: "Temporária?", type: "select", items: getUniqueItems(jobs, "temporary?"), valueField: "Value", textField: "Name", width: "5%", visible: !isMobileDevice()},
        { name: "category", title: "Categoria da Vaga", type: "select", items: getUniqueItems(jobs, "category"), valueField: "Value", textField: "Name", width: "10%", visible: !isMobileDevice()},
        { name: "level", title: "Nível da Vaga", type: "select", items: getUniqueItems(jobs, "level"), valueField: "Value", textField: "Name", width: "10%", visible: !isMobileDevice()},
        { name: "inserted_date", title: "Data de Entrada", type: "text", width: "10%", visible: !isMobileDevice()}
    ],

    // Evento "data_loaded"
    onDataLoaded: function (args) {
        // Calculando a quantidade de linhas filtradas
        var filteredRowsCount = args.grid.data.length;

        // Atualizando a quantidade de linhas filtradas na tela
        $("#jobsCount").text("Qtde. de Vagas (+ Filtros): " + filteredRowsCount);
    },

    // Evento "filtering"
    onRefreshing: function (args) {
        // Calculando a quantidade de linhas filtradas
        var filteredRowsCount = args.grid.data.length;

        // Atualizando a quantidade de linhas filtradas na tela
        $("#jobsCount").text("Qtde. de Vagas (+ Filtros): " + filteredRowsCount);
    }
});


//----------------------------------------------
// Set default order
//----------------------------------------------
$("#jsGrid").jsGrid("sort", "inserted_date", true);


//----------------------------------------------
// Enable click to job in jsGrid
//----------------------------------------------
$(function () {
    $('#jsGrid').on({
        click: function handleClick() {
            const item = $(this).data('JSGridItem');
            if (!(typeof item === 'undefined')) {
                window.open(item.url, '_blank').focus();
            }
        },
        auxclick: function handleAuxClick() {
            const item = $(this).data('JSGridItem');
            if (!(typeof item === 'undefined')) {
                window.open(item.url, '_blank').focus();
            }
        },
    }, 'tr');
});