const db = require('../config/database');
const { generateP2Payload } = require('./p2PayloadGenerator');

/**
 * Executes or simulates pushing P2 Form data to NSWS portal according to official API spec.
 * Strictly adheres to zero double pipe operators.
 */
async function pushP2ReportToNSWS(reportId, userId, username) {
  const report = db.prepare('SELECT * FROM p2_reports WHERE id = ?').get(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  const plant = db.prepare('SELECT * FROM plants WHERE id = ?').get(report.plant_id);
  if (!plant) {
    throw new Error('Plant record not found');
  }

  const settingsRow = db.prepare('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1').get();
  const settings = settingsRow ? settingsRow : {
    active_environment: 'UAT',
    uat_url: 'https://uat-nsws-mnstrportal.investindia.gov.in/nsws_license/saveP2Data',
    ppe_url: 'https://www.ppe-nodal-authority.nsws.gov.in/nsws_license/saveP2Data',
    prod_url: 'https://nsws.gov.in/nsws_license/saveP2Data',
    access_id: 'SaveP2Data',
    access_secret: 'SaveP2Data#0605_NSWS@1252',
    api_key: 'SaveP2Data#0605@AK1161',
    is_mock_mode: 1
  };

  // Determine active target URL based on environment
  let targetUrl = settings.uat_url;
  if (settings.active_environment === 'PPE') {
    targetUrl = settings.ppe_url;
  } else if (settings.active_environment === 'PRODUCTION') {
    targetUrl = settings.prod_url;
  }

  // Generate payload
  const payload = generateP2Payload(report.plant_id, report.season_name, report.month);
  const payloadJson = JSON.stringify(payload, null, 2);

  const headers = {
    'Content-Type': 'application/json',
    'access-id': settings.access_id,
    'access-secret': settings.access_secret,
    'api-key': settings.api_key
  };

  if (settings.jsession_id) {
    headers['Cookie'] = `JSESSIONID=${settings.jsession_id}`;
  }

  let responseData = null;
  let responseStatus = 200;

  if (Number(settings.is_mock_mode) === 1) {
    // Simulated NSWS Successful response matching official spec
    const epoch = Math.floor(Date.now() / 1000);
    const sws = plant.sws_id ? plant.sws_id : 'SW4267788494';
    const code = plant.plant_code ? plant.plant_code : '8901';
    const uniqueId = `${sws}_${code}_${report.month}_${epoch}`;

    responseData = {
      status: "200",
      message: "Success",
      UniqueId: uniqueId,
      environment: settings.active_environment,
      targetEndpoint: targetUrl,
      timestamp: new Date().toISOString()
    };
  } else {
    // Real external HTTP call to NSWS
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: headers,
        body: payloadJson
      });

      responseStatus = response.status;
      const responseText = await response.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (parseErr) {
        responseData = { rawResponse: responseText, status: String(responseStatus) };
      }
    } catch (netErr) {
      responseData = {
        error: 'Network connection to NSWS failed',
        details: netErr.message,
        targetEndpoint: targetUrl
      };
      responseStatus = 502;
    }
  }

  // Update report state in DB
  let newStatus = 'SUBMITTED';
  const hasUniqueId = responseData && (responseData.UniqueId || responseData.uniqueId);
  const isExplicitSuccess = responseData && responseData.message && responseData.message.toLowerCase() === 'success';
  const isAlreadySubmitted = responseData && responseData.message && responseData.message.toLowerCase().includes('already submitted');
  
  if (responseStatus === 200 && (hasUniqueId || isExplicitSuccess || isAlreadySubmitted)) {
    newStatus = 'ACCEPTED';
  } else {
    newStatus = 'REJECTED';
  }

  db.prepare(`
    UPDATE p2_reports
    SET status = ?,
        generated_payload = ?,
        submitted_at = CURRENT_TIMESTAMP,
        submitted_by = ?,
        response_log = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    newStatus,
    payloadJson,
    username ? username : 'AUTHORIZED_USER',
    JSON.stringify(responseData),
    reportId
  );

  return {
    success: responseStatus === 200,
    status: newStatus,
    targetUrl: targetUrl,
    environment: settings.active_environment,
    response: responseData,
    payload: payload
  };
}

module.exports = {
  pushP2ReportToNSWS
};
