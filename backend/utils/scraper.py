# utils/scraper.py
import requests
import json
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def scrape_stock_data(stock_id):
    # Bright Data API configuration
    headers = {
        'Authorization': 'Bearer 86697e33de87ba657c937089e9b02ccabe5c23f99170841e0b6289e350553cde',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'zone': 'web_unlocker',
        'url': f'https://in.investing.com/equities/{stock_id}-historical-data',
        'format': 'raw',
        'method': 'GET',
        'country': 'IN'
    }
    
    try:
        # Fetch data from Bright Data API
        response = requests.post('https://api.brightdata.com/request', headers=headers, json=payload)
        response.raise_for_status()
        html_content = response.text
        
        # Setup Selenium with headless Chrome
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        driver = webdriver.Chrome(options=chrome_options)
        
        try:
            # Load the HTML content into Selenium
            driver.get("data:text/html;charset=utf-8," + html_content)
            
            # Wait for the table selector to ensure dynamic content is loaded
            try:
                WebDriverWait(driver, 60).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, '.freeze-column-w-1'))
                )
            except Exception:
                print('Error: Table selector not found within the timeout period.')
                driver.quit()
                raise Exception('Failed to load stock data table')
            
            # Extract the final page content after Selenium processes dynamic elements
            final_content = driver.page_source
            soup = BeautifulSoup(final_content, 'html.parser')
            
            # Extract company name and current price
            company_name = soup.select_one("h1.mb-2\\.5.inline.text-left.text-xl.font-bold.leading-7.text-\\[\\#232526\\]").text.strip()
            current_price = soup.select_one("div.text-5xl\\/9.font-bold.text-\\[\\#232526\\][data-test='instrument-price-last']").text.strip()
            
            # Parse table rows
            rows = soup.select('table tbody tr')
            data = []
            valid_count = 0
            
            for row in rows:
                if valid_count >= 21:  # Stop after 21 valid entries
                    break
                    
                cells = row.select('td')
                if len(cells) < 7:
                    continue
                    
                date = cells[0].text.strip()
                price_str = cells[1].text.strip().replace(',', '')
                open_str = cells[2].text.strip().replace(',', '')
                high_str = cells[3].text.strip().replace(',', '')
                low_str = cells[4].text.strip().replace(',', '')
                volume = cells[5].text.strip()
                change_percent = cells[6].text.strip()
                
                try:
                    price = float(price_str)
                    open_val = float(open_str)
                    high = float(high_str)
                    low = float(low_str)
                except ValueError:
                    continue  # Skip if any numeric field is invalid
                
                data.append({
                    "date": date,
                    "price": price,
                    "open": open_val,
                    "high": high,
                    "low": low,
                    "volume": volume,
                    "changePercent": change_percent
                })
                valid_count += 1
            
            # Prepare structured output
            output = {
                "name": company_name,
                "currprice": current_price,
                "data": data
            }
            
            driver.quit()
            return output
            
        except Exception as e:
            driver.quit()
            raise e
            
    except Exception as e:
        print(f"Error occurred while scraping {stock_id}: {str(e)}")
        raise e

def scrape_current_price(stock_id):
    headers = {
        'Authorization': 'Bearer 86697e33de87ba657c937089e9b02ccabe5c23f99170841e0b6289e350553cde',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'zone': 'web_unlocker',
        'url': f'https://in.investing.com/equities/{stock_id}',
        'format': 'raw',
        'method': 'GET',
        'country': 'IN'
    }
    
    try:
        response = requests.post('https://api.brightdata.com/request', headers=headers, json=payload)
        response.raise_for_status()
        html_content = response.text
        
        soup = BeautifulSoup(html_content, 'html.parser')
        current_price = soup.select_one("div.text-5xl\\/9.font-bold.text-\\[\\#232526\\][data-test='instrument-price-last']").text.strip()
        
        return {"id": stock_id, "currentPrice": current_price}
        
    except Exception as e:
        print(f"Error occurred while scraping current price for {stock_id}: {str(e)}")
        raise e
