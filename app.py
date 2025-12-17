from flask import Flask, jsonify, request, send_from_directory
from typing import Dict, List

app = Flask(__name__, static_folder='.', static_url_path='')


def pack_stickers(payload: Dict) -> Dict:
    sheet_width = float(payload.get("sheetWidthMm", 210))
    sheet_height = float(payload.get("sheetHeightMm", 297))
    margin = max(float(payload.get("marginMm", 5)), 0)
    gap = max(float(payload.get("gapMm", 2)), 0)
    stickers: List[Dict] = payload.get("stickers", [])

    def expanded_items():
        for sticker in stickers:
            qty = max(int(sticker.get("quantity", 1)), 0)
            base_width = float(sticker.get("widthMm", 30))
            base_height = float(sticker.get("heightMm", 30))
            contour = max(float(sticker.get("contourMm", 0)), 0)
            extra_gap = max(float(sticker.get("extraGapMm", 0)), 0)
            allow_rotation = bool(sticker.get("allowRotation", True))
            for _ in range(qty):
                yield {
                    "id": sticker.get("id"),
                    "name": sticker.get("name", "adesivo"),
                    "width": base_width + (contour * 2),
                    "height": base_height + (contour * 2),
                    "contour": contour,
                    "contourColor": sticker.get("contourColor", "#22c55e"),
                    "allowRotation": allow_rotation,
                    "extraGap": extra_gap,
                }

    pages: List[Dict] = []
    current_page: List[Dict] = []
    x = margin
    y = margin
    row_height = 0

    def start_new_page():
        nonlocal current_page, x, y, row_height
        if current_page:
            pages.append({
                "placements": current_page,
                "sheetWidth": sheet_width,
                "sheetHeight": sheet_height,
                "margin": margin,
            })
        current_page = []
        x = margin
        y = margin
        row_height = 0

    start_new_page()

    for item in expanded_items():
        placed = False
        for rotated in ([False, True] if item["allowRotation"] else [False]):
            w = item["height"] if rotated else item["width"]
            h = item["width"] if rotated else item["height"]
            inner_gap = gap + item["extraGap"]

            fits_current_row = x + w <= sheet_width - margin and y + h <= sheet_height - margin
            if fits_current_row:
                current_page.append({
                    **item,
                    "x": x,
                    "y": y,
                    "width": w,
                    "height": h,
                    "rotated": rotated,
                })
                x += w + inner_gap
                row_height = max(row_height, h)
                placed = True
                break

            new_row_y = y + row_height + inner_gap
            fits_new_row = w <= sheet_width - (margin * 2) and new_row_y + h <= sheet_height - margin
            if fits_new_row:
                x = margin
                y = new_row_y
                row_height = h
                current_page.append({
                    **item,
                    "x": x,
                    "y": y,
                    "width": w,
                    "height": h,
                    "rotated": rotated,
                })
                x += w + inner_gap
                placed = True
                break

        if not placed:
            start_new_page()
            x = margin
            y = margin
            row_height = 0
            # place on fresh page (without rotation retry loop)
            w = item["width"]
            h = item["height"]
            rotated = False
            if item["allowRotation"] and h <= sheet_width - (margin * 2) and w > sheet_width - (margin * 2):
                w, h = h, w
                rotated = True
            current_page.append({
                **item,
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "rotated": rotated,
            })
            x += w + gap + item.get("extraGap", 0)
            row_height = max(row_height, h)

    if current_page:
        pages.append({
            "placements": current_page,
            "sheetWidth": sheet_width,
            "sheetHeight": sheet_height,
            "margin": margin,
        })

    return {"pages": pages}


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/pack', methods=['POST'])
def pack_endpoint():
    payload = request.get_json(force=True)
    return jsonify(pack_stickers(payload))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
