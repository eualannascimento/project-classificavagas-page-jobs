# Consumo do snapshot atomico

O build do site baixa somente `catalog_snapshot.tar.gz` da release `catalog`.
Ele extrai exatamente `open_jobs.json` e `catalog_manifest.json`, valida JSON,
contagem e SHA-256 antes de gerar artefatos. Falha encerra o build sem publicar
uma versao incompleta.
