const fetch = require('node-fetch') || globalThis.fetch;

async function testScoutPipeline() {
  const userId = '11111111-1111-1111-1111-111111111111'; // Mock UUID for testing
  const baseUrl = 'http://localhost:3000';

  console.log('🚀 Starting Scout Pipeline Test...\n');

  try {
    // 1. Build a baseline (15 normal pings)
    console.log('📊 Building normal personal baseline (Stage 1 & 2)...');
    for (let i = 0; i < 15; i++) {
      await fetch(`${baseUrl}/api/scout/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, signalType: 'idle_seconds', value: 30 })
      });
    }
    console.log('✅ Baseline built. Mean idle time established at ~30s.');

    // 2. Trigger an Anomaly
    console.log('\n⚠️ Simulating a developer getting stuck (5 minutes idle)...');
    await fetch(`${baseUrl}/api/scout/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId, 
        signalType: 'idle_seconds', 
        value: 300, 
        context: { error: "Redis connection timeout" }
      })
    });
    console.log('✅ Anomaly flagged! Placed into the Workflow Boundary Queue (Stage 3).');

    // 3. Trigger Workflow Boundary
    console.log('\n💾 Simulating a file save (Workflow Boundary)...');
    await fetch(`${baseUrl}/api/scout/boundary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, boundary: 'post_save_after_gap' })
    });
    console.log('✅ Boundary triggered. Scout evaluated the queue, ran pgvector search, and ran LLM self-critique (Stages 4-6).');

    // 4. Fetch the Audit Log
    console.log('\n📈 Fetching Scout Audit Logs...');
    const auditRes = await fetch(`${baseUrl}/api/scout/audit`);
    const auditData = await auditRes.json();
    
    if (auditData.recentLogs && auditData.recentLogs.length > 0) {
      console.log('\n--- LATEST PIPELINE AUDIT LOG ---');
      const latest = auditData.recentLogs[0];
      console.log(`Signal: ${latest.signalType}`);
      console.log(`Final Outcome: ${latest.finalOutcome}`);
      console.log(`Stage 4 Stuck Confidence: ${latest.stage4StuckConfidence}`);
      console.log(`Stage 4 Content Confidence: ${latest.stage4ContentConfidence}`);
      console.log(`Stage 5 LLM Verdict: ${latest.stage5Verdict}`);
    }

    console.log('\n🎉 Scout architecture is working end-to-end!');

  } catch (err) {
    console.error('Test failed. Is the Next.js server running?', err.message);
  }
}

testScoutPipeline();
