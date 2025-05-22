import React, { useState } from 'react';
import { Search, AlertTriangle, TrendingUp, MapPin, Calendar, DollarSign, User, Phone, Mail, Shield, Activity, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw, Database, FileText, Building, Globe } from 'lucide-react';
import './ParticularSearch.css';

const CustomerSearch = () => {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!customerId.trim()) {
      setError('Please enter a valid Customer ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // API configurations
      const headers = {
        "Content-Type": "application/json"
      };
      const BASE_URL = "";
      // Create a session for the AML monitoring system
      const app_name = "root_agent"; // Using fixed value based on your test script
      const user_id = "user_" + Date.now(); // Generate unique user ID
      const session_id = "session_" + Date.now(); // Generate unique session ID
      
      // Create session
      const sessionUrl = `${BASE_URL}/apps/${app_name}/users/${user_id}/sessions/${session_id}`;
      const sessionBody = { "additionalProp1": {} };
      
      console.log("Creating session...");
      const sessionResponse = await fetch(sessionUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(sessionBody)
      });

      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }
      
      const sessionData = await sessionResponse.json();
      console.log("Session created successfully:", sessionData);
      
      // Send customer ID to the AML agent
      const runUrl = `${BASE_URL}/run`;
      const runData = {
        "app_name": app_name,
        "user_id": user_id,
        "session_id": session_id,
        "new_message": {
          "role": "user",
          "parts": [{
            "text": customerId
          }]
        },
        "streaming": false
      };
      
      console.log("Sending customer ID for analysis...");
      const runResponse = await fetch(runUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(runData)
      });
      
      if (!runResponse.ok) {
        throw new Error(`Failed to analyze customer: ${runResponse.status}`);
      }
      
      const analysisResult = await runResponse.json();
      console.log("Analysis result:", analysisResult);
      
      // Process the real data from the API response
      const processedData = processApiResultData(analysisResult, customerId);
      
      setCustomerData(processedData.customerDetails);
      setTransactionHistory(processedData.transactions);
      setLocationHistory(processedData.locations);
      setRiskFactors(processedData.riskFactors);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch customer data. Please check your connection and try again.');
      setLoading(false);
      console.error('Error fetching customer data:', err);
    }
  };

  // Process API result data to extract customer details, transactions, locations, and risk factors
  const processApiResultData = (apiResult, customerId) => {
    // Initialize result structure
    const result = {
      customerDetails: null,
      transactions: [],
      locations: [],
      riskFactors: []
    };
    
    try {
      // Find the report generator agent's response which contains the structured report
      const reportGeneratorResponse = apiResult.find(item => 
        item.author === 'report_generator_agent' && 
        item.content && 
        item.content.parts && 
        item.content.parts[0] && 
        item.content.parts[0].text
      );
      
      if (!reportGeneratorResponse) {
        throw new Error('No report data found in the API response');
      }
      
      // Extract the report text
      let reportText = reportGeneratorResponse.content.parts[0].text;
      
      // Clean up the report text by removing markdown code blocks
      reportText = reportText.replace(/```/g, '').trim();
      
      // Extract customer data with more robust regex patterns
      const customerMatch = reportText.match(/Customer ID:\s*([^\n]+)\nName:\s*([^\n]+)\nAccounts:\s*([^\n]+)\nPrimary Location:\s*([^\n]+)\nContact:\s*([^\n]+)/);
      if (customerMatch) {
        const contactInfo = customerMatch[5].trim();
        const emailMatch = contactInfo.match(/([^\s]+@[^\s]+)/);
        const phoneMatch = contactInfo.match(/(\+?[\d\s\-\(\)]+)/);
        
        result.customerDetails = {
          customerId: customerMatch[1].trim(),
          customerName: customerMatch[2].trim(),
          accounts: customerMatch[3].trim().split(/[,;]/).map(acc => acc.trim()),
          primaryLocation: customerMatch[4].trim(),
          contact: contactInfo,
          email: emailMatch ? emailMatch[1] : 'N/A',
          phone: phoneMatch ? phoneMatch[1].trim() : 'N/A',
        };
      }
      
      // Extract risk score with more flexible patterns
      const riskMatch = reportText.match(/Current Risk Score:\s*([^\n]+)\nPrevious Risk Score:\s*([^\n]+)\nThreshold:\s*([^\n]+)/);
      if (riskMatch) {
        result.customerDetails = {
          ...result.customerDetails,
          riskScore: parseFloat(riskMatch[1].trim()) || 0,
          previousRiskScore: parseFloat(riskMatch[2].trim()) || 0,
          riskThreshold: parseFloat(riskMatch[3].trim()) || 85
        };
      }
      
      // Extract transaction history from function responses in the API result
      let transactions = [];
      apiResult.forEach(item => {
        if (item.content && item.content.parts) {
          item.content.parts.forEach(part => {
            if (part.functionResponse && part.functionResponse.name === 'detect_large_amount_transactions') {
              const fnResponse = part.functionResponse;
              if (fnResponse.response && fnResponse.response.result) {
                fnResponse.response.result.forEach(tx => {
                  transactions.push({
                    transactionId: tx.transaction_id || `TX${Math.random().toString(36).substr(2, 9)}`,
                    date: tx.transaction_date || new Date().toISOString(),
                    amount: parseFloat(tx.amount) || 0,
                    type: tx.customer_id_send === customerId ? 'Outgoing' : 'Incoming',
                    senderId: tx.customer_id_send || 'Unknown',
                    recipientId: tx.customer_id_dest || 'Unknown',
                    senderLocation: tx.location_sender || 'Unknown',
                    recipientLocation: tx.location_receiver || 'Unknown',
                    transactionType: tx.transaction_type || 'Wire Transfer',
                    riskType: tx.risk_type || 'Standard'
                  });
                });
              }
            }
          });
        }
      });
      
      // Sort transactions by date (most recent first)
      transactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Get top 10 most recent transactions
      result.transactions = transactions.slice(0, 10);
      
      // Extract location activity based on transactions
      result.locations = result.transactions.map(tx => ({
        date: tx.date,
        location: tx.type === 'Outgoing' ? tx.recipientLocation : tx.senderLocation,
        activity: `${tx.transactionType} - ${tx.type} ${formatCurrency(tx.amount)}`
      }));
      
      // Extract risk factors from the report
      const riskFactorsMatch = reportText.match(/Risk Factors:\s*\n([\s\S]*?)(?=\n\n|\nBased on|$)/);
      if (riskFactorsMatch) {
        const riskFactorsText = riskFactorsMatch[1].trim();
        const risksList = riskFactorsText.split(/\n[-•]/).map(rf => rf.trim()).filter(rf => rf && rf.length > 10);
        
        result.riskFactors = risksList.map(risk => {
          let severity = 'Medium';
          const riskLower = risk.toLowerCase();
          if (riskLower.includes('high') || riskLower.includes('significant') || riskLower.includes('critical') || riskLower.includes('suspicious')) {
            severity = 'High';
          } else if (riskLower.includes('low') || riskLower.includes('minor')) {
            severity = 'Low';
          }
          
          return {
            factor: risk.split('.')[0].trim(),
            severity: severity,
            description: risk
          };
        });
      }
      
      // Add default risk factors if none found
      if (result.riskFactors.length === 0) {
        if (result.transactions.some(tx => tx.amount > 10000)) {
          result.riskFactors.push({
            factor: 'Large Amount Transactions', 
            severity: 'High',
            description: 'Multiple high-value transactions detected above $10,000'
          });
        }
        
        const uniqueLocations = [...new Set([
          ...result.transactions.map(tx => tx.senderLocation),
          ...result.transactions.map(tx => tx.recipientLocation)
        ])].filter(loc => loc !== 'Unknown');
        
        if (uniqueLocations.length > 2) {
          result.riskFactors.push({
            factor: 'Multi-Jurisdictional Activity', 
            severity: 'High',
            description: `Transactions across ${uniqueLocations.length} different locations: ${uniqueLocations.slice(0, 3).join(', ')}`
          });
        }
        
        if (result.transactions.some(tx => tx.senderLocation !== tx.recipientLocation)) {
          result.riskFactors.push({
            factor: 'Cross-Border Transactions', 
            severity: 'Medium',
            description: 'International wire transfers requiring enhanced monitoring'
          });
        }
      }
      
      // Add calculated fields to customer data
      if (result.customerDetails) {
        result.customerDetails.totalTransactions = result.transactions.length;
        result.customerDetails.averageTransactionAmount = result.transactions.length > 0 ? 
          result.transactions.reduce((sum, tx) => sum + tx.amount, 0) / result.transactions.length : 0;
        result.customerDetails.lastActivity = result.transactions.length > 0 ? 
          new Date(result.transactions[0].date).toISOString().split('T')[0] : 'N/A';
        result.customerDetails.accountCreationDate = '2022-01-15'; // This would ideally come from the API
      }
      
      return result;
    } catch (error) {
      console.error("Error processing API data:", error);
      
      // Return fallback structure
      return {
        customerDetails: {
          customerId: customerId,
          customerName: 'Data Processing Error',
          email: 'error@processing.data',
          phone: 'N/A',
          riskScore: 0,
          previousRiskScore: 0,
          riskThreshold: 85,
          accountCreationDate: 'N/A',
          lastActivity: 'N/A',
          totalTransactions: 0,
          averageTransactionAmount: 0,
          primaryLocation: 'Unknown',
          accounts: ['Error']
        },
        transactions: [],
        locations: [],
        riskFactors: [{
          factor: 'Data Processing Error', 
          severity: 'High',
          description: 'Failed to process API response. Please try again or contact support.'
        }]
      };
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toLocaleString()}`;
  };

  const getRiskScoreColor = (score) => {
    if (score >= 90) return 'risk-critical';
    if (score >= 70) return 'risk-high';
    if (score >= 50) return 'risk-medium';
    return 'risk-low';
  };

  const getRiskLevel = (score) => {
    if (score >= 90) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  };

  const getSeverityColor = (severity) => {
    return `severity-${severity.toLowerCase()}`;
  };

  const handleReset = () => {
    setCustomerId('');
    setCustomerData(null);
    setTransactionHistory([]);
    setLocationHistory([]);
    setRiskFactors([]);
    setError(null);
  };

  return (
    <div className="aml-container">
      {/* Header */}
      <div className="aml-header">
        <div className="aml-header-content">
          <div className="aml-header-left">
            <div className="aml-logo">
              <Shield className="aml-logo-icon" />
            </div>
            <div className="aml-title-section">
              <h1 className="aml-main-title">AML Customer Analysis</h1>
              <p className="aml-subtitle">Anti-Money Laundering Monitoring System</p>
            </div>
          </div>
          <div className="aml-header-actions">
            {customerData && (
              <button onClick={handleReset} className="aml-btn aml-btn-secondary">
                <RefreshCw className="aml-btn-icon" />
                <span>New Search</span>
              </button>
            )}
            <button className="aml-btn aml-btn-primary">
              <Database className="aml-btn-icon" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="aml-main-content">
        {/* Search Form */}
        <div className="aml-search-container">
          <form onSubmit={handleSearch} className="aml-search-form">
            <div className="aml-form-group">
              <label htmlFor="customerId" className="aml-form-label">
                Customer ID Analysis
              </label>
              <div className="aml-input-container">
                <input
                  type="text"
                  id="customerId"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
                  placeholder="Enter Customer ID (e.g., C10045, C10023)"
                  className="aml-input"
                  required
                  disabled={loading}
                />
                <Search className="aml-input-icon" />
              </div>
            </div>
            <div className="aml-form-actions">
              <button
                type="submit"
                disabled={loading || !customerId.trim()}
                className="aml-btn aml-btn-analyze"
              >
                {loading ? (
                  <>
                    <div className="aml-spinner"></div>
                    <span>Analyzing Customer...</span>
                  </>
                ) : (
                  <>
                    <Search className="aml-btn-icon" />
                    <span>Run AML Analysis</span>
                  </>
                )}
              </button>
              <div className="aml-form-info">
                <Database className="aml-info-icon" />
                <span>Real-time data from AML monitoring system</span>
              </div>
            </div>
          </form>
          
          {error && (
            <div className="aml-error-container">
              <div className="aml-error-content">
                <AlertTriangle className="aml-error-icon" />
                <div>
                  <p className="aml-error-title">Analysis Error</p>
                  <p className="aml-error-message">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {customerData && (
          <div className="aml-results-container">
            {/* Customer Profile & Risk Overview */}
            <div className="aml-grid aml-grid-profile">
              {/* Customer Profile */}
              <div className="aml-card aml-profile-card">
                <div className="aml-card-header">
                  <h2 className="aml-card-title">
                    <User className="aml-card-icon" />
                    <span>Customer Profile</span>
                  </h2>
                </div>
                <div className="aml-card-content">
                  <div className="aml-profile-grid">
                    <div className="aml-profile-section">
                      <div className="aml-profile-header">
                        <div className="aml-profile-avatar">
                          <User className="aml-avatar-icon" />
                        </div>
                        <div>
                          <p className="aml-profile-id-label">Customer ID</p>
                          <p className="aml-profile-id">{customerData.customerId}</p>
                        </div>
                      </div>
                      <div className="aml-profile-name">
                        <p className="aml-profile-name-label">Full Name</p>
                        <p className="aml-profile-name-value">{customerData.customerName}</p>
                      </div>
                      <div className="aml-contact-info">
                        <div className="aml-contact-item">
                          <Mail className="aml-contact-icon" />
                          <span>{customerData.email}</span>
                        </div>
                        <div className="aml-contact-item">
                          <Phone className="aml-contact-icon" />
                          <span>{customerData.phone}</span>
                        </div>
                        <div className="aml-contact-item">
                          <Globe className="aml-contact-icon" />
                          <span>{customerData.primaryLocation}</span>
                        </div>
                      </div>
                    </div>
                    <div className="aml-profile-stats">
                      <div className="aml-stat-grid">
                        <div className="aml-stat-item aml-stat-date">
                          <p className="aml-stat-label">Account Created</p>
                          <div className="aml-stat-value">
                            <Calendar className="aml-stat-icon" />
                            <span>{customerData.accountCreationDate}</span>
                          </div>
                        </div>
                        <div className="aml-stat-item aml-stat-date">
                          <p className="aml-stat-label">Last Activity</p>
                          <div className="aml-stat-value">
                            <Clock className="aml-stat-icon" />
                            <span>{customerData.lastActivity}</span>
                          </div>
                        </div>
                        <div className="aml-stat-item aml-stat-primary">
                          <p className="aml-stat-label">Total Transactions</p>
                          <p className="aml-stat-number">{customerData.totalTransactions}</p>
                        </div>
                        <div className="aml-stat-item aml-stat-success">
                          <p className="aml-stat-label">Avg. Amount</p>
                          <p className="aml-stat-amount">{formatCurrency(customerData.averageTransactionAmount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="aml-card aml-risk-card">
                <div className="aml-card-header">
                  <h2 className="aml-card-title">
                    <Shield className="aml-card-icon aml-risk-icon" />
                    <span>Risk Assessment</span>
                  </h2>
                </div>
                <div className="aml-card-content">
                  <div className="aml-risk-score-container">
                    <div className={`aml-risk-score ${getRiskScoreColor(customerData.riskScore)}`}>
                      {customerData.riskScore}
                    </div>
                    <p className="aml-risk-label">Risk Score</p>
                    <p className={`aml-risk-level ${getRiskScoreColor(customerData.riskScore)}`}>
                      {getRiskLevel(customerData.riskScore)} RISK
                    </p>
                    
                    <div className="aml-risk-details">
                      <div className="aml-risk-comparison">
                        <div className="aml-risk-item">
                          <span className="aml-risk-item-label">Previous Score:</span>
                          <span className="aml-risk-item-value">{customerData.previousRiskScore}</span>
                        </div>
                        <div className="aml-risk-item">
                          <span className="aml-risk-item-label">Threshold:</span>
                          <span className="aml-risk-item-value">{customerData.riskThreshold}</span>
                        </div>
                        <div className="aml-risk-trend">
                          <TrendingUp className="aml-trend-icon" />
                          <span className="aml-trend-value">
                            +{Math.abs(customerData.riskScore - customerData.previousRiskScore)} points
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="aml-card">
              <div className="aml-card-header">
                <h2 className="aml-card-title">
                  <AlertTriangle className="aml-card-icon aml-warning-icon" />
                  <span>Identified Risk Factors</span>
                </h2>
              </div>
              <div className="aml-card-content">
                <div className="aml-risk-factors-grid">
                  {riskFactors.map((risk, index) => (
                    <div key={index} className={`aml-risk-factor ${getSeverityColor(risk.severity)}`}>
                      <div className="aml-risk-factor-header">
                        <h3 className="aml-risk-factor-title">{risk.factor}</h3>
                        <span className="aml-risk-factor-severity">
                          {risk.severity}
                        </span>
                      </div>
                      <p className="aml-risk-factor-description">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="aml-card">
              <div className="aml-card-header">
                <h2 className="aml-card-title">
                  <Activity className="aml-card-icon aml-activity-icon" />
                  <span>Recent Transactions</span>
                  <span className="aml-card-subtitle">({transactionHistory.length} shown)</span>
                </h2>
              </div>
              <div className="aml-table-container">
                <table className="aml-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th>Date & Time</th>
                      <th>Amount</th>
                      <th>Direction</th>
                      <th>Counterparty</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionHistory.map((transaction) => (
                      <tr key={transaction.transactionId} className="aml-table-row">
                        <td className="aml-transaction-id">
                          {transaction.transactionId}
                        </td>
                        <td className="aml-transaction-date">
                          {formatDate(transaction.date)}
                        </td>
                        <td>
                          <div className={`aml-transaction-amount ${transaction.type === 'Outgoing' ? 'outgoing' : 'incoming'}`}>
                            {transaction.type === 'Outgoing' ? (
                              <ArrowUpRight className="aml-amount-icon" />
                            ) : (
                              <ArrowDownLeft className="aml-amount-icon" />
                            )}
                            <span>{formatCurrency(transaction.amount)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`aml-transaction-type ${transaction.type === 'Outgoing' ? 'outgoing' : 'incoming'}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="aml-counterparty">
                          {transaction.type === 'Outgoing' 
                            ? transaction.recipientId 
                            : transaction.senderId}
                        </td>
                        <td>
                          <div className="aml-location">
                            <MapPin className="aml-location-icon" />
                            <span>
                              {transaction.type === 'Outgoing' 
                                ? transaction.recipientLocation 
                                : transaction.senderLocation}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactionHistory.length === 0 && (
                  <div className="aml-empty-state">
                    <FileText className="aml-empty-icon" />
                    <h3 className="aml-empty-title">No transactions found</h3>
                    <p className="aml-empty-description">No transaction data available for this customer.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Activity */}
            <div className="aml-card">
              <div className="aml-card-header">
                <h2 className="aml-card-title">
                  <MapPin className="aml-card-icon aml-location-icon" />
                  <span>Geographic Activity</span>
                  <span className="aml-card-subtitle">({locationHistory.length} locations)</span>
                </h2>
              </div>
              <div className="aml-table-container">
                <table className="aml-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Activity Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationHistory.slice(0, 10).map((location, index) => (
                      <tr key={index} className="aml-table-row">
                        <td className="aml-location-date">
                          {formatDate(location.date)}
                        </td>
                        <td>
                          <div className="aml-location-info">
                            <div className="aml-location-marker">
                              <MapPin className="aml-marker-icon" />
                            </div>
                            <span className="aml-location-name">{location.location}</span>
                          </div>
                        </td>
                        <td className="aml-location-activity">
                          {location.activity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {locationHistory.length === 0 && (
                  <div className="aml-empty-state">
                    <MapPin className="aml-empty-icon" />
                    <h3 className="aml-empty-title">No location data</h3>
                    <p className="aml-empty-description">No geographic activity information available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Card */}
            <div className="aml-summary-card">
              <div className="aml-summary-content">
                <div className="aml-summary-icon">
                  <FileText className="aml-summary-icon-svg" />
                </div>
                <div className="aml-summary-info">
                  <h3 className="aml-summary-title">Analysis Summary</h3>
                  <div className="aml-summary-grid">
                    <div className="aml-summary-item">
                      <p className="aml-summary-label">Risk Level</p>
                      <p className={`aml-summary-value ${getRiskScoreColor(customerData.riskScore)}`}>
                        {getRiskLevel(customerData.riskScore)}
                      </p>
                    </div>
                    <div className="aml-summary-item">
                      <p className="aml-summary-label">Risk Factors Found</p>
                      <p className="aml-summary-value">{riskFactors.length}</p>
                    </div>
                    <div className="aml-summary-item">
                      <p className="aml-summary-label">Transactions Analyzed</p>
                      <p className="aml-summary-value">{transactionHistory.length}</p>
                    </div>
                  </div>
                  <div className="aml-summary-timestamp">
                    <Clock className="aml-timestamp-icon" />
                    <span>Analysis completed at {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="aml-loading-container">
            <div className="aml-loading-content">
              <div className="aml-loading-spinner"></div>
              <h3 className="aml-loading-title">Analyzing Customer Data</h3>
              <p className="aml-loading-description">Please wait while we process the AML analysis...</p>
              <div className="aml-loading-steps">
                <div className="aml-loading-step">
                  <Database className="aml-loading-step-icon" />
                  <span>Fetching customer data</span>
                </div>
                <div className="aml-loading-step">
                  <Activity className="aml-loading-step-icon" />
                  <span>Analyzing transactions</span>
                </div>
                <div className="aml-loading-step">
                  <Shield className="aml-loading-step-icon" />
                  <span>Calculating risk score</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!customerData && !loading && !error && (
          <div className="aml-empty-container">
            <div className="aml-empty-content">
              <div className="aml-empty-hero">
                <Search className="aml-empty-hero-icon" />
              </div>
              <h3 className="aml-empty-hero-title">Ready for AML Analysis</h3>
              <p className="aml-empty-hero-description">
                Enter a customer ID above to begin comprehensive anti-money laundering analysis including risk assessment, transaction history, and geographic activity patterns.
              </p>
              <div className="aml-features-grid">
                <div className="aml-feature">
                  <div className="aml-feature-icon aml-feature-icon-success">
                    <User className="aml-feature-icon-svg" />
                  </div>
                  <h4 className="aml-feature-title">Customer Profiling</h4>
                  <p className="aml-feature-description">Comprehensive customer information and account details</p>
                </div>
                <div className="aml-feature">
                  <div className="aml-feature-icon aml-feature-icon-primary">
                    <Activity className="aml-feature-icon-svg" />
                  </div>
                  <h4 className="aml-feature-title">Transaction Analysis</h4>
                  <p className="aml-feature-description">Real-time monitoring of financial transactions</p>
                </div>
                <div className="aml-feature">
                  <div className="aml-feature-icon aml-feature-icon-danger">
                    <Shield className="aml-feature-icon-svg" />
                  </div>
                  <h4 className="aml-feature-title">Risk Assessment</h4>
                  <p className="aml-feature-description">AI-powered risk scoring and factor identification</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearch;