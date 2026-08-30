import json
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_file

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "shared_data.json"


def default_state():
    return {
        "farms": {
            "cachoeira": [],
            "berrador": [],
        }
    }


def load_state():
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(default_state(), ensure_ascii=False, indent=2), encoding="utf-8")

    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        data = default_state()

    if not isinstance(data, dict):
        data = default_state()

    farms = data.setdefault("farms", {})
    for farm_id in ("cachoeira", "berrador"):
        farms.setdefault(farm_id, [])

    return data


def save_state(data):
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def farm_key(farm_id):
    return f"farm:{farm_id}"


def get_farm_applications(farm_id):
    state = load_state()
    return state.get("farms", {}).get(farm_id, [])


def save_farm_application(farm_id, payload):
    state = load_state()
    farm_data = state.setdefault("farms", {}).setdefault(farm_id, [])
    farm_data.insert(0, payload)
    save_state(state)
    return payload


def delete_farm_applications(farm_id):
    state = load_state()
    state.setdefault("farms", {})[farm_id] = []
    save_state(state)
    return []


def create_app():
    app = Flask(__name__, static_folder=".", static_url_path="")

    @app.get("/")
    def index():
        return send_file(BASE_DIR / "index.html")

    @app.get("/fazenda-cachoeira")
    def fazenda_cachoeira():
        return send_file(BASE_DIR / "index.html")

    @app.get("/fazenda-berrador")
    def fazenda_berrador():
        return send_file(BASE_DIR / "index.html")

    @app.get("/fazenda-cachoeira-visualizacao")
    def fazenda_cachoeira_visualizacao():
        return send_file(BASE_DIR / "visualizacao.html")

    @app.get("/visualizacao")
    def visualizacao():
        farm = request.args.get("fazenda", "cachoeira")
        if farm not in {"cachoeira", "berrador"}:
            farm = "cachoeira"
        return send_file(BASE_DIR / "visualizacao.html")

    @app.get("/visualizacao.html")
    def visualizacao_html():
        return send_file(BASE_DIR / "visualizacao.html")

    @app.get("/api/health")
    def api_health():
        return jsonify({
            "status": "ok",
            "farms": ["cachoeira", "berrador"],
            "data_file": str(DATA_FILE),
        })

    @app.get("/api/farms")
    def api_farms():
        state = load_state()
        farms = state.get("farms", {})
        return jsonify({
            "farms": [
                {"id": farm_id, "name": "Fazenda Cachoeira" if farm_id == "cachoeira" else "Fazenda Berrador", "count": len(items)}
                for farm_id, items in farms.items()
            ]
        })

    @app.get("/api/applications")
    def api_applications():
        farm_id = request.args.get("farm", "cachoeira")
        if farm_id not in {"cachoeira", "berrador"}:
            farm_id = "cachoeira"
        return jsonify(get_farm_applications(farm_id))

    @app.post("/api/applications")
    def api_create_application():
        payload = request.get_json(silent=True) or {}
        farm_id = payload.get("farm") or request.args.get("farm", "cachoeira")
        if farm_id not in {"cachoeira", "berrador"}:
            farm_id = "cachoeira"
        if not payload:
            return jsonify({"error": "payload vazio"}), 400
        saved = save_farm_application(farm_id, payload)
        return jsonify(saved), 201

    @app.delete("/api/applications")
    def api_clear_applications():
        farm_id = request.args.get("farm", "cachoeira")
        if farm_id not in {"cachoeira", "berrador"}:
            farm_id = "cachoeira"
        return jsonify(delete_farm_applications(farm_id))

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), debug=False)
