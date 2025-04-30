# routes/stock_routes.py
from flask import Blueprint, jsonify, request
from controllers.stock_controller import get_all_stocks, get_stock_price, get_stock_details

stock_routes = Blueprint('stock_routes', __name__)

@stock_routes.route('/', methods=['GET'])
def all_stocks():
    return get_all_stocks()

@stock_routes.route('/<id>/price', methods=['GET'])
def stock_price(id):
    return get_stock_price(id)

@stock_routes.route('/<id>', methods=['GET'])
def stock_details(id):
    return get_stock_details(id)
