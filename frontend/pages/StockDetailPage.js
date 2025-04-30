import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStockDetails, refreshStockPrice } from '../redux/stockSlice';
import CandlestickChart from '../components/CandlestickChart';
import StockTable from '../components/StockTable';
import Loader from '../components/Loader';

const StockDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedStock, loading } = useSelector(state => ({
    selectedStock: state.stocks.selectedStock,
    loading: state.stocks.loading.details
  }));
  
  // State for price alerts
  const [alertPrice, setAlertPrice] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlertMessage, setShowAlertMessage] = useState(false);

  useEffect(() => {
    dispatch(fetchStockDetails(id));
    
    // Load saved alerts from localStorage
    const savedAlerts = JSON.parse(localStorage.getItem(`stockAlerts-${id}`)) || [];
    setAlerts(savedAlerts);
    
    // Set up interval to refresh data every 2 minutes for full details
    const detailsInterval = setInterval(() => {
      dispatch(fetchStockDetails(id));
    }, 120000); // 2 minutes
    
    // Set up more frequent price checks for alerts every 30 seconds
    const priceCheckInterval = setInterval(() => {
      if (savedAlerts.length > 0) {
        dispatch(refreshStockPrice(id));
      }
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(detailsInterval);
      clearInterval(priceCheckInterval);
    };
  }, [dispatch, id]);
  
  // Check if any price alerts have been triggered
  useEffect(() => {
    if (selectedStock && alerts.length > 0) {
      const currentPrice = parseFloat(selectedStock.currprice.replace(/,/g, ''));
      
      alerts.forEach(alert => {
        const targetPrice = parseFloat(alert.price);
        
        if ((alert.condition === 'above' && currentPrice >= targetPrice) || 
            (alert.condition === 'below' && currentPrice <= targetPrice)) {
          setAlertMessage(`Alert: ${selectedStock.name} price is now ${alert.condition} ₹${alert.price}`);
          setShowAlertMessage(true);
          
          // Remove triggered alert
          const updatedAlerts = alerts.filter(a => a.id !== alert.id);
          setAlerts(updatedAlerts);
          localStorage.setItem(`stockAlerts-${id}`, JSON.stringify(updatedAlerts));
        }
      });
    }
  }, [selectedStock, alerts, id]);
  
  const handleSetAlert = (condition) => {
    if (!alertPrice || isNaN(parseFloat(alertPrice))) {
      setAlertMessage('Please enter a valid price');
      setShowAlertMessage(true);
      return;
    }
    
    const newAlert = {
      id: Date.now(),
      price: alertPrice,
      condition: condition,
      stockId: id
    };
    
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    
    // Save to localStorage
    localStorage.setItem(`stockAlerts-${id}`, JSON.stringify(updatedAlerts));
    
    setAlertPrice('');
    setAlertMessage(`Alert set: Notify when price goes ${condition} ₹${alertPrice}`);
    setShowAlertMessage(true);
  };
  
  const removeAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem(`stockAlerts-${id}`, JSON.stringify(updatedAlerts));
  };
  
  // Hide alert message after 5 seconds
  useEffect(() => {
    if (showAlertMessage) {
      const timer = setTimeout(() => {
        setShowAlertMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showAlertMessage]);

  return (
    <div className="container py-5">
      <div className="mb-4">
        <a href="/" className="btn btn-outline-primary mb-4">
          &larr; Back to Home
        </a>
      </div>
      
      {loading ? (
        <div className="text-center my-5">
          <Loader size="lg" text="Loading stock data..." />
        </div>
      ) : selectedStock ? (
        <>
          {showAlertMessage && (
            <div className="alert alert-info alert-dismissible fade show" role="alert">
              {alertMessage}
              <button type="button" className="btn-close" onClick={() => setShowAlertMessage(false)}></button>
            </div>
          )}
        
          <div className="card mb-4 shadow">
            <div className="card-body">
              <h1 className="card-title">{selectedStock.name}</h1>
              <h3 className="text-primary">Current Price: ₹{selectedStock.currprice}</h3>
              
              {/* Price Alert Section */}
              <div className="mt-4 p-3 border rounded">
                <h5>Set Price Alert</h5>
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter target price"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                  />
                  <button 
                    className="btn btn-success" 
                    onClick={() => handleSetAlert('above')}
                  >
                    Alert Above
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleSetAlert('below')}
                  >
                    Alert Below
                  </button>
                </div>
                
                {alerts.length > 0 && (
                  <div>
                    <h6>Your Price Alerts:</h6>
                    <ul className="list-group">
                      {alerts.map(alert => (
                        <li key={alert.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>Alert when price goes {alert.condition} ₹{alert.price}</span>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => removeAlert(alert.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="card mb-4 shadow">
            <div className="card-body">
              <h4 className="card-title mb-4">Price Chart</h4>
              <CandlestickChart data={selectedStock.data} />
            </div>
          </div>
          
          <div className="card shadow">
            <div className="card-body">
              <h4 className="card-title mb-4">Historical Data</h4>
              <StockTable data={selectedStock.data} />
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-warning">No data available for this stock.</div>
      )}
    </div>
  );
};

export default StockDetailPage;
