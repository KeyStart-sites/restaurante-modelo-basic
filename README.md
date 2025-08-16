# 🍽 Template de Cardápio Online — KeyStart

Template universal para criar cardápios online e personalizar rápido por cliente.

---

## 📂 Estrutura

```
/assets
  /css         → base.css (estrutura) + theme.css (cores do cliente)
  /js          → app.js (núcleo dinâmico)
  /data        → config.json (textos/links) e menu.json (cardápio)
  /img         → imagens locais (opcional)
index.html     → layout e ganchos de dados
```

---

## 🛠 Personalização

### 1) `assets/data/config.json`
- **siteName**, **logo**, **hero.title/subtitle**, **heroImage**
- **about**: title, image, paragraphs[], ctaPrimary/ctaSecondary
- **whatsapp**, **phone**, **email**, **address**, **mapSrc**

> Todos os botões com `data-whats-link` são preenchidos automaticamente.

### 2) `assets/data/menu.json`
Funciona nos dois formatos:

**Agrupado (por seções):**
```json
{
  "Entradas": [{ "nome": "...", "descricao": "...", "preco": 18, "imagem": "..." }],
  "PratosPrincipais": [{ "nome": "...", "preco": 48 }]
}
```

**Plano (lista única):**
```json
[
  { "categoria": "Entradas", "nome": "...", "preco": 18, "imagem": "..." }
]
```

### 3) Cores do cliente
Edite apenas `assets/css/theme.css` (variáveis em `:root`).

### 4) Logo e favicon
- Coloque a logo em `/assets/img/logo.jpg` **ou** use URL no `config.json`.
- Troque `assets/img/favicon.png` para o ícone no navegador.

---

## ✅ Boas práticas
- Imagens otimizadas (até ~200 KB) e com proporção uniforme.
- Teste no celular e desktop.
- Se o cliente **não** tiver WhatsApp, os botões ficam desativados (visual).
- Para publicar: GitHub Pages, Vercel ou Netlify.


