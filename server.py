# server.py
from flask import Flask, jsonify
from flask_cors import CORS
import os
from routes.stock_routes import stock_routes

app = Flask(__name__)
CORS(app)

# Register routes
app.register_blueprint(stock_routes, url_prefix='/api/stocks')

# Error handling
@app.errorhandler(500)
def server_error(error):
    return jsonify({"message": "Something went wrong!"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=5000, debug=True)
