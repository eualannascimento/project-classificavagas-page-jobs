# Bibliotecas opcionais (offline)

Para exportacao PDF com QR Code **sem depender de CDN**, copie para esta pasta:

- `jspdf.umd.min.js` - https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
- `qrcode.min.js` - https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js

Depois adicione em `index.html` **antes** dos scripts CDN:

```html
<script src="vendor/jspdf.umd.min.js"></script>
<script src="vendor/qrcode.min.js"></script>
```

Word (docx.js) continua exigindo internet na primeira exportacao (import dinamico ESM).
