# Sticker Lab – Planejamento de cartelas A4/A5/A6

Aplicação em estilo duolingo/neumorfismo para organizar e agrupar adesivos (die-cut e fundo transparente) em folhas A4, A5 ou A6. Faça upload de vários PNGs, defina contorno e margem individual, quantidade por arte, unidade desejada (px, mm ou cm) e veja o live preview ocupar a folha inteira.

## Como executar
1. Instale dependências do servidor (Flask):
   ```bash
   pip install flask
   ```
2. Inicie o app em modo local:
   ```bash
   python app.py
   ```
3. Abra `http://localhost:8000` para usar o planner com preview e packing automático.

## Recursos rápidos
- Upload múltiplo com leitura da proporção da imagem.
- Margem externa, espaçamento entre adesivos e contorno configurável por sticker.
- Medidas em px/mm/cm e tamanhos de folha A4, A5 ou A6 com orientação retrato/paisagem.
- Algoritmo que rotaciona e organiza para economizar papel, com múltiplas páginas quando necessário.
