# controllers/stock_controller.py
from flask import jsonify
from utils.scraper import scrape_stock_data, scrape_current_price
import threading
import time

# List of companies
companies = [
    {"id": "bajaj-finance", "name": "Bajaj Finance"},
    {"id": "reliance-industries", "name": "Reliance Industries"},
    {"id": "infosys", "name": "Infosys"},
    {"id": "tata-consultancy-services", "name": "Tata Consultancy Services (TCS)"},
    {"id": "hdfc-bank-ltd", "name": "HDFC Bank"},
    {"id": "icici-bank-ltd", "name": "ICICI Bank"},
    {"id": "larsen---toubro", "name": "Laurson & Toubro (L&T)"},
    {"id": "state-bank-of-india", "name": "State Bank of India(SBI)"},
    {"id": "hindustan-unilever", "name": "Hindustan Unilever"},
    {"id": "bharti-airtel", "name": "Bharti Airtel"}
]

# Cache for storing scraped data
price_cache = {}

def get_all_stocks():
    try:
        # Return basic company info immediately
        response = jsonify(companies)
        
        # Start background scraping for each company
        for company in companies:
            threading.Thread(target=background_scrape, args=(company['id'],)).start()
            
        return response
    except Exception as e:
        return jsonify({"message": str(e)}), 500

def background_scrape(company_id):
    try:
        price_data = scrape_current_price(company_id)
        price_cache[company_id] = {
            "price": price_data["currentPrice"],
            "timestamp": time.time()
        }
    except Exception as e:
        print(f"Failed to scrape price for {company_id}: {str(e)}")

def get_stock_price(id):
    try:
        # Check if we have a recent cache (less than 2 minutes old)
        if id in price_cache and time.time() - price_cache[id]["timestamp"] < 120:
            return jsonify({"id": id, "price": price_cache[id]["price"]})
        
        # If no recent cache, scrape new data
        price_data = scrape_current_price(id)
        
        # Update cache
        price_cache[id] = {
            "price": price_data["currentPrice"],
            "timestamp": time.time()
        }
        
        return jsonify({"id": id, "price": price_data["currentPrice"]})
    except Exception as e:
        return jsonify({"message": str(e)}), 500

def get_stock_details(id):
    try:
        stock_data = scrape_stock_data(id)
        return jsonify(stock_data)
    except Exception as e:
        return jsonify({"message": str(e)}), 500
